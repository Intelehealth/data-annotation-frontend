'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Folder, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardAPI } from '@/lib/api/dashboard';
import { useEffect, useState } from 'react';
import {
  DashboardStats,
  ProgressChart,
  ActivityTimeline,
} from '@/components/dashboard-components/dashboard-stats';

interface DashboardStatsData {
  totalDatasets: number;
  totalAnnotations: number;
  completionRate: number;
}

interface RecentDataset {
  _id: string;
  name: string;
  description: string;
  datasetType: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  datasetId?: string;
  csvImportId?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatsData>({
    totalDatasets: 0,
    totalAnnotations: 0,
    completionRate: 0,
  });
  const [recentDatasets, setRecentDatasets] = useState<RecentDataset[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, datasetsData, activitiesData] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentDatasets(4),
          dashboardAPI.getActivityFeed(5),
        ]);

        setStats(statsData);
        setRecentDatasets(datasetsData);
        setRecentActivities(activitiesData);
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {};
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [statsData, datasetsData, activitiesData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentDatasets(4),
        dashboardAPI.getActivityFeed(5),
      ]);

      setStats(statsData);
      setRecentDatasets(datasetsData);
      setRecentActivities(activitiesData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatLastRefresh = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your data annotation projects today.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {formatLastRefresh(lastRefresh)}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </Button>
          <Link href="/dataset/add-dataset">
            <Button className="bg-black hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Dataset
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats
        totalDatasets={stats.totalDatasets}
        totalAnnotations={stats.totalAnnotations}
        completionRate={stats.completionRate}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Datasets */}
        <div>
          <Link href="/dataset">
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Folder className="h-5 w-5" />
                  <span>Recent Datasets</span>
                </CardTitle>
                <CardDescription>
                  Your most recently created datasets
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-4">
                  {recentDatasets.length > 0 ? (
                    recentDatasets.map((dataset) => (
                      <div
                        key={dataset._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {dataset.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {dataset.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            Type: {dataset.datasetType}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline">{dataset.datasetType}</Badge>
                          <Link href={`/dataset/${dataset._id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No datasets yet</p>
                      <Link href="/dataset/add-dataset">
                        <Button variant="outline" className="mt-2">
                          Create your first dataset
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                {recentDatasets.length > 0 && (
                  <div
                    className="mt-4 pt-4 border-t"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href="/dataset">
                      <Button variant="outline" className="w-full">
                        View All Datasets
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest updates across your projects
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ActivityTimeline activities={recentActivities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
