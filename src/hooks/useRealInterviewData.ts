import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { localStorageUtils } from '@/utils/localStorage';
import { generateConsistentUUID } from '@/utils/userUtils';

interface InterviewSession {
  id: string;
  interview_type: string;
  overall_score: number | null;
  created_at: string;
  session_status: string;
}

interface WeeklyProgress {
  week: string;
  interviews: number;
  score: number;
  timeSpent: number;
}

interface SkillBreakdown {
  skill: string;
  score: number;
  improvement: number;
  color: string;
}

interface RealInterviewData {
  // Basic stats
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  currentStreak: number;
  
  // Weekly progress (last 4 weeks)
  weeklyProgress: WeeklyProgress[];
  
  // Skills breakdown based on real interview performance
  skillsBreakdown: SkillBreakdown[];
  
  // Loading and error states
  loading: boolean;
  error: string | null;
}

export const useRealInterviewData = (): RealInterviewData => {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<RealInterviewData>({
    totalInterviews: 0,
    completedInterviews: 0,
    averageScore: 0,
    currentStreak: 0,
    weeklyProgress: [],
    skillsBreakdown: [],
    loading: true,
    error: null
  });

  const fetchRealInterviewData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Get local storage data for streak
      const localStats = localStorageUtils.getInterviewStats();
      
      // Convert Clerk user ID to UUID for Supabase
      const supabaseUserId = generateConsistentUUID(user.id);
      
      // Fetch real interview sessions from database
      const { data: interviewSessions, error } = await supabase
        .from('interview_sessions')
        .select('id, interview_type, overall_score, created_at, session_status')
        .eq('user_id', supabaseUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching interview sessions:', error);
        throw error;
      }

      const sessions = interviewSessions || [];
      const completedSessions = sessions.filter(s => 
        s.session_status === 'completed' && s.overall_score !== null
      );

      // Calculate basic stats
      const totalInterviews = sessions.length;
      const completedInterviews = completedSessions.length;
      const averageScore = completedInterviews > 0 
        ? Math.round(completedSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / completedInterviews)
        : 0;

      // Calculate weekly progress (last 4 weeks)
      const weeklyProgress: WeeklyProgress[] = [];
      const now = new Date();
      
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekSessions = completedSessions.filter(session => {
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

      // Calculate real skills breakdown based on interview types and scores
      const skillsBreakdown: SkillBreakdown[] = [];
      
      if (completedInterviews > 0) {
        // Analyze interview types to determine skill strengths
        const technicalInterviews = completedSessions.filter(s => 
          s.interview_type === 'role_based' || s.interview_type === 'resume_based'
        );
        
        const hrInterviews = completedSessions.filter(s => 
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
        const leadershipScore = Math.min(100, Math.max(0, localStats.currentStreak * 3 + averageScore * 0.7));
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
          score: averageScore,
          improvement: 0,
          color: '#8B5CF6'
        });
      }

      setData({
        totalInterviews,
        completedInterviews,
        averageScore,
        currentStreak: localStats.currentStreak,
        weeklyProgress,
        skillsBreakdown,
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Error fetching real interview data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch interview data'
      }));
    }
  }, [user?.id, isAuthenticated]);

  // Initialize data
  useEffect(() => {
    fetchRealInterviewData();
  }, [fetchRealInterviewData]);

  return {
    ...data,
    refreshData: fetchRealInterviewData
  } as RealInterviewData & { refreshData: () => Promise<void> };
};
