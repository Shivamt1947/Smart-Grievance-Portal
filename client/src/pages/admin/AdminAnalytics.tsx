import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { AnalyticsMetrics } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/EmptyState';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { LineChart as LineChartIcon, Clock, Star, AlertOctagon, TrendingUp, Users } from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-deep-analytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics');
      return res.data.metrics as AnalyticsMetrics;
    },
  });

  const metrics = data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !metrics) {
    return <ErrorState onRetry={() => refetch()} message="Unable to aggregate deep analytical metrics." />;
  }

  const statusPieData = [
    { name: 'Pending', value: metrics.pendingCount, color: '#f59e0b' },
    { name: 'Assigned', value: metrics.assignedCount, color: '#6366f1' },
    { name: 'In Progress', value: metrics.inProgressCount, color: '#3b82f6' },
    { name: 'Resolved', value: metrics.resolvedCount, color: '#10b981' },
    { name: 'Closed', value: metrics.closedCount, color: '#64748b' },
    { name: 'Escalated', value: metrics.escalatedCount, color: '#ef4444' },
    { name: 'Reopened', value: metrics.reopenedCount, color: '#a855f7' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <LineChartIcon className="w-6 h-6 text-blue-600" />
          <span>Institutional Analytics & SLA Metrics</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Turnaround statistics, SLA compliance rates, and student feedback sentiment aggregated from real MongoDB data.
        </p>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Avg Resolution Speed
            </span>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {metrics.avgResolutionHours} <span className="text-base font-normal text-slate-400">hours</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Average time from submission to documented resolution</p>
        </Card>

        <Card className="p-5 border-rose-200 dark:border-rose-900/60 bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-rose-700 dark:text-rose-400">
              SLA Escalation Rate
            </span>
            <AlertOctagon className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="text-3xl font-black text-rose-600 mt-2">
            {metrics.escalationRate}%
          </h3>
          <p className="text-xs text-slate-400 mt-1">Percentage of cases breaching the 24h SLA deadline</p>
        </Card>

        <Card className="p-5 border-amber-200 dark:border-amber-900/60 bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">
              Student Satisfaction
            </span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {metrics.averageRating > 0 ? metrics.averageRating : '5.0'}{' '}
            <span className="text-base font-normal text-slate-400">/ 5.0</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Based on {metrics.totalFeedback} authenticated student ratings</p>
        </Card>
      </div>

      {/* Grid of Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Lifecycle Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grievance Lifecycle Distribution</CardTitle>
            <CardDescription className="text-xs">
              Proportion of complaints across all resolution lifecycle phases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    fontSize={11}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Volume by Category Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Load Comparison</CardTitle>
            <CardDescription className="text-xs">
              Total grievances filed by administrative domain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="_id" fontSize={10} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
