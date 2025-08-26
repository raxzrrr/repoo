import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { generateConsistentUUID } from '@/utils/userUtils';

interface DashboardStats {
  totalInterviews: number;
  currentStreak: number;
  averageScore: number;
  certificatesEarned: number;
  recentActivity: Array<{
    id: string;
    type: 'interview' | 'certificate' | 'course' | 'assessment';
    title: string;
    timestamp: string;
    score?: number;
    status: 'completed' | 'in_progress' | 'failed';
  }>;
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
  loading: boolean;
  error: string | null;
}

export const useDashboardStats = () => {
  const { user, getSupabaseUserId, ensureSupabaseSession } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalInterviews: 0,
    currentStreak: 0,
    averageScore: 0,
    certificatesEarned: 0,
    recentActivity: [],
    weeklyProgress: [],
    skillsBreakdown: [],
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Ensure Supabase session is active before querying RLS-protected tables
      await ensureSupabaseSession();
      
      const supabaseUserId = getSupabaseUserId();
      if (!supabaseUserId) {
        console.log('No Supabase user ID available');
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Fetch all data in parallel for better performance
      const [interviewsResult, certificatesResult, learningResult, usageResult] = await Promise.allSettled([
        supabase
          .from('interview_sessions')
          .select('id, interview_type, overall_score, created_at, session_status')
          .eq('user_id', supabaseUserId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('user_certificates')
          .select('id, created_at, course_id')
          .eq('user_id', supabaseUserId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('user_learning')
          .select('id, is_completed, updated_at, course_id')
          .eq('user_id', supabaseUserId)
          .eq('is_completed', true)
          .order('updated_at', { ascending: false }),
        
        supabase
          .from('user_interview_usage')
          .select('*')
          .eq('user_id', supabaseUserId)
          .single()
      ]);

      // Extract data from results
      const interviews = interviewsResult.status === 'fulfilled' && interviewsResult.value.data 
        ? interviewsResult.value.data 
        : [];
      
      const certificates = certificatesResult.status === 'fulfilled' && certificatesResult.value.data 
        ? certificatesResult.value.data 
        : [];
      
      const learningData = learningResult.status === 'fulfilled' && learningResult.value.data 
        ? learningResult.value.data 
        : [];
      
      const interviewUsage = usageResult.status === 'fulfilled' && usageResult.value.data 
        ? usageResult.value.data 
        : null;

      // Debug logging
      console.log('Dashboard Stats Debug:', {
        userId: supabaseUserId,
        interviewsCount: interviews.length,
        certificatesCount: certificates.length,
        learningDataCount: learningData.length,
        interviewUsage: interviewUsage
      });

      // Calculate real statistics
      const totalInterviews = interviews.length;
      const completedInterviews = interviews.filter(int => int.session_status === 'completed' && int.overall_score !== null);
      const averageScore = completedInterviews.length > 0 
        ? Math.round(completedInterviews.reduce((sum, int) => sum + (int.overall_score || 0), 0) / completedInterviews.length)
        : 0;
      const certificatesEarned = certificates.length;

      // Calculate real current streak
      let currentStreak = 0;
      if (interviews.length > 0) {
        const today = new Date();
        let streakDate = new Date(today);
        
        for (let i = 0; i < 30; i++) {
          const dateStr = streakDate.toISOString().split('T')[0];
          const hasInterview = interviews.some(int => 
            int.created_at?.startsWith(dateStr) && int.session_status === 'completed'
          );
          
          if (hasInterview) {
            currentStreak++;
            streakDate.setDate(streakDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Generate real weekly progress data
      const weeklyProgress = [];
      const now = new Date();
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekInterviews = interviews.filter(int => {
          const intDate = new Date(int.created_at);
          return intDate >= weekStart && intDate <= weekEnd && int.session_status === 'completed';
        });

        const weekScore = weekInterviews.length > 0
          ? Math.round(weekInterviews.reduce((sum, int) => sum + (int.overall_score || 0), 0) / weekInterviews.length)
          : 0;

        weeklyProgress.push({
          week: `Week ${4 - i}`,
          interviews: weekInterviews.length,
          score: weekScore,
          timeSpent: weekInterviews.length * 15, // Estimate 15 minutes per interview
        });
      }

      // Generate real skills breakdown based on actual interview performance
      const skillsBreakdown = [];
      if (completedInterviews.length > 0) {
        // Analyze interview types and scores to determine skill strengths
        const technicalInterviews = completedInterviews.filter(int => 
          int.interview_type === 'role_based' || int.interview_type === 'resume_based'
        );
        const hrInterviews = completedInterviews.filter(int => 
          int.interview_type === 'basic_hr_technical'
        );

        if (technicalInterviews.length > 0) {
          const techScore = Math.round(
            technicalInterviews.reduce((sum, int) => sum + (int.overall_score || 0), 0) / technicalInterviews.length
          );
          skillsBreakdown.push({
            skill: 'Technical',
            score: techScore,
            improvement: Math.max(0, techScore - averageScore),
            color: '#8B5CF6'
          });
        }

        if (hrInterviews.length > 0) {
          const hrScore = Math.round(
            hrInterviews.reduce((sum, int) => sum + (int.overall_score || 0), 0) / hrInterviews.length
          );
          skillsBreakdown.push({
            skill: 'Communication',
            score: hrScore,
            improvement: Math.max(0, hrScore - averageScore),
            color: '#06B6D4'
          });
        }

        // Add overall problem-solving skill based on average performance
        skillsBreakdown.push({
          skill: 'Problem Solving',
          score: averageScore,
          improvement: 0,
          color: '#10B981'
        });

        // Add leadership skill based on consistency (streak)
        const leadershipScore = Math.min(100, Math.max(0, currentStreak * 3 + averageScore * 0.7));
        skillsBreakdown.push({
          skill: 'Leadership',
          score: Math.round(leadershipScore),
          improvement: Math.max(0, leadershipScore - averageScore),
          color: '#F59E0B'
        });
      } else {
        // Only show overall performance if no interviews completed
        skillsBreakdown.push({
          skill: 'Overall Performance',
          score: averageScore,
          improvement: 0,
          color: '#8B5CF6'
        });
      }

      setStats({
        totalInterviews,
        currentStreak,
        averageScore,
        certificatesEarned,
        recentActivity: [], // Empty since we removed the recent activity section
        weeklyProgress,
        skillsBreakdown,
        loading: false,
        error: null,
      });

    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch dashboard data',
      }));
    }
  }, [user?.id, getSupabaseUserId, ensureSupabaseSession]);

  // Set up real-time subscriptions
  useEffect(() => {
    const supabaseUserId = getSupabaseUserId();
    if (!user?.id || !supabaseUserId) return;

    fetchStats();

    // Real-time subscriptions
    const channels = [
      supabase
        .channel('interviews-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'interview_sessions', filter: `user_id=eq.${supabaseUserId}` },
          () => fetchStats()
        ),
      supabase
        .channel('certificates-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_certificates', filter: `user_id=eq.${supabaseUserId}` },
          () => fetchStats()
        ),
      supabase
        .channel('learning-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_learning', filter: `user_id=eq.${supabaseUserId}` },
          () => fetchStats()
        ),
      supabase
        .channel('usage-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_interview_usage', filter: `user_id=eq.${supabaseUserId}` },
          () => fetchStats()
        ),
    ];

    // Subscribe to all channels
    channels.forEach(channel => channel.subscribe());

    // Cleanup function
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user?.id, getSupabaseUserId, fetchStats]);

  // Auto-refresh every 30 seconds for additional real-time feel
  useEffect(() => {
    const supabaseUserId = getSupabaseUserId();
    if (!user?.id || !supabaseUserId) return;

    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user?.id, getSupabaseUserId, fetchStats]);

  return {
    ...stats,
    refreshStats: fetchStats,
  };
};
