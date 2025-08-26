import { useState, useEffect, useCallback } from 'react';
import { localStorageUtils } from '@/utils/localStorage';

interface DashboardData {
  // Basic stats
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  currentStreak: number;
  certificatesEarned: number;
  totalCourses: number;
  completedCourses: number;
  averageProgress: number;
  
  // Charts data
  weeklyProgress: Array<{
    week: string;
    interviews: number;
    score: number;
    timeSpent: number;
  }>;
  
  skillsBreakdown: Array<{
    skill: string;
    score: number;
    improvement: number;
    color: string;
  }>;
  
  // Additional data
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
  
  courseProgress: Array<{
    courseId: string;
    progressPercentage: number;
    completedModules: number;
    totalModules: number;
    isCompleted: boolean;
    lastAccessed: string;
  }>;
  
  // Loading and error states
  loading: boolean;
  error: string | null;
}

export const useLocalDashboardData = (): DashboardData & { 
  refreshData: () => void;
  recordInterviewCompletion: (interview: {
    id: string;
    interview_type: string;
    overall_score: number;
    created_at: string;
    session_status: string;
  }) => void;
  recordCourseProgress: (
    courseId: string,
    progressPercentage: number,
    completedModules: number,
    totalModules: number
  ) => void;
  recordAssessmentCompletion: (
    courseId: string,
    score: number,
    passed: boolean,
    certificateTitle: string,
    certificateDescription?: string
  ) => void;
  getAssessmentResult: (courseId: string) => any;
} => {
  const [data, setData] = useState<DashboardData>({
    totalInterviews: 0,
    completedInterviews: 0,
    averageScore: 0,
    currentStreak: 0,
    certificatesEarned: 0,
    totalCourses: 0,
    completedCourses: 0,
    averageProgress: 0,
    weeklyProgress: [],
    skillsBreakdown: [],
    certificates: [],
    courseProgress: [],
    loading: true,
    error: null
  });

  const loadDashboardData = useCallback(() => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      // Get all data from localStorage
      const dashboardData = localStorageUtils.getDashboardData();
      
      setData({
        ...dashboardData,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load dashboard data'
      }));
    }
  }, []);

  // Record interview completion
  const recordInterviewCompletion = useCallback((interview: {
    id: string;
    interview_type: string;
    overall_score: number;
    created_at: string;
    session_status: string;
  }) => {
    localStorageUtils.addCompletedInterview(interview);
    loadDashboardData(); // Refresh data
  }, [loadDashboardData]);

  // Record course progress
  const recordCourseProgress = useCallback((
    courseId: string,
    progressPercentage: number,
    completedModules: number,
    totalModules: number
  ) => {
    localStorageUtils.updateCourseProgress(courseId, progressPercentage, completedModules, totalModules);
    loadDashboardData(); // Refresh data
  }, [loadDashboardData]);

  // Record assessment completion and create certificate
  const recordAssessmentCompletion = useCallback((
    courseId: string,
    score: number,
    passed: boolean,
    certificateTitle: string,
    certificateDescription?: string
  ) => {
    // Store assessment result
    localStorageUtils.addAssessmentResult(courseId, score, passed);

    // Create certificate if passed
    if (passed) {
      const certificate = {
        id: `cert_${Date.now()}`,
        courseId,
        certificateTitle,
        certificateDescription,
        assessmentScore: score,
        passedAssessment: passed,
        issuedDate: new Date().toISOString(),
        verificationCode: generateVerificationCode()
      };
      
      localStorageUtils.addCertificate(certificate);
    }

    loadDashboardData(); // Refresh data
  }, [loadDashboardData]);

  // Get assessment result for a course
  const getAssessmentResult = useCallback((courseId: string) => {
    return localStorageUtils.getAssessmentResult(courseId);
  }, []);

  // Generate verification code for certificates
  const generateVerificationCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Initialize data
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    ...data,
    recordInterviewCompletion,
    recordCourseProgress,
    recordAssessmentCompletion,
    getAssessmentResult,
    refreshData: loadDashboardData
  };
};
