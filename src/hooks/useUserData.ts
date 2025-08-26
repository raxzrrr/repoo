import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { localStorageUtils } from '@/utils/localStorage';
import { userProgressService } from '@/services/userProgressService';

interface UserData {
  // Database data only (interview data moved to useRealInterviewData)
  certificatesEarned: number;
  totalCourses: number;
  completedCourses: number;
  averageProgress: number;
  
  // Combined data
  loading: boolean;
  error: string | null;
}

export const useUserData = () => {
  const { user, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    certificatesEarned: 0,
    totalCourses: 0,
    completedCourses: 0,
    averageProgress: 0,
    loading: true,
    error: null
  });

  const fetchUserData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setUserData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setUserData(prev => ({ ...prev, loading: true, error: null }));
      
      // Get database data only
      const dbStats = await userProgressService.getUserStats(user.id);

      setUserData({
        // Database data
        certificatesEarned: dbStats.totalCertificates,
        totalCourses: dbStats.totalCourses,
        completedCourses: dbStats.completedCourses,
        averageProgress: dbStats.averageProgress,
        
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Error fetching user data:', error);
      setUserData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch user data'
      }));
    }
  }, [user?.id, isAuthenticated]);

  // Record course progress
  const recordCourseProgress = useCallback(async (
    courseId: string,
    progressPercentage: number,
    completedModules: number,
    totalModules: number
  ) => {
    if (!user?.id) return;

    try {
      await userProgressService.updateCourseProgress(
        user.id,
        courseId,
        progressPercentage,
        completedModules,
        totalModules
      );
      fetchUserData(); // Refresh data
    } catch (error) {
      console.error('Error recording course progress:', error);
    }
  }, [user?.id, fetchUserData]);

  // Record assessment completion and create certificate
  const recordAssessmentCompletion = useCallback(async (
    courseId: string,
    score: number,
    passed: boolean,
    certificateTitle: string,
    certificateDescription?: string
  ) => {
    if (!user?.id) return;

    try {
      // Store assessment result locally
      localStorageUtils.addAssessmentResult(courseId, score, passed);

      // Create certificate in database if passed
      if (passed) {
        await userProgressService.createCertificateFromAssessment(
          user.id,
          courseId,
          score,
          passed,
          certificateTitle,
          certificateDescription
        );
      }

      fetchUserData(); // Refresh data
    } catch (error) {
      console.error('Error recording assessment completion:', error);
    }
  }, [user?.id, fetchUserData]);

  // Get assessment result for a course
  const getAssessmentResult = useCallback((courseId: string) => {
    return localStorageUtils.getAssessmentResult(courseId);
  }, []);

  // Clear user data (for logout)
  const clearUserData = useCallback(() => {
    localStorageUtils.clearUserData();
    setUserData({
      certificatesEarned: 0,
      totalCourses: 0,
      completedCourses: 0,
      averageProgress: 0,
      loading: false,
      error: null
    });
  }, []);

  // Initialize data
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Listen for auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      clearUserData();
    }
  }, [isAuthenticated, clearUserData]);

  return {
    ...userData,
    recordCourseProgress,
    recordAssessmentCompletion,
    getAssessmentResult,
    clearUserData,
    refreshData: fetchUserData
  };
};
