import { supabase } from '@/integrations/supabase/client';

export interface UserProgress {
  id?: string;
  user_id: string;
  course_id: string;
  progress_percentage: number;
  completed_modules: number;
  total_modules: number;
  is_completed: boolean;
  last_accessed: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserCertificate {
  id?: string;
  user_id: string;
  course_id: string;
  certificate_title: string;
  certificate_description?: string;
  assessment_score: number;
  passed_assessment: boolean;
  issued_date: string;
  certificate_url?: string;
  verification_code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const userProgressService = {
  // Get user progress for a specific course
  async getUserProgress(userId: string, courseId: string): Promise<UserProgress | null> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user progress:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProgress:', error);
      return null;
    }
  },

  // Get all user progress
  async getAllUserProgress(userId: string): Promise<UserProgress[]> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching all user progress:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllUserProgress:', error);
      return [];
    }
  },

  // Create or update user progress
  async upsertUserProgress(progress: Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>): Promise<UserProgress> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          ...progress,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting user progress:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in upsertUserProgress:', error);
      throw error;
    }
  },

  // Update course progress
  async updateCourseProgress(
    userId: string, 
    courseId: string, 
    progressPercentage: number, 
    completedModules: number,
    totalModules: number
  ): Promise<UserProgress> {
    const isCompleted = progressPercentage >= 100;
    
    return this.upsertUserProgress({
      user_id: userId,
      course_id: courseId,
      progress_percentage: progressPercentage,
      completed_modules: completedModules,
      total_modules: totalModules,
      is_completed: isCompleted,
      last_accessed: new Date().toISOString()
    });
  },

  // Mark course as completed
  async markCourseCompleted(userId: string, courseId: string): Promise<UserProgress> {
    return this.upsertUserProgress({
      user_id: userId,
      course_id: courseId,
      progress_percentage: 100,
      completed_modules: 1,
      total_modules: 1,
      is_completed: true,
      last_accessed: new Date().toISOString()
    });
  },

  // Get user certificates
  async getUserCertificates(userId: string): Promise<UserCertificate[]> {
    try {
      const { data, error } = await supabase
        .from('user_certificates')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('issued_date', { ascending: false });

      if (error) {
        console.error('Error fetching user certificates:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserCertificates:', error);
      return [];
    }
  },

  // Create a new certificate
  async createCertificate(certificate: Omit<UserCertificate, 'id' | 'created_at' | 'updated_at'>): Promise<UserCertificate> {
    try {
      const { data, error } = await supabase
        .from('user_certificates')
        .insert({
          ...certificate,
          verification_code: this.generateVerificationCode(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating certificate:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createCertificate:', error);
      throw error;
    }
  },

  // Create certificate after assessment completion
  async createCertificateFromAssessment(
    userId: string,
    courseId: string,
    assessmentScore: number,
    passedAssessment: boolean,
    certificateTitle: string,
    certificateDescription?: string
  ): Promise<UserCertificate | null> {
    if (!passedAssessment) {
      console.log('Assessment not passed, no certificate created');
      return null;
    }

    try {
      const certificate = await this.createCertificate({
        user_id: userId,
        course_id: courseId,
        certificate_title: certificateTitle,
        certificate_description: certificateDescription,
        assessment_score: assessmentScore,
        passed_assessment: passedAssessment,
        issued_date: new Date().toISOString(),
        verification_code: this.generateVerificationCode(),
        is_active: true
      });

      console.log('Certificate created successfully:', certificate);
      return certificate;
    } catch (error) {
      console.error('Error creating certificate from assessment:', error);
      return null;
    }
  },

  // Generate verification code for certificates
  generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Get certificate by verification code
  async getCertificateByVerificationCode(verificationCode: string): Promise<UserCertificate | null> {
    try {
      const { data, error } = await supabase
        .from('user_certificates')
        .select('*')
        .eq('verification_code', verificationCode)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching certificate by verification code:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getCertificateByVerificationCode:', error);
      return null;
    }
  },

  // Get user statistics
  async getUserStats(userId: string): Promise<{
    totalCourses: number;
    completedCourses: number;
    totalCertificates: number;
    averageProgress: number;
  }> {
    try {
      const [progressData, certificatesData] = await Promise.all([
        this.getAllUserProgress(userId),
        this.getUserCertificates(userId)
      ]);

      const totalCourses = progressData.length;
      const completedCourses = progressData.filter(p => p.is_completed).length;
      const totalCertificates = certificatesData.length;
      const averageProgress = totalCourses > 0 
        ? Math.round(progressData.reduce((sum, p) => sum + p.progress_percentage, 0) / totalCourses)
        : 0;

      return {
        totalCourses,
        completedCourses,
        totalCertificates,
        averageProgress
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return {
        totalCourses: 0,
        completedCourses: 0,
        totalCertificates: 0,
        averageProgress: 0
      };
    }
  }
};
