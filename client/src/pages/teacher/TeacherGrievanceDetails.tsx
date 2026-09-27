import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { Grievance, Message } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { SLACountdown } from '@/components/ui/SLACountdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/EmptyState';
import {
  ArrowLeft,
  Building,
  User,
  ExternalLink,
  MessageSquare,
  Lock,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertOctagon,
  ShieldAlert,
  Trash2,
} from 'lucide-react';

export const TeacherGrievanceDetails: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [messageText, setMessageText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Resolution Modal state
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // 1. Fetch Grievance details
  const {
    data: grievanceData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['teacher-grievance', id],
    queryFn: async () => {
      const res = await api.get(`/grievances/${id}`);
      return res.data.grievance as Grievance;
    },
  });

  // 2. Fetch Conversation + Internal Notes
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['teacher-grievance-messages', id],
    queryFn: async () => {
      const res = await api.get(`/messages/grievance/${id}`);
      return res.data.messages as Message[];
    },
  });

  const grievance = grievanceData;
  const messages = messagesData || [];

  // Handle Mark In Progress
  const handleSetInProgress = async () => {
    try {
      await api.patch(`/grievances/${id}/status`, { status: 'IN_PROGRESS' });
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Handle Mark Resolved
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTaken.trim() || isResolving) return;

    setIsResolving(true);
    try {
      await api.patch(`/grievances/${id}/status`, {
        status: 'RESOLVED',
        actionTaken: actionTaken.trim(),
        notes: resolutionNotes.trim(),
      });
      setResolveModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resolve grievance.');
    } finally {
      setIsResolving(false);
    }
  };

  // Handle Post Message or Internal Note
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending) return;

    setIsSending(true);
    try {
      await api.post(`/messages/grievance/${id}`, {
        message: messageText.trim(),
        isInternalNote,
      });
      setMessageText('');
      setIsInternalNote(false);
      refetchMessages();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post message.');
    } finally {
      setIsSending(false);
    }
  };

  // AI Summarization
  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const res = await api.post('/ai/summarize-grievance', { grievanceId: id });
      setAiSummary(res.data.summary);
    } catch {
      setAiSummary('Summary service unavailable.');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !grievance) {
    return <ErrorState onRetry={() => refetch()} message="Unable to load case file." />;
  }

  // Visual Timeline Steps
  const timelineSteps = [
    { label: 'Submitted', isPassed: true, current: grievance.status === 'PENDING' },
    {
      label: 'Assigned',
      isPassed: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED', 'REOPENED'].includes(
        grievance.status
      ),
      current: grievance.status === 'ASSIGNED',
    },
    {
      label: 'In Progress',
      isPassed: ['IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED', 'REOPENED'].includes(
        grievance.status
      ),
      current: grievance.status === 'IN_PROGRESS',
    },
    {
      label: grievance.status === 'ESCALATED' ? 'Escalated to Admin' : 'Resolution Review',
      isPassed: ['RESOLVED', 'CLOSED', 'ESCALATED', 'REOPENED'].includes(grievance.status),
      current: ['ESCALATED', 'REOPENED'].includes(grievance.status),
      isAlert: grievance.status === 'ESCALATED',
    },
    {
      label: 'Closed',
      isPassed: grievance.status === 'CLOSED',
      current: grievance.status === 'CLOSED',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header and Back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(isAdmin ? '/admin/grievances' : '/teacher/grievances')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isAdmin ? 'Back to All Grievances' : 'Back to Assigned Cases'}</span>
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateSummary}
          isLoading={isSummarizing}
          className="text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>AI Case Summary</span>
        </Button>
      </div>

      {/* AI Summary Banner */}
      {aiSummary && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 border border-indigo-200 dark:border-indigo-900/60 space-y-1.5 text-xs shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Executive Summary</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {aiSummary}
          </p>
        </div>
      )}

      {/* Case Overview Card */}
      <Card className="shadow-md">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {grievance.trackingId}
                </span>
                <StatusBadge status={grievance.status} />
                <PriorityBadge priority={grievance.priority} />
                <span className="text-xs text-slate-500 font-semibold">• {grievance.category}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {grievance.title}
              </h1>
            </div>

            <div className="shrink-0">
              <SLACountdown dueAt={grievance.dueAt} status={grievance.status} />
            </div>
          </div>

          {/* Visual Progress Timeline */}
          <div className="py-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Resolution Lifecycle Progression
            </div>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`h-2.5 w-full rounded-full mb-2 ${
                      step.current
                        ? step.isAlert
                          ? 'bg-rose-500 ring-2 ring-rose-400/40 animate-pulse'
                          : 'bg-indigo-600 ring-2 ring-indigo-400/40'
                        : step.isPassed
                        ? 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-semibold leading-tight ${
                      step.current
                        ? step.isAlert
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : step.isPassed
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Officer Actions Bar */}
          {grievance.status === 'ESCALATED' && isTeacher ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                  Complaint Escalated to University Administration
                </h4>
                <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">
                  This grievance exceeded the resolution SLA deadline and has been automatically escalated to university executive administration. Faculty members cannot modify or resolve escalated complaints. Only senior administrators have authority to act on escalated cases.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold">Officer Status Controls: </span>
                <span>Current lifecycle phase is </span>
                <span className="font-bold text-slate-900 dark:text-white">{grievance.status}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* General Teacher Status Controls */}
                {['ASSIGNED', 'PENDING', 'REOPENED'].includes(grievance.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSetInProgress}
                    className="font-bold text-xs"
                  >
                    <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    Mark In Progress
                  </Button>
                )}

                {/* Forward to Technical Team Button (Teacher/Admin) */}
                {(isTeacher || isAdmin) && !grievance.isTechnical && !['RESOLVED', 'CLOSED', 'ESCALATED'].includes(grievance.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 font-bold text-xs"
                    onClick={async () => {
                      const note = prompt('Add note for technical team (optional):');
                      try {
                        await api.post(`/technical/${id}/forward-technical`, { forwardNote: note });
                        refetch();
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Failed to forward.');
                      }
                    }}
                  >
                    ⚡ Forward to Technical Team
                  </Button>
                )}

                {/* Assign Worker Button (Teacher/Admin when forwarded) */}
                {(isTeacher || isAdmin) && grievance.isTechnical && grievance.status === 'FORWARDED_TO_TECHNICAL' && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
                    onClick={async () => {
                      try {
                        const workersRes = await api.get('/workers');
                        const workers = workersRes.data.workers || [];
                        if (workers.length === 0) {
                          alert('No workers registered yet.');
                          return;
                        }
                        const workerNames = workers.map((w: any, idx: number) => `${idx + 1}. ${w.name} (${w.designation})`).join('\n');
                        const choice = prompt(`Select worker number to assign:\n${workerNames}`);
                        const num = parseInt(choice || '', 10);
                        if (num > 0 && num <= workers.length) {
                          await api.post(`/technical/${id}/assign-worker`, { workerId: workers[num - 1]._id });
                          refetch();
                        }
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Failed to assign worker.');
                      }
                    }}
                  >
                    👷 Assign Technical Staff
                  </Button>
                )}

                {/* Worker Action: Start Work */}
                {user?.role === 'worker' && grievance.status === 'TECHNICAL_ASSIGNED' && (
                  <Button
                    size="sm"
                    variant="success"
                    className="font-bold text-xs"
                    onClick={async () => {
                      try {
                        await api.patch(`/technical/${id}/start-work`);
                        refetch();
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Failed to start work.');
                      }
                    }}
                  >
                    ▶ Start Technical Work
                  </Button>
                )}

                {/* Worker Action: Submit Work Report */}
                {user?.role === 'worker' && ['TECHNICAL_IN_PROGRESS', 'TECHNICAL_ASSIGNED'].includes(grievance.status) && (
                  <Button
                    size="sm"
                    variant="success"
                    className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={async () => {
                      const problem = prompt('Describe Problem Summary:', grievance.title);
                      if (!problem) return;
                      const rootCause = prompt('Root Cause identified (e.g. faulty switch, loose cable):');
                      const workPerformed = prompt('Work Performed details:');
                      if (!workPerformed) return;
                      const equipmentUsed = prompt('Equipment / Resources used:');
                      const resolution = prompt('Final Technical Resolution description:');
                      if (!resolution) return;

                      try {
                        await api.post(`/technical/${id}/work-report`, {
                          problem,
                          rootCause,
                          workPerformed,
                          equipmentUsed,
                          resolution,
                        });
                        refetch();
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Failed to submit work report.');
                      }
                    }}
                  >
                    📋 Submit Work Report
                  </Button>
                )}

                {/* Faculty Verification Action (Approve / Reject) */}
                {(isTeacher || isAdmin) && grievance.status === 'TECHNICAL_COMPLETED' && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold"
                      onClick={async () => {
                        const reason = prompt('Reason for rejecting technical resolution:');
                        if (!reason) return;
                        try {
                          await api.patch(`/technical/${id}/verify-technical`, { action: 'REJECT', rejectionReason: reason });
                          refetch();
                        } catch (err: any) {
                          alert(err.response?.data?.message || 'Failed to reject.');
                        }
                      }}
                    >
                      ✕ Reject Work
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      className="text-xs font-bold"
                      onClick={async () => {
                        try {
                          await api.patch(`/technical/${id}/verify-technical`, { action: 'APPROVE' });
                          refetch();
                        } catch (err: any) {
                          alert(err.response?.data?.message || 'Failed to verify.');
                        }
                      }}
                    >
                      ✓ Verify & Send to Student
                    </Button>
                  </div>
                )}

                {grievance.status !== 'RESOLVED' && grievance.status !== 'CLOSED' && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => setResolveModalOpen(true)}
                    className="font-bold text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Mark Resolved & Document Action
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Student Info & Grievance Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Student Complaint Description
                </h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80">
                  {grievance.description}
                </p>
              </div>

              {/* Attachments */}
              {grievance.attachments && grievance.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Student Evidence Files ({grievance.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {grievance.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 transition-colors text-xs group"
                      >
                        <span className="truncate max-w-[200px] font-medium text-slate-700 dark:text-slate-300">
                          {att.filename}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Student Profile Metadata */}
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Submitting Student
                  </span>
                  <div className="mt-1 font-bold text-slate-900 dark:text-white text-sm">
                    {grievance.student?.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ID: {grievance.student?.institutionalId}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Dept: {grievance.student?.department}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Incident Location
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {grievance.location}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Created At
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(grievance.createdAt).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Authoritative 24h Deadline
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {new Date(grievance.dueAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Documented Resolution if available */}
          {grievance.resolution?.actionTaken && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
              <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Documented Action Taken</span>
              </div>
              <p className="text-emerald-800 dark:text-emerald-300 font-medium">
                {grievance.resolution.actionTaken}
              </p>
              {grievance.resolution.notes && (
                <p className="text-emerald-700 dark:text-emerald-400 italic">
                  Notes: {grievance.resolution.notes}
                </p>
              )}
            </div>
          )}

          {/* Delete button for CLOSED grievances */}
          {grievance.status === 'CLOSED' && (
            <div className="p-4 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Complaint Closed</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This complaint has been fully resolved and closed. You may permanently delete this record.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40"
                onClick={async () => {
                  if (confirm(`Permanently delete closed grievance ${grievance.trackingId}?`)) {
                    try {
                      await api.delete(`/grievances/${grievance._id}`);
                      navigate('/teacher/grievances');
                    } catch (err: any) {
                      alert(err.response?.data?.message || 'Failed to delete grievance.');
                    }
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete Ticket
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communication Thread & Staff Notes */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-base">Investigation Communications</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Exchange responses with the student or log private internal notes for administrative records.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No discussion or internal notes recorded yet.
              </div>
            ) : (
              messages.map((msg) => {
                const isStudent = msg.senderRole === 'student';
                const isInternal = msg.isInternalNote;

                if (isInternal) {
                  return (
                    <div
                      key={msg._id}
                      className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-amber-900 dark:text-amber-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          Internal Faculty Note ({msg.sender.name})
                        </span>
                        <span className="text-[10px] text-amber-600">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-amber-950 dark:text-amber-200 font-medium whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${!isStudent ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {msg.sender.name} ({msg.senderRole})
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl max-w-lg text-xs leading-relaxed ${
                        !isStudent
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm border border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message / Internal Note input */}
          {grievance.status === 'ESCALATED' && isTeacher ? (
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs text-center font-medium flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Faculty messaging and resolution controls are disabled for escalated complaints.</span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="msgType"
                    checked={!isInternalNote}
                    onChange={() => setIsInternalNote(false)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Public Response to Student</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-amber-700 dark:text-amber-400">
                  <input
                    type="radio"
                    name="msgType"
                    checked={isInternalNote}
                    onChange={() => setIsInternalNote(true)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Staff Internal Note (Hidden from student)
                  </span>
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    isInternalNote
                      ? 'Enter internal note for staff & administration...'
                      : 'Reply to the student regarding steps taken...'
                  }
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <Button type="submit" size="sm" isLoading={isSending} className="px-4 font-bold">
                  <Send className="w-3.5 h-3.5 mr-1" />
                  {isInternalNote ? 'Save Note' : 'Send'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Resolution Documentation Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Document Grievance Resolution"
        description="Detail the remedial actions taken to resolve the student's issue. This will be visible to the student and university administration."
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <Textarea
            label="Action Taken / Solution Provided"
            required
            rows={4}
            placeholder="e.g. Technician replaced port 8 patch cable and rebooted AP-03 in Lab 3. WiFi speed tested at 95 Mbps."
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
          />

          <Textarea
            label="Internal Notes / Follow-up (Optional)"
            rows={2}
            placeholder="Any maintenance schedules or preventative actions..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResolveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              size="sm"
              isLoading={isResolving}
              className="font-bold"
            >
              Confirm Resolution
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
