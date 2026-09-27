import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Grievance } from '@/types';
import {
  Cpu,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  ArrowRight,
  RefreshCw,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';

const TECHNICAL_STATUSES = [
  'FORWARDED_TO_TECHNICAL',
  'TECHNICAL_ASSIGNED',
  'TECHNICAL_IN_PROGRESS',
  'TECHNICAL_COMPLETED',
  'PENDING_FACULTY_VERIFICATION',
  'FACULTY_VERIFIED',
];

const statusLabel: Record<string, string> = {
  FORWARDED_TO_TECHNICAL: 'Forwarded',
  TECHNICAL_ASSIGNED: 'Assigned',
  TECHNICAL_IN_PROGRESS: 'In Progress',
  TECHNICAL_COMPLETED: 'Completed',
  PENDING_FACULTY_VERIFICATION: 'Pending Verification',
  FACULTY_VERIFIED: 'Faculty Verified',
  CLOSED: 'Closed',
};

export const TechnicalDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isWorker = user?.role === 'worker';

  // 1. Fetch live aggregate stats from database
  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['technical-stats', user?.role],
    queryFn: async () => {
      if (isWorker) {
        const res = await api.get('/technical/worker-dashboard');
        return res.data?.stats;
      }
      const res = await api.get('/technical/stats');
      return res.data?.stats;
    },
    refetchInterval: 15000,
  });

  // 2. Fetch technical grievances list
  const { data: listData, isLoading: isListLoading, refetch: refetchList } = useQuery({
    queryKey: ['technical-grievances-dashboard', user?.role],
    queryFn: async () => {
      if (isWorker) {
        const res = await api.get('/technical/worker-dashboard');
        return res.data;
      }
      const res = await api.get('/technical?limit=50');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const grievances: Grievance[] = isWorker
    ? listData?.recentGrievances || []
    : listData?.grievances || [];

  const stats = statsData || {
    forwardedCount: 0,
    assignedCount: 0,
    inProgressCount: 0,
    pendingVerificationCount: 0,
    completedCount: 0,
    totalCount: 0,
  };

  const refetch = () => {
    refetchStats();
    refetchList();
  };

  const isLoading = isStatsLoading || isListLoading;

  const kpiCards = [
    {
      label: 'Forwarded',
      value: stats?.forwardedCount ?? 0,
      icon: AlertTriangle,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      label: 'Assigned',
      value: stats?.assignedCount ?? 0,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'In Progress',
      value: stats?.inProgressCount ?? 0,
      icon: PlayCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      label: 'Pending Verification',
      value: stats?.pendingVerificationCount ?? 0,
      icon: ShieldCheck,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      label: 'Completed',
      value: stats?.completedCount ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
  ];

  const pendingItems = isWorker
    ? grievances.filter((g) =>
        ['TECHNICAL_ASSIGNED', 'TECHNICAL_IN_PROGRESS'].includes(g.status)
      )
    : grievances.filter((g) =>
        ['FORWARDED_TO_TECHNICAL', 'TECHNICAL_ASSIGNED', 'TECHNICAL_IN_PROGRESS', 'TECHNICAL_COMPLETED'].includes(g.status)
      );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Technical Dashboard
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isWorker
              ? 'Your technical assignments and work progress'
              : 'Monitor and manage all technical grievances'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/teacher/technical/grievances')}
          >
            <ClipboardList className="w-4 h-4 mr-1.5" />
            {isWorker ? 'My Tasks' : 'All Technical'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pending Work */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              {isWorker ? 'My Active Tasks' : 'Pending Technical Work'}
            </CardTitle>
            {pendingItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/teacher/technical/grievances')}
              >
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : pendingItems.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                No pending technical work
              </p>
              <p className="text-xs text-slate-400 mt-1">
                All technical grievances are up to date.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingItems.slice(0, 8).map((g) => (
                <div
                  key={g._id}
                  onClick={() => navigate(`/teacher/technical/grievances/${g._id}`)}
                  className="flex items-start justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {g.trackingId}
                      </span>
                      <StatusBadge status={g.status} />
                      <PriorityBadge priority={g.priority} />
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white truncate">
                      {g.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {g.location} •{' '}
                      {typeof g.student === 'object' && g.student?.name
                        ? g.student.name
                        : 'Student'}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-3 mt-1" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Workflow Info */}
      {!isWorker && (
        <Card className="border-orange-100 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/10">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Wrench className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Technical Workflow
                </h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
                  {[
                    'Forward to Technical',
                    '→ Assign Worker',
                    '→ Work in Progress',
                    '→ Work Completed',
                    '→ Faculty Verify',
                    '→ Student Confirms',
                    '→ Closed',
                  ].map((step, i) => (
                    <span
                      key={i}
                      className={
                        i === 0
                          ? 'font-semibold text-orange-600 dark:text-orange-400'
                          : ''
                      }
                    >
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
