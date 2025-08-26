import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ProgressData {
  current: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  status: 'on_track' | 'ahead' | 'behind' | 'completed';
}

interface ProgressIndicatorProps {
  title: string;
  description: string;
  data: ProgressData;
  loading?: boolean;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  title, 
  description, 
  data, 
  loading = false,
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'ahead':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'on_track':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'behind':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'ahead':
        return <TrendingUp className="w-4 h-4" />;
      case 'on_track':
        return <Target className="w-4 h-4" />;
      case 'behind':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardHeader className="pb-2">
          <div className="h-5 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-2 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-1/3"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-medium transition-all duration-300 hover:-translate-y-1 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge 
            variant="outline" 
            className={`${getStatusColor(data.status)} flex items-center gap-1`}
          >
            {getStatusIcon(data.status)}
            <span className="capitalize">{data.status.replace('_', ' ')}</span>
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{data.percentage}%</span>
          </div>
          <Progress 
            value={data.percentage} 
            className="h-2"
            style={{
              '--progress-color': getProgressColor(data.percentage)
            } as React.CSSProperties}
          />
        </div>

        {/* Current vs Target */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{data.current}</div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{data.target}</div>
            <div className="text-xs text-muted-foreground">Target</div>
          </div>
        </div>

        {/* Trend and Status */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getTrendIcon(data.trend)}
            <span className="text-muted-foreground">
              {data.trend === 'up' ? 'Trending up' : data.trend === 'down' ? 'Trending down' : 'Stable'}
            </span>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Remaining</div>
            <div className="font-medium">
              {Math.max(0, data.target - data.current)} {data.unit}
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        {data.status === 'behind' && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">You're behind schedule</span>
            </div>
            <p className="text-xs text-orange-700 mt-1">
              Try to increase your daily practice to catch up!
            </p>
          </div>
        )}

        {data.status === 'ahead' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Great progress!</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              You're ahead of schedule. Keep up the excellent work!
            </p>
          </div>
        )}

        {data.status === 'completed' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Goal achieved!</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Congratulations! You've reached your target.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressIndicator;
