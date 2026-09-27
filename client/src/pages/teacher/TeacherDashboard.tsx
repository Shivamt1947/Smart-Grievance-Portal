import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import type { Grievance } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { SLACountdown } from '@/components/ui/SLACountdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Briefcase,
  Clock,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  User,
  Building,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacher-assigned-grievances'],
    queryFn: async () => {
      const res = await api.get('/grievances?limit=50');
      return res.data;
    },
  });

  const grievances: Grievance[] = data?.grievances || [];

  // Metrics calculated from real data
  const totalAssigned = grievances.length;
  const inProgressCount = grievances.filter((g) => g.status === 'IN_PROGRESS').length;
  const resolvedCount = grievances.filter((g) => ['RESOLVED', 'CLOSED'].includes(g.status)).length;
  const escalatedCount = grievances.filter((g) => g.status === 'ESCALATED').length;

  const now = new Date();
  const overdueCount = grievances.filter((g) => {
    return (
      ['ASSIGNED', 'IN_PROGRESS', 'PENDING', 'REOPENED'].includes(g.status) &&
      new Date(g.dueAt) < now
    );
  }).length;

  // Priority Queue: Active grievances sorted by deadline
  const activeQueue = grievances
    .filter((g) => ['ASSIGNED', 'IN_PROGRESS', 'REOPENED', 'ESCALATED'].includes(g.status))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  return (
    <div className="space-y-6">
      {/* Faculty Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-800 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold uppercase tracking-wider text-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Departmental Faculty Resolution Officer
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {user?.name}
            </h1>
            <p className="text-sm text-indigo-200/90 max-w-xl">
              Employee ID: <span className="font-mono font-bold">{user?.institutionalId}</span> • Department of{' '}
              <span className="font-semibold">{user?.department}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/teacher/grievances')}
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold shadow-lg"
              size="lg"
            >
              <Briefcase className="w-5 h-5 mr-1 text-indigo-600" />
              View Full Workload ({totalAssigned})
            </Button>
          </div>
        </div>
      </div>

      {/* SLA Alert banner if overdue or escalated tickets exist */}
      {(overdueCount > 0 || escalatedCount > 0) && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-300 flex items-center justify-between gap-4 shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-200/60 dark:bg-rose-900 text-rose-700 dark:text-rose-300 shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold">
                Action Required: {overdueCount + escalatedCount} SLA Breaches Detected
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-400">
                Tickets exceeding the 24-hour deadline require immediate resolution documentation or administrative escalation.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => navigate('/teacher/grievances?isOverdue=true')}
            className="shrink-0 font-bold"
          >
            Review Overdue Cases
          </Button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => navigate('/teacher/grievances')}
          className="p-5 flex items-center justify-between cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Total
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              {totalAssigned}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 shrink-0 self-center">
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </Card>

        <Card
          onClick={() => navigate('/teacher/grievances?status=IN_PROGRESS')}
          className="p-5 flex items-center justify-between cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              In Investigation
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-blue-600">
              {inProgressCount}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shrink-0 self-center">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </Card>

        <Card
          onClick={() => navigate('/teacher/grievances?status=RESOLVED')}
          className="p-5 flex items-center justify-between cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resolved by You
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600">
              {resolvedCount}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0 self-center">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </Card>

        <Card
          onClick={() => navigate('/teacher/grievances?status=ESCALATED')}
          className="p-5 flex items-center justify-between cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Escalated (24h+)
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600">
              {escalatedCount}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 shrink-0 self-center">
            <AlertOctagon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </Card>
      </div>

      {/* Priority Action Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>SLA Priority Action Queue</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {activeQueue.length} Active
            </span>
          </h2>
          <button
            onClick={() => navigate('/teacher/grievances')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View all assigned cases <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : activeQueue.length === 0 ? (
          <EmptyState
            title="All caught up!"
            description="You have no active pending or in-progress grievances assigned. Great job upholding SLA turnaround!"
          />
        ) : (
          <div className="space-y-3">
            {activeQueue.map((item) => (
              <Card
                key={item._id}
                onClick={() => navigate(`/teacher/grievances/${item._id}`)}
                className="cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {item.trackingId}
                      </span>
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                      <span className="text-xs text-slate-400">• {item.category}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {item.student?.name} ({item.student?.institutionalId})
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {item.location}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
                    <SLACountdown dueAt={item.dueAt} status={item.status} />
                    <Button variant="primary" size="sm" className="font-bold text-xs">
                      Investigate & Resolve →
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
