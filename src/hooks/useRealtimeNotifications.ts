import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Create notifications from existing real data only
      const realNotifications: Notification[] = [];
      
      try {
        // Get recent interview sessions
        const { data: interviews } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (interviews && interviews.length > 0) {
          interviews.forEach((interview, index) => {
            if (interview.overall_score !== null) {
              realNotifications.push({
                id: `interview-${interview.id}`,
                type: interview.overall_score >= 80 ? 'success' : interview.overall_score >= 60 ? 'info' : 'warning',
                title: 'Interview Completed',
                message: `Your ${interview.interview_type || 'interview'} scored ${interview.overall_score}%`,
                timestamp: interview.created_at,
                read: index > 0, // Only the most recent is unread
                action_url: `/interviews/${interview.id}`,
                metadata: { interview_id: interview.id }
              });
            }
          });
        }

        // Get recent certificates
        const { data: certificates } = await supabase
          .from('user_certificates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (certificates && certificates.length > 0) {
          certificates.forEach((cert, index) => {
            realNotifications.push({
              id: `certificate-${cert.id}`,
              type: 'success',
              title: 'Certificate Earned',
              message: `Congratulations! You've earned a certificate for course completion`,
              timestamp: cert.created_at,
              read: index > 0,
              action_url: `/certificates`,
              metadata: { certificate_id: cert.id }
            });
          });
        }

        // Get learning progress
        const { data: learningData } = await supabase
          .from('user_learning')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .order('updated_at', { ascending: false })
          .limit(3);

        if (learningData && learningData.length > 0) {
          learningData.forEach((learning, index) => {
            realNotifications.push({
              id: `learning-${learning.id}`,
              type: 'info',
              title: 'Course Completed',
              message: `Great job! You've completed a course`,
              timestamp: learning.updated_at,
              read: index > 0,
              action_url: `/learning`,
              metadata: { learning_id: learning.id }
            });
          });
        }

      } catch (err) {
        console.warn('Error fetching data for notifications:', err);
      }
      
      // Sort by timestamp and take top 10
      realNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      realNotifications.splice(10);
      
      setNotifications(realNotifications);
      setUnreadCount(realNotifications.filter(n => !n.read).length);
      
    } catch (error: any) {
      console.error('Error in fetchNotifications:', error);
      // Set empty state on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Since we don't have a real notifications table, just update local state
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Update local state only
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    // Remove from local state only
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const deletedNotification = notifications.find(n => n.id === notificationId);
      return deletedNotification && !deletedNotification.read ? prev - 1 : prev;
    });
  }, [notifications]);

  // Set up real-time subscriptions for the data we're using
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    // Subscribe to changes in the tables we use for notifications
    const channels = [];
    
    try {
      // Interview sessions channel
      const interviewsChannel = supabase
        .channel('notifications-interviews')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'interview_sessions', filter: `user_id=eq.${user.id}` },
          () => fetchNotifications()
        );
      channels.push(interviewsChannel);
    } catch (err) {
      console.warn('Failed to subscribe to interviews channel for notifications:', err);
    }

    try {
      // Certificates channel
      const certificatesChannel = supabase
        .channel('notifications-certificates')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'user_certificates', filter: `user_id=eq.${user.id}` },
          () => fetchNotifications()
        );
      channels.push(certificatesChannel);
    } catch (err) {
      console.warn('Failed to subscribe to certificates channel for notifications:', err);
    }

    try {
      // Learning channel
      const learningChannel = supabase
        .channel('notifications-learning')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'user_learning', filter: `user_id=eq.${user.id}` },
          () => fetchNotifications()
        );
      channels.push(learningChannel);
    } catch (err) {
      console.warn('Failed to subscribe to learning channel for notifications:', err);
    }

    // Subscribe to all channels
    channels.forEach(channel => {
      try {
        channel.subscribe();
      } catch (err) {
        console.warn('Failed to subscribe to channel:', err);
      }
    });

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.warn('Failed to remove channel:', err);
        }
      });
    };
  }, [user?.id, fetchNotifications]);

  // Auto-refresh notifications every 5 minutes
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  };
};
