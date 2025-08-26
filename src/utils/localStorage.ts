// Local storage utilities for persistent data across browser sessions

interface LocalUserData {
  // Interview data
  interviewSessions: number;
  currentStreak: number;
  lastInterviewDate: string | null;
  totalInterviewTime: number;
  
  // Interview details for calculations
  completedInterviews: Array<{
    id: string;
    interview_type: string;
    overall_score: number;
    created_at: string;
    session_status: string;
  }>;
  
  // Assessment results
  assessmentResults: Array<{
    courseId: string;
    score: number;
    passed: boolean;
    completedAt: string;
  }>;
  
  // Course progress
  courseProgress: Array<{
    courseId: string;
    progressPercentage: number;
    completedModules: number;
    totalModules: number;
    isCompleted: boolean;
    lastAccessed: string;
  }>;
  
  // Certificates
  certificates: Array<{
    id: string;
    courseId: string;
    certificateTitle: string;
    certificateDescription?: string;
    assessmentScore: number;
    passedAssessment: boolean;
    issuedDate: string;
    verificationCode: string;
  }>;
  
  // Weekly progress (last 4 weeks)
  weeklyProgress: Array<{
    week: string;
    interviews: number;
    score: number;
    timeSpent: number;
  }>;
  
  // Skills breakdown
  skillsBreakdown: Array<{
    skill: string;
    score: number;
    improvement: number;
    color: string;
  }>;
  
  // Calculated stats
  stats: {
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    certificatesEarned: number;
    totalCourses: number;
    completedCourses: number;
    averageProgress: number;
  };
}

const USER_DATA_KEY = 'mockinvi_user_data';

