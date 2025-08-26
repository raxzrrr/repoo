
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  Award,
  BookOpen,
  CheckCircle,
  BarChart3,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

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

interface DashboardAnalyticsProps {
  // Real interview data
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  currentStreak: number;
  weeklyProgress: WeeklyProgress[];
  skillsBreakdown: SkillBreakdown[];
  
  // Course and certificate data
  certificatesEarned: number;
  totalCourses: number;
  completedCourses: number;
  averageProgress: number;
  
  // Loading and error states
  loading: boolean;
  error: string | null;
}

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  totalInterviews,
  completedInterviews,
  averageScore,
  currentStreak,
  weeklyProgress,
  skillsBreakdown,
  certificatesEarned,
  totalCourses,
  completedCourses,
  averageProgress,
  loading,
  error
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div className="space-y-2">
          <BarChart3 className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-red-600">Error loading dashboard data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Sessions</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalInterviews}</div>
            <div className="flex items-center gap-2 mt-1">
              {totalInterviews === 0 ? (
                <span className="text-xs text-muted-foreground">Start your first interview!</span>
              ) : (
                <span className="text-xs text-muted-foreground">Total sessions completed</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{currentStreak} days</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {currentStreak > 0 ? '🔥 Keep it up!' : 'Start your streak today!'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{averageScore}%</div>
            <div className="flex items-center gap-1 mt-1">
              {completedInterviews === 0 ? (
                <span className="text-xs text-muted-foreground">Complete interviews to see your score</span>
              ) : (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {averageScore >= 80 ? 'Excellent' : averageScore >= 70 ? 'Good' : averageScore >= 60 ? 'Fair' : 'Needs Improvement'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Earned</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{certificatesEarned}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                {certificatesEarned === 0 ? 'Complete courses to earn certificates' : `${certificatesEarned >= 5 ? 'Master level!' : `${5 - certificatesEarned} more to unlock next tier`}`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress Chart */}
      <Card className="hover:shadow-medium transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Weekly Progress
          </CardTitle>
          <CardDescription>Your interview activity and scores over the past 4 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyProgress.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-center">
              <div className="space-y-2">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-muted-foreground">No interview data available</p>
                <p className="text-sm text-muted-foreground">Start practicing to see your weekly progress</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="interviews" 
                  fill="#8B5CF6" 
                  radius={[4, 4, 0, 0]}
                  name="Interviews"
                />
                <Bar 
                  dataKey="score" 
                  fill="#06B6D4" 
                  radius={[4, 4, 0, 0]}
                  name="Score %"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Skills Breakdown */}
      <Card className="hover:shadow-medium transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Skills Breakdown
          </CardTitle>
          <CardDescription>
            {completedInterviews === 0 
              ? "Complete interviews to see your skill analysis" 
              : "Your performance across different skill areas"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedInterviews === 0 ? (
            <div className="flex items-center justify-center h-64 text-center">
              <div className="space-y-2">
                <Target className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-muted-foreground">No interview data available</p>
                <p className="text-sm text-muted-foreground">Start practicing to see your skills breakdown</p>
              </div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={skillsBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="score"
                  >
                    {skillsBreakdown.map((skill, index) => (
                      <Cell key={`cell-${index}`} fill={skill.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                {skillsBreakdown.map((skill, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: skill.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {skill.skill}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {skill.score}% (+{skill.improvement}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Performance Trend Line Chart */}
      <Card className="hover:shadow-medium transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance Trend
          </CardTitle>
          <CardDescription>Your interview scores progression over time</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyProgress.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-center">
              <div className="space-y-2">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-muted-foreground">No interview data available</p>
                <p className="text-sm text-muted-foreground">Start practicing to see your performance trend</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardAnalytics;
