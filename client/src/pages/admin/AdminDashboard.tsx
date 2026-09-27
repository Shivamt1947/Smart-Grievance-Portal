import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { AnalyticsMetrics, AIInsight } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  Clock,
  AlertOctagon,
  TrendingUp,
  Sparkles,
  Layers,
  Star,
  ArrowRight,
  UserCheck,
  Building2,
  RefreshCw,
  Info,
  ExternalLink,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeMetricModal, setActiveMetricModal] = useState<
    'total' | 'pending' | 'in_progress' | 'resolved' | 'escalated' | 'satisfaction' | null
  >(null);

  // 1. Fetch system analytics metrics from backend
  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics');
      return res.data.metrics as AnalyticsMetrics;
    },
  });

  // 2. Fetch AI Insights
  const { data: insightsData, isLoading: isInsightsLoading } = useQuery({
    queryKey: ['admin-ai-insights'],
    queryFn: async () => {
      const res = await api.get('/admin/ai-insights');
      return res.data.insights as AIInsight[];
    },
  });

  const metrics = analyticsData;
  const insights = insightsData || [];

  if (isAnalyticsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !metrics) {
    return <ErrorState onRetry={() => refetch()} message="Unable to aggregate administrative analytics." />;
  }

  // Format priority data for PieChart
  const priorityChartData = [
    { name: 'Low', value: metrics.priorityBreakdown.LOW || 0, color: '#10b981' },
    { name: 'Medium', value: metrics.priorityBreakdown.MEDIUM || 0, color: '#3b82f6' },
    { name: 'High', value: metrics.priorityBreakdown.HIGH || 0, color: '#f59e0b' },
    { name: 'Urgent', value: metrics.priorityBreakdown.URGENT || 0, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Campus Pulse */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold uppercase tracking-wider text-purple-300">
              <ShieldAlert className="w-3.5 h-3.5" />
              University Executive Control Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Institutional Redressal & Resolution Dashboard
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time monitoring across student grievances, departmental response times, 24-hour SLA adherence, and campus incident clustering.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => navigate('/admin/grievances')}
              className="bg-blue-600 hover:bg-blue-500 font-bold"
            >
              Manage Grievances
            </Button>
            <Button
              onClick={() => navigate('/admin/common-issues')}
              variant="secondary"
              className="font-bold"
            >
              Campus Incidents
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards (Clickable) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card
          onClick={() => setActiveMetricModal('total')}
          className="p-4 flex flex-col justify-between h-full cursor-pointer hover:border-blue-400 hover:shadow-md hover:scale-[1.02] transition-all group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between gap-1">
              <span className="truncate">Total Tickets</span>
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.totalGrievances}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-medium transition-colors pt-2">
            Click for details ➔
          </span>
        </Card>

        <Card
          onClick={() => setActiveMetricModal('pending')}
          className="p-4 flex flex-col justify-between h-full border-amber-200 dark:border-amber-900/60 bg-amber-50/20 cursor-pointer hover:border-amber-400 hover:shadow-md hover:scale-[1.02] transition-all group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase flex items-center justify-between gap-1">
              <span className="truncate">Pending / Assigned</span>
              <Info className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-600 transition-colors shrink-0" />
            </span>
            <h3 className="text-2xl font-black text-amber-600">
              {metrics.pendingCount + metrics.assignedCount}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 group-hover:text-amber-700 font-medium transition-colors pt-2">
            Click for details ➔
          </span>
        </Card>

        <Card
          onClick={() => setActiveMetricModal('in_progress')}
          className="p-4 flex flex-col justify-between h-full border-blue-200 dark:border-blue-900/60 bg-blue-50/20 cursor-pointer hover:border-blue-400 hover:shadow-md hover:scale-[1.02] transition-all group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase flex items-center justify-between gap-1">
              <span className="truncate">In Investigation</span>
              <Info className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </span>
            <h3 className="text-2xl font-black text-blue-600">
              {metrics.inProgressCount}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 group-hover:text-blue-700 font-medium transition-colors pt-2">
            Click for details ➔
          </span>
        </Card>

        <Card
          onClick={() => setActiveMetricModal('resolved')}
          className="p-4 flex flex-col justify-between h-full border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 cursor-pointer hover:border-emerald-400 hover:shadow-md hover:scale-[1.02] transition-all group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase flex items-center justify-between gap-1">
              <span className="truncate">Resolved / Closed</span>
              <Info className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-600 transition-colors shrink-0" />
            </span>
            <h3 className="text-2xl font-black text-emerald-600">
              {metrics.resolvedCount + metrics.closedCount}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 group-hover:text-emerald-700 font-medium transition-colors pt-2">
            Click for details ➔
          </span>
        </Card>

        <Card
          onClick={() => setActiveMetricModal('escalated')}
          className="p-4 flex flex-col justify-between h-full border-rose-300 dark:border-rose-900 bg-rose-50/30 cursor-pointer hover:border-rose-500 hover:shadow-md hover:scale-[1.02] transition-all group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase flex items-center justify-between gap-1">
              <span className="truncate">Escalated (24h)</span>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500 group-hover:text-rose-600 transition-colors shrink-0" />
            </span>
            <h3 className="text-2xl font-black text-rose-600">
              {metrics.escalatedCount}
            </h3>
          </div>
          <span className="text-[10px] text-rose-500 font-medium group-hover:underline pt-2">
            Click for details ➔
          </span>
        </Card>

        <Card
          onClick={() => setActiveMetricModal('satisfaction')}
          className="p-4 flex flex-col justify-between h-full border-purple-200 dark:border-purple-900/60 bg-purple-50/20 cursor-pointer hover:border-purple-400 hover:shadow-md hover:scale-[1.02] transition-all group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase flex items-center justify-between gap-1">
              <span className="truncate">Satisfaction</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
            </span>
            <h3 className="text-2xl font-black text-purple-600 flex items-center gap-1">
              <span>{metrics.averageRating > 0 ? metrics.averageRating : '5.0'}</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 group-hover:text-purple-700 font-medium transition-colors pt-2">
            Click for details ➔
          </span>
        </Card>
      </div>

      {/* AI Executive Insights Section */}
      <Card className="border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/50 via-white to-blue-50/50 dark:from-slate-900 dark:to-slate-900 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base">AI Administrative Insights & Pattern Discovery</CardTitle>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-semibold">
              Live Database Intelligence
            </span>
          </div>
          <CardDescription className="text-xs">
            Synthesized operational observations computed directly from university grievance volumes and SLA turnaround.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isInsightsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insights.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        item.type === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : item.type === 'CLUSTER'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Section: Submissions Trend & Category Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Submissions Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Grievance Submissions Trend (Past 7 Days)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Daily filing volume across all college departments.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.trendLast7Days}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTrend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Priority Breakdown</CardTitle>
            <CardDescription className="text-xs">
              Distribution of incoming urgency ratings.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              {priorityChartData.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-slate-600 dark:text-slate-400">
                    {p.name}: <b>{p.value}</b>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Bar Chart & Faculty Workload Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Grievance Volume by Category</CardTitle>
            <CardDescription className="text-xs">
              Categorical distribution identifying institutional pressure points.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.categoryBreakdown.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="_id" fontSize={10} interval={0} angle={-15} textAnchor="end" height={45} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Faculty Workload Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Faculty Workload Distribution</CardTitle>
              <button
                onClick={() => navigate('/admin/users?role=teacher')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View all faculty →
              </button>
            </div>
            <CardDescription className="text-xs">
              Active caseload, resolution totals, and overdue rates per officer.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-2">Faculty Officer</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2 text-center">Active</th>
                    <th className="pb-2 text-center">Resolved</th>
                    <th className="pb-2 text-center text-rose-600">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {metrics.teacherWorkloads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No faculty records found.
                      </td>
                    </tr>
                  ) : (
                    metrics.teacherWorkloads.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                          {t.name}
                        </td>
                        <td className="py-2.5 text-slate-500">{t.department}</td>
                        <td className="py-2.5 text-center font-bold text-blue-600">
                          {t.activeCount}
                        </td>
                        <td className="py-2.5 text-center font-bold text-emerald-600">
                          {t.resolvedCount}
                        </td>
                        <td className="py-2.5 text-center font-bold text-rose-600">
                          {t.escalatedCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Metric Detail Modal */}
      <Modal
        isOpen={activeMetricModal !== null}
        onClose={() => setActiveMetricModal(null)}
        title={
          activeMetricModal === 'total'
            ? 'Total Grievances Overview'
            : activeMetricModal === 'pending'
            ? 'Pending & Assigned Complaints'
            : activeMetricModal === 'in_progress'
            ? 'In-Progress Investigations'
            : activeMetricModal === 'resolved'
            ? 'Resolved & Closed Complaints'
            : activeMetricModal === 'escalated'
            ? '24-Hour SLA Escalated Complaints'
            : activeMetricModal === 'satisfaction'
            ? 'Student Satisfaction & Rating Details'
            : ''
        }
        description={
          activeMetricModal === 'total'
            ? 'Real-time aggregated metrics across all university grievance categories and priorities.'
            : activeMetricModal === 'pending'
            ? 'Tickets registered by students awaiting initial investigation or faculty assignment.'
            : activeMetricModal === 'in_progress'
            ? 'Complaints currently undergoing active departmental investigation.'
            : activeMetricModal === 'resolved'
            ? 'Successfully resolved student complaints with documented remedial actions.'
            : activeMetricModal === 'escalated'
            ? 'High-priority complaints that breached the 24-hour resolution SLA deadline.'
            : activeMetricModal === 'satisfaction'
            ? 'Student rating sentiment, turnaround speed, and grievance resolution quality.'
            : ''
        }
      >
        <div className="space-y-4">
          {activeMetricModal === 'total' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 block">Total Filings</span>
                  <span className="text-2xl font-black text-blue-900 dark:text-blue-100">{metrics.totalGrievances}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 block">Total Students</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalStudents}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Lifecycle Status Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <div className="flex justify-between"><span>Pending:</span> <span className="font-bold text-amber-600">{metrics.pendingCount}</span></div>
                  <div className="flex justify-between"><span>Assigned:</span> <span className="font-bold text-indigo-600">{metrics.assignedCount}</span></div>
                  <div className="flex justify-between"><span>In Progress:</span> <span className="font-bold text-blue-600">{metrics.inProgressCount}</span></div>
                  <div className="flex justify-between"><span>Resolved:</span> <span className="font-bold text-emerald-600">{metrics.resolvedCount}</span></div>
                  <div className="flex justify-between"><span>Closed:</span> <span className="font-bold text-slate-500">{metrics.closedCount}</span></div>
                  <div className="flex justify-between"><span>Escalated (24h):</span> <span className="font-bold text-rose-600">{metrics.escalatedCount}</span></div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setActiveMetricModal(null);
                  navigate('/admin/grievances');
                }}
                className="w-full font-bold justify-center"
              >
                View All Grievances in Directory
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {activeMetricModal === 'pending' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block">Pending Tickets</span>
                  <span className="text-2xl font-black text-amber-600">{metrics.pendingCount}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                  <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 block">Assigned Tickets</span>
                  <span className="text-2xl font-black text-indigo-600">{metrics.assignedCount}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                These tickets require prompt initial review or faculty response. Early resolution ensures compliance within the strict 24-hour university SLA window.
              </p>

              <Button
                onClick={() => {
                  setActiveMetricModal(null);
                  navigate('/admin/grievances?status=PENDING');
                }}
                className="w-full font-bold justify-center bg-amber-600 hover:bg-amber-500 text-white"
              >
                Filter Pending & Assigned Cases
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {activeMetricModal === 'in_progress' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">Active Investigations</span>
                <span className="text-4xl font-black text-blue-600 block mt-1">{metrics.inProgressCount}</span>
                <span className="text-xs text-slate-500 mt-1 block">Under active faculty review & student discussion</span>
              </div>

              <Button
                onClick={() => {
                  setActiveMetricModal(null);
                  navigate('/admin/grievances?status=IN_PROGRESS');
                }}
                className="w-full font-bold justify-center bg-blue-600 hover:bg-blue-500 text-white"
              >
                Filter In-Progress Cases
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {activeMetricModal === 'resolved' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 block">Resolved</span>
                  <span className="text-2xl font-black text-emerald-600">{metrics.resolvedCount}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 block">Closed</span>
                  <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{metrics.closedCount}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 text-xs space-y-1">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">Turnaround Performance:</span>
                <p className="text-slate-600 dark:text-slate-300">
                  Average time to resolution across campus is <strong>{metrics.avgResolutionHours} hours</strong>.
                </p>
              </div>

              <Button
                onClick={() => {
                  setActiveMetricModal(null);
                  navigate('/admin/grievances?status=RESOLVED');
                }}
                className="w-full font-bold justify-center bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Filter Resolved & Closed Cases
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {activeMetricModal === 'escalated' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-center space-y-1">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">SLA Escalated (24h)</span>
                <span className="text-4xl font-black text-rose-600 block">{metrics.escalatedCount}</span>
                <span className="text-xs font-bold text-rose-600 block">Escalation Breach Rate: {metrics.escalationRate}%</span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Escalated complaints exceed the 24-hour SLA deadline. Faculty access is locked for these cases, requiring administrative intervention.
                </span>
              </div>

              <Button
                onClick={() => {
                  setActiveMetricModal(null);
                  navigate('/admin/grievances?status=ESCALATED');
                }}
                className="w-full font-bold justify-center bg-rose-600 hover:bg-rose-500 text-white"
              >
                Manage Escalated Complaints Now
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {activeMetricModal === 'satisfaction' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center space-y-1">
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">Average Student Rating</span>
                <div className="flex items-center justify-center gap-1.5 text-3xl font-black text-purple-600 mt-1">
                  <span>{metrics.averageRating > 0 ? metrics.averageRating : '5.0'}</span>
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                </div>
                <span className="text-xs text-slate-500 block">{metrics.totalFeedback} authenticated student reviews</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">Satisfaction Breakdown:</span>
                <p>Calculated from verified post-resolution student ratings and timeliness assessments.</p>
              </div>

              <Button
                onClick={() => {
                  setActiveMetricModal(null);
                  navigate('/admin/analytics');
                }}
                className="w-full font-bold justify-center bg-purple-600 hover:bg-purple-500 text-white"
              >
                View Deep Analytics & Satisfaction Charts
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
