import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressIndicator } from './ProgressIndicator';
import { 
  TrendingUp, 
  Target, 
  Calendar,
  Award,
  Clock,
  Zap,
  Play,
  BookOpen,
  Target as TargetIcon,
  Award as AwardIcon
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useNavigate } from 'react-router-dom';

const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const { 
    totalInterviews, 
    currentStreak, 
    averageScore, 
    certificatesEarned,
    weeklyProgress,
    skillsBreakdown,
    loading,
    error
  } = useDashboardStats();

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
      icon: TargetIcon,
      action: () => navigate('/learning'),
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      title: 'View Certificates',
      description: 'See your earned achievements',
      icon: AwardIcon,
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

  // Calculate progress data for different areas
  const interviewProgress = {
    current: totalInterviews,
    target: 20, // Monthly target
    unit: 'interviews',
    trend: weeklyProgress.length >= 2 && weeklyProgress[weeklyProgress.length - 1]?.interviews > weeklyProgress[weeklyProgress.length - 2]?.interviews ? 'up' : 'stable',
    percentage: Math.min(100, (totalInterviews / 20) * 100),
    status: totalInterviews >= 20 ? 'completed' : totalInterviews >= 15 ? 'ahead' : totalInterviews >= 10 ? 'on_track' : 'behind'
  };

  const streakProgress = {
    current: currentStreak,
    target: 30, // Monthly target
    unit: 'days',
    trend: currentStreak > 0 ? 'up' : 'stable',
    percentage: Math.min(100, (currentStreak / 30) * 100),
    status: currentStreak >= 30 ? 'completed' : currentStreak >= 20 ? 'ahead' : currentStreak >= 10 ? 'on_track' : 'behind'
  };

  const scoreProgress = {
    current: averageScore,
    target: 90, // Target score
    unit: '%',
    trend: weeklyProgress.length >= 2 && weeklyProgress[weeklyProgress.length - 1]?.score > weeklyProgress[weeklyProgress.length - 2]?.score ? 'up' : 'stable',
    percentage: Math.min(100, (averageScore / 90) * 100),
    status: averageScore >= 90 ? 'completed' : averageScore >= 80 ? 'ahead' : averageScore >= 70 ? 'on_track' : 'behind'
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-32 mb-2"></div>
                <div className="h-4 bg-muted rounded w-48"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <TrendingUp className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Failed to load dashboard data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          <Zap className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {getMotivationalMessage()}
              </h3>
              <p className="text-muted-foreground">
                {currentStreak > 0 
                  ? `You've been practicing for ${currentStreak} day${currentStreak > 1 ? 's' : ''} in a row!`
                  : 'Start your first interview today and begin building your skills!'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Interviews</p>
                <p className="text-2xl font-bold text-foreground">{totalInterviews}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground">{currentStreak} days</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-foreground">{averageScore}%</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certificates</p>
                <p className="text-2xl font-bold text-foreground">{certificatesEarned}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Level Badge */}
      <div className="flex items-center justify-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${performanceLevel.bg} border`}>
          <span className={`text-sm font-medium ${performanceLevel.color}`}>
            Performance Level: {performanceLevel.level}
          </span>
          <Badge variant="outline" className="text-xs">
            {averageScore}%
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Get started with your interview preparation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-medium hover:-translate-y-1 text-left ${action.color}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/50`}>
                    <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{action.title}</h4>
                    <p className="text-xs opacity-80 mt-1">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProgressIndicator
          title="Interview Progress"
          description="Your monthly interview practice goal"
          data={interviewProgress}
          loading={loading}
        />
        
        <ProgressIndicator
          title="Streak Goal"
          description="Maintain daily practice consistency"
          data={streakProgress}
          loading={loading}
        />
        
        <ProgressIndicator
          title="Score Improvement"
          description="Work towards your target score"
          data={scoreProgress}
          loading={loading}
        />
      </div>

      {/* Skills Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Skills Overview
          </CardTitle>
          <CardDescription>
            Your performance across different skill areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {skillsBreakdown.map((skill, index) => (
              <div key={index} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{skill.skill}</h4>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: skill.color }}
                  />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {skill.score}%
                </div>
                <div className="text-xs text-muted-foreground">
                  +{skill.improvement}% improvement
                </div>
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${skill.score}%`,
                        backgroundColor: skill.color
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
