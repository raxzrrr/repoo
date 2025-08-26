import { generateConsistentUUID } from '@/utils/userUtils';

export interface UserLearningData {
  id?: string;
  user_id?: string;
  course_id?: string;
  progress?: Record<string, any>;
  completed_modules_count?: number;
  total_modules_count?: number;
  last_assessment_score?: number;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  assessment_attempted?: boolean;
  assessment_passed?: boolean;
  assessment_score?: number;
  assessment_completed_at?: string;
  completed_and_passed?: boolean; // New computed column
}

export const learningService = {
  async fetchUserLearningData(clerkUserId: string, totalModules: number, courseId: string): Promise<UserLearningData | null> {
    try {
      const userId = generateConsistentUUID(clerkUserId);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/learning-service`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetch',
          user_id: userId,
          course_id: courseId,
          total_modules: totalModules
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching learning data:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data as UserLearningData;
    } catch (error) {
      console.error('Error in fetchUserLearningData:', error);
      return null;
    }
  },

  async updateModuleProgress(
    clerkUserId: string,
    courseId: string,
    courseProgress: Record<string, any>,
    completedModulesCount: number,
    totalModules: number
  ): Promise<UserLearningData> {
    try {
      const userId = generateConsistentUUID(clerkUserId);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/learning-service`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateProgress',
          user_id: userId,
          course_id: courseId,
          progress: courseProgress,
          completed_modules_count: completedModulesCount,
          total_modules: totalModules
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating module progress:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data as UserLearningData;
    } catch (error) {
      console.error('Error updating module progress:', error);
      throw error;
    }
  },

  async updateAssessmentScore(clerkUserId: string, courseId: string, score: number): Promise<UserLearningData> {
    try {
      const userId = generateConsistentUUID(clerkUserId);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/learning-service`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateAssessment',
          user_id: userId,
          course_id: courseId,
          score: score
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating assessment score:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data as UserLearningData;
    } catch (error) {
      console.error('Error updating assessment score:', error);
      throw error;
    }
  }
};