export const localStorageUtils = {
  // Get user data from local storage
  getUserData(): LocalUserData {
    try {
      const data = localStorage.getItem(USER_DATA_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    
    // Return default data if nothing exists
    return {
      interviewSessions: 0,
      currentStreak: 0,
      lastInterviewDate: null,
      totalInterviewTime: 0,
      completedInterviews: [],
      assessmentResults: [],
      courseProgress: [],
      certificates: [],
      weeklyProgress: [],
      skillsBreakdown: [],
      stats: {
        totalInterviews: 0,
        completedInterviews: 0,
        averageScore: 0,
        certificatesEarned: 0,
        totalCourses: 0,
        completedCourses: 0,
        averageProgress: 0
      }
    };
  },

  // Save user data to local storage
  saveUserData(data: Partial<LocalUserData>): void {
    try {
      const existingData = this.getUserData();
      const updatedData = { ...existingData, ...data };
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  // Add completed interview
  addCompletedInterview(interview: {
    id: string;
    interview_type: string;
    overall_score: number;
    created_at: string;
    session_status: string;
  }): void {
    const data = this.getUserData();
    data.completedInterviews.push(interview);
    data.interviewSessions += 1;
    data.lastInterviewDate = new Date().toISOString();
    this.updateStreak();
    this.calculateStats();
    this.calculateWeeklyProgress();
    this.calculateSkillsBreakdown();
    this.saveUserData(data);
  },

  // Update current streak
  updateStreak(): void {
    const data = this.getUserData();
    const today = new Date().toISOString().split('T')[0];
    
    if (data.lastInterviewDate) {
      const lastDate = new Date(data.lastInterviewDate).toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastDate === yesterdayStr || lastDate === today) {
        // Continue streak
        if (lastDate !== today) {
          data.currentStreak += 1;
        }
      } else if (lastDate !== today) {
        // Break streak
        data.currentStreak = 1;
      }
    } else {
      // First interview
      data.currentStreak = 1;
    }
    
    data.lastInterviewDate = new Date().toISOString();
    this.saveUserData(data);
  },

  // Add assessment result
  addAssessmentResult(courseId: string, score: number, passed: boolean): void {
    const data = this.getUserData();
    const existingIndex = data.assessmentResults.findIndex(result => result.courseId === courseId);
    
    const assessmentResult = {
      courseId,
      score,
      passed,
      completedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      data.assessmentResults[existingIndex] = assessmentResult;
    } else {
      data.assessmentResults.push(assessmentResult);
    }
    
    this.saveUserData(data);
  },

  // Add certificate
  addCertificate(certificate: {
    id: string;
    courseId: string;
    certificateTitle: string;
    certificateDescription?: string;
    assessmentScore: number;
    passedAssessment: boolean;
    issuedDate: string;
    verificationCode: string;
  }): void {
    const data = this.getUserData();
    data.certificates.push(certificate);
    this.calculateStats();
    this.saveUserData(data);
  },

  // Update course progress
  updateCourseProgress(
    courseId: string,
    progressPercentage: number,
    completedModules: number,
    totalModules: number
  ): void {
    const data = this.getUserData();
    const existingIndex = data.courseProgress.findIndex(course => course.courseId === courseId);
    
    const courseData = {
      courseId,
      progressPercentage,
      completedModules,
      totalModules,
      isCompleted: progressPercentage >= 100,
      lastAccessed: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      data.courseProgress[existingIndex] = courseData;
    } else {
      data.courseProgress.push(courseData);
    }
    
    this.calculateStats();
    this.saveUserData(data);
  },

  // Calculate all stats
  calculateStats(): void {
    const data = this.getUserData();
    
    const totalInterviews = data.interviewSessions;
    const completedInterviews = data.completedInterviews.length;
    const averageScore = completedInterviews > 0 
      ? Math.round(data.completedInterviews.reduce((sum, int) => sum + (int.overall_score || 0), 0) / completedInterviews)
      : 0;
    const certificatesEarned = data.certificates.length;
    const totalCourses = data.courseProgress.length;
    const completedCourses = data.courseProgress.filter(c => c.isCompleted).length;
    const averageProgress = totalCourses > 0 
      ? Math.round(data.courseProgress.reduce((sum, c) => sum + c.progressPercentage, 0) / totalCourses)
      : 0;

    data.stats = {
      totalInterviews,
      completedInterviews,
      averageScore,
      certificatesEarned,
      totalCourses,
      completedCourses,
      averageProgress
    };
    
    this.saveUserData(data);
  },

  // Calculate weekly progress
  calculateWeeklyProgress(): void {
    const data = this.getUserData();
    const weeklyProgress = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekSessions = data.completedInterviews.filter(session => {
        const sessionDate = new Date(session.created_at);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });

      const weekScore = weekSessions.length > 0
        ? Math.round(weekSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / weekSessions.length)
        : 0;

      weeklyProgress.push({
        week: `Week ${4 - i}`,
        interviews: weekSessions.length,
        score: weekScore,
        timeSpent: weekSessions.length * 15 // Estimate 15 minutes per interview
      });
    }
    
    data.weeklyProgress = weeklyProgress;
    this.saveUserData(data);
  },

  // Calculate skills breakdown
  calculateSkillsBreakdown(): void {
    const data = this.getUserData();
    const skillsBreakdown = [];
    
    if (data.completedInterviews.length > 0) {
      const averageScore = data.stats.averageScore;
      
      // Analyze interview types to determine skill strengths
      const technicalInterviews = data.completedInterviews.filter(s => 
        s.interview_type === 'role_based' || s.interview_type === 'resume_based'
      );
      
      const hrInterviews = data.completedInterviews.filter(s => 
        s.interview_type === 'basic_hr_technical'
      );

      // Technical skills (from role-based and resume-based interviews)
      if (technicalInterviews.length > 0) {
        const techScore = Math.round(
          technicalInterviews.reduce((sum, s) => sum + (s.overall_score || 0), 0) / technicalInterviews.length
        );
        skillsBreakdown.push({
          skill: 'Technical',
          score: techScore,
          improvement: Math.max(0, techScore - averageScore),
          color: '#8B5CF6'
        });
      }

      // Communication skills (from HR interviews)
      if (hrInterviews.length > 0) {
        const hrScore = Math.round(
          hrInterviews.reduce((sum, s) => sum + (s.overall_score || 0), 0) / hrInterviews.length
        );
        skillsBreakdown.push({
          skill: 'Communication',
          score: hrScore,
          improvement: Math.max(0, hrScore - averageScore),
          color: '#06B6D4'
        });
      }

      // Problem Solving (based on overall performance)
      skillsBreakdown.push({
        skill: 'Problem Solving',
        score: averageScore,
        improvement: 0,
        color: '#10B981'
      });

      // Leadership (based on consistency and streak)
      const leadershipScore = Math.min(100, Math.max(0, data.currentStreak * 3 + averageScore * 0.7));
      skillsBreakdown.push({
        skill: 'Leadership',
        score: Math.round(leadershipScore),
        improvement: Math.max(0, leadershipScore - averageScore),
        color: '#F59E0B'
      });
    } else {
      // If no interviews completed, show overall performance
      skillsBreakdown.push({
        skill: 'Overall Performance',
        score: data.stats.averageScore,
        improvement: 0,
        color: '#8B5CF6'
      });
    }
    
    data.skillsBreakdown = skillsBreakdown;
    this.saveUserData(data);
  },

  // Get assessment result for a course
  getAssessmentResult(courseId: string) {
    const data = this.getUserData();
    return data.assessmentResults.find(result => result.courseId === courseId);
  },

  // Get all dashboard data
  getDashboardData() {
    const data = this.getUserData();
    return {
      ...data.stats,
      currentStreak: data.currentStreak,
      weeklyProgress: data.weeklyProgress,
      skillsBreakdown: data.skillsBreakdown,
      certificates: data.certificates,
      courseProgress: data.courseProgress
    };
  },

  // Clear user data (for logout)
  clearUserData(): void {
    try {
      localStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};
