import React, { useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import DashboardAnalytics from '@/components/Dashboard/DashboardAnalytics';
import DashboardOverview from '@/components/Dashboard/DashboardOverview';
import ActivityFeed from '@/components/Dashboard/ActivityFeed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  BookOpen, 
  Target, 
  TrendingUp,
  Calendar,
  Award,
  Clock,
  Zap,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    totalInterviews, 
    currentStreak, 
    averageScore, 
    certificatesEarned,
    recentActivity,
    loading,
    error,
    refreshStats
  } = useDashboardStats();
  
  const [activeTab, setActiveTab] = useState('overview');

  const quickActions = [
    {
      title: 'Start Interview',
      description: 'Practice with AI-powered mock interviews',
      icon: Play,
      action: () => navigate('/interviews'),
      color: 'bg-primary/10 text-primary border-primary/20',
      iconColor: 'text-primary'
    },
    {
      title: 'Learning Hub',
      description: 'Access courses and learning materials',
      icon: BookOpen,
      action: () => navigate('/learning'),
      color: 'bg-green-100 text-green-800 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      title: 'Take Assessment',
      description: 'Test your knowledge with quizzes',
      icon: Target,
      action: () => navigate('/learning'),
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      title: 'View Certificates',
      description: 'See your earned achievements',
      icon: Award,
      action: () => navigate('/certificates'),
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      iconColor: 'text-orange-600'
    }
  ];

  const getMotivationalMessage = () => {
    if (currentStreak >= 7) {
      return "🔥 You're on fire! Keep up the amazing work!";
    } else if (currentStreak >= 3) {
      return "💪 Great consistency! You're building a strong habit!";
    } else if (currentStreak >= 1) {
      return "🚀 Good start! Let's keep this momentum going!";
    } else {
      return "🌟 Ready to start your interview preparation journey?";
    }
  };

  const getPerformanceLevel = () => {
    if (averageScore >= 90) return { level: 'Expert', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (averageScore >= 80) return { level: 'Advanced', color: 'text-green-600', bg: 'bg-green-100' };
    if (averageScore >= 70) return { level: 'Intermediate', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (averageScore >= 60) return { level: 'Beginner', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'Novice', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const performanceLevel = getPerformanceLevel();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your interview preparation overview
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStats}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              onClick={() => navigate('/interviews')}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Interview
            </Button>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <DashboardAnalytics />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <ActivityFeed 
              activities={recentActivity} 
              loading={loading}
              error={error}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
