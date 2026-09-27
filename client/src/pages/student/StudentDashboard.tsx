import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import type { Grievance, CommonIssueData } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { SLACountdown } from '@/components/ui/SLACountdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  FilePlus2,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Layers,
  Sparkles,
  Send,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building,
  Trash2,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<
    Array<{ sender: 'user' | 'ai'; text: string }>
  >([
    {
      sender: 'ai',
      text: `Hello ${user?.name || 'Student'}! I am your AI Grievance Assistant. You can ask me how to report an issue, check the status of your complaints, or ask about the 24-hour resolution SLA.`,
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Fetch recent student grievances
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['student-grievances-summary'],
    queryFn: async () => {
      const res = await api.get('/grievances?limit=5');
      return res.data;
    },
  });

  // Fetch campus common issues
  const { data: commonIssuesData } = useQuery({
    queryKey: ['campus-common-issues'],
    queryFn: async () => {
      const res = await api.get('/common-issues');
      return res.data.commonIssues as CommonIssueData[];
    },
  });

  const grievances: Grievance[] = data?.grievances || [];
  const totalCount = data?.pagination?.total || 0;

  // Calculate quick stats from real data
  const pendingCount = grievances.filter((g) => ['PENDING', 'ASSIGNED'].includes(g.status)).length;
  const inProgressCount = grievances.filter((g) => g.status === 'IN_PROGRESS').length;
  const resolvedCount = grievances.filter((g) => ['RESOLVED', 'CLOSED'].includes(g.status)).length;
  const escalatedCount = grievances.filter((g) => g.status === 'ESCALATED').length;

  const handleSendAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatInput.trim() || isAiLoading) return;

    const query = aiChatInput.trim();
    setAiChatInput('');
    setAiChatHistory((prev) => [...prev, { sender: 'user', text: query }]);
    setIsAiLoading(true);

    try {
      const res = await api.post('/ai/chat-assistant', { query });
      setAiChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: res.data.answer || 'Thank you. I have checked your file.' },
      ]);
    } catch {
      setAiChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'I am currently unable to access the grievance knowledge base. Please check back shortly.',
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold uppercase tracking-wider text-blue-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Institutional Student
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-sm text-blue-100/90 max-w-xl">
              Student ID: <span className="font-mono font-bold">{user?.institutionalId}</span> • Department of{' '}
              <span className="font-semibold">{user?.department}</span> (Year {user?.year}, Div {user?.division || 'A'})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate('/student/grievances/new')}
              className="bg-white text-blue-950 hover:bg-slate-100 dark:bg-white dark:text-blue-950 dark:hover:bg-slate-100 shadow-xl font-extrabold shrink-0 border border-white/20"
              size="lg"
            >
              <FilePlus2 className="w-5 h-5 text-blue-600 dark:text-blue-700" />
              <span>Submit Grievance</span>
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Interactive Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => navigate('/student/grievances')}
          className="p-5 flex items-center justify-between cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Submitted
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              {totalCount}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shrink-0 self-center">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </Card>

        <Card
          onClick={() => navigate('/student/grievances?status=IN_PROGRESS')}
          className="p-5 flex items-center justify-between cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              In Progress
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
          onClick={() => navigate('/student/grievances?status=RESOLVED')}
          className="p-5 flex items-center justify-between cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resolved
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
          onClick={() => navigate('/student/grievances?status=ESCALATED')}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Grievances List (2 Columns on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Recent Grievance Submissions</span>
            </h2>
            <button
              onClick={() => navigate('/student/grievances')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all ({totalCount}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : grievances.length === 0 ? (
            <EmptyState
              title="No grievances submitted yet"
              description="You have not filed any grievances. If you are experiencing infrastructure, academic, or network issues, submit a ticket."
              actionText="Submit Your First Grievance"
              onAction={() => navigate('/student/grievances/new')}
            />
          ) : (
            <div className="space-y-3">
              {grievances.map((item) => (
                <Card
                  key={item._id}
                  onClick={() => navigate(`/student/grievances/${item._id}`)}
                  className="cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {item.trackingId}
                        </span>
                        <StatusBadge status={item.status} />
                        <PriorityBadge priority={item.priority} />
                        <span className="text-xs text-slate-400">• {item.category}</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        <span>{item.location}</span>
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col sm:items-end gap-1.5">
                      <div className="flex items-center gap-2">
                        {item.status === 'CLOSED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40 py-0.5 px-2 h-7"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`Permanently delete closed grievance ${item.trackingId}?`)) {
                                try {
                                  await api.delete(`/grievances/${item._id}`);
                                  refetch();
                                } catch (err: any) {
                                  alert(err.response?.data?.message || 'Failed to delete grievance.');
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        )}
                        <SLACountdown dueAt={item.dueAt} status={item.status} compact />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Widgets: Campus Common Issues & AI Assistant */}
        <div className="space-y-6">
          {/* Active Campus Common Issues */}
          <Card className="border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
                <Layers className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base">Active Campus Outages</CardTitle>
              </div>
              <CardDescription>
                Known incidents affecting multiple students currently being resolved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {!commonIssuesData || commonIssuesData.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center">
                  No active campus-wide incidents reported.
                </div>
              ) : (
                commonIssuesData.slice(0, 3).map((issue) => (
                  <div
                    key={issue._id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {issue.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                        {issue.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      📍 {issue.location}
                    </p>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                      👥 {issue.affectedStudentCount} student complaints clustered
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* AI Grievance Assistant Chat */}
          <Card className="border-blue-200 dark:border-blue-900/50 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">AI Grievance Assistant</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Contextual institutional guide grounded in your submissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Chat Thread */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {aiChatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl text-xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white ml-6 font-medium'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-4'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {isAiLoading && (
                  <div className="p-2 text-xs text-slate-400 animate-pulse">
                    AI Assistant is thinking...
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendAiQuery} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask e.g. What is the status of my WiFi complaint?"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Button type="submit" size="sm" isLoading={isAiLoading} className="px-3">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
