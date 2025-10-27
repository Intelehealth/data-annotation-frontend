'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Database,
  FileText,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface DashboardStatsProps {
  totalDatasets: number;
  totalAnnotations: number;
  completionRate: number;
}



export function DashboardStats({
  totalDatasets,
  totalAnnotations,
  completionRate,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDatasets}</div>
          <p className="text-xs text-muted-foreground">
            Active datasets in your workspace
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Annotations
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAnnotations}</div>
          <p className="text-xs text-muted-foreground">
            Annotations created across all datasets
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <p className="text-xs text-muted-foreground">
            AI-assisted annotation completion
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ActivityTimeline({
  activities,
}: {
  activities: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}) {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold">Recent Activity</h3>
      <div className="space-y-4 flex-1 overflow-hidden">
        {activities.length > 0 ? (
          activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-500">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
