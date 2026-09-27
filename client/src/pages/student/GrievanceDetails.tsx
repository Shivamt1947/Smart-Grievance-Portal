import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Grievance, Message, FeedbackData } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { SLACountdown } from '@/components/ui/SLACountdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/EmptyState';
import {
  ArrowLeft,
  Building,
  Calendar,
  UserCheck,
  Send,
  MessageSquare,
  Sparkles,
  Paperclip,
  Star,
  CheckCircle2,
  RotateCcw,
  AlertOctagon,
  Clock,
  ExternalLink,
  Trash2,
} from 'lucide-react';

export const GrievanceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Reopen Modal state
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);

  // Feedback Modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // 1. Fetch Grievance details
  const {
    data: grievanceData,
    isLoading: isGrievanceLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['grievance-details', id],
    queryFn: async () => {
      const res = await api.get(`/grievances/${id}`);
      return res.data.grievance as Grievance;
    },
  });

  // 2. Fetch Conversation messages
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['grievance-messages', id],
    queryFn: async () => {
      const res = await api.get(`/messages/grievance/${id}`);
      return res.data.messages as Message[];
    },
  });

  // 3. Fetch Feedback if exists
  const { data: feedbackData, refetch: refetchFeedback } = useQuery({
    queryKey: ['grievance-feedback', id],
    queryFn: async () => {
      const res = await api.get(`/feedback/grievance/${id}`);
      return res.data.feedback as FeedbackData | null;
    },
  });

  const grievance = grievanceData;
  const messages = messagesData || [];
  const existingFeedback = feedbackData;

  // Handle post message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      await api.post(`/messages/grievance/${id}`, { message: replyMessage.trim() });
      setReplyMessage('');
      refetchMessages();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle confirm resolution & close
  const handleConfirmClose = async () => {
    try {
      await api.post(`/grievances/${id}/close`);
      refetch();
      setFeedbackModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to close grievance.');
    }
  };

  // Handle reopen
  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim() || isReopening) return;

    setIsReopening(true);
    try {
      await api.post(`/grievances/${id}/reopen`, { reopenReason: reopenReason.trim() });
      setReopenModalOpen(false);
      setReopenReason('');
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reopen grievance.');
    } finally {
      setIsReopening(false);
    }
  };

  // Handle submit feedback
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingFeedback) return;

    setIsSubmittingFeedback(true);
    try {
      await api.post('/feedback', {
        grievanceId: id,
        rating,
        comment: feedbackComment.trim(),
        timelinessRating: rating,
        satisfactionRating: rating,
      });
      setFeedbackModalOpen(false);
      refetchFeedback();
      queryClient.invalidateQueries({ queryKey: ['grievance-feedback', id] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // AI Summarization trigger
  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const res = await api.post('/ai/summarize-grievance', { grievanceId: id });
      setAiSummary(res.data.summary);
    } catch {
      setAiSummary('Summary service currently unavailable.');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isGrievanceLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !grievance) {
    return <ErrorState onRetry={() => refetch()} message="Unable to load grievance file." />;
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
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/student/grievances')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Grievances</span>
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateSummary}
          isLoading={isSummarizing}
          className="text-xs font-semibold gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Generate AI Summary</span>
        </Button>
      </div>

      {/* AI Summary Card if requested */}
      {aiSummary && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border border-blue-200 dark:border-blue-900/60 space-y-1.5 text-xs shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI Executive Summary</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {aiSummary}
          </p>
        </div>
      )}

      {/* Main Grievance Header Card */}
      <Card className="shadow-md">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
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
                          : 'bg-blue-600 ring-2 ring-blue-400/40'
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
                          : 'text-blue-600 dark:text-blue-400 font-bold'
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

          {/* Issue Details Body */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Detailed Grievance Description
                </h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80">
                  {grievance.description}
                </p>
              </div>

              {/* Attachments */}
              {grievance.attachments && grievance.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Evidence Attachments ({grievance.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {grievance.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-colors text-xs group"
                      >
                        <span className="truncate max-w-[200px] font-medium text-slate-700 dark:text-slate-300">
                          {att.filename}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Officer & Metadata Sidebar */}
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Campus Location
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {grievance.location}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Assigned Officer
                  </span>
                  {grievance.assignedTeacher ? (
                    <div className="mt-1">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {grievance.assignedTeacher.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {grievance.assignedTeacher.department}
                      </div>
                    </div>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Awaiting Administrator Assignment
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Submission Timestamp
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(grievance.createdAt).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    24h SLA Deadline
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {new Date(grievance.dueAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Work Progress Card (If forwarded to Technical) */}
          {grievance.isTechnical && (
            <div className="p-5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-orange-900 dark:text-orange-200 text-sm">
                  <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400">
                    🔧
                  </span>
                  <span>Technical Issue Resolution Workflow</span>
                </div>
                <StatusBadge status={grievance.status} />
              </div>

              {/* Technical Work Progress Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {grievance.assignedWorker && (
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[10px]">
                      Assigned Technical Staff
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {(grievance.assignedWorker as any).name}
                    </span>
                    {(grievance.assignedWorker as any).designation && (
                      <span className="text-slate-500 block text-[11px]">
                        {(grievance.assignedWorker as any).designation}
                      </span>
                    )}
                  </div>
                )}
                {grievance.technicalDepartment && (
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[10px]">
                      Technical Department
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {(grievance.technicalDepartment as any).name}
                    </span>
                  </div>
                )}
                {grievance.workStartedAt && (
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[10px]">
                      Work Started
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {new Date(grievance.workStartedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Latest Technical Progress Update */}
              {grievance.technicalProgressLog && grievance.technicalProgressLog.length > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-orange-100 dark:border-orange-900/40 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">
                    Latest Technical Update:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {grievance.technicalProgressLog[grievance.technicalProgressLog.length - 1].note}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(
                      grievance.technicalProgressLog[grievance.technicalProgressLog.length - 1].updatedAt
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Technical Work Report (when completed) */}
              {grievance.technicalWorkReport && grievance.technicalWorkReport.workPerformed && (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-orange-900 dark:text-orange-300">
                    Technical Resolution Report
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Problem</span>
                      <p className="text-slate-800 dark:text-slate-200">{grievance.technicalWorkReport.problem}</p>
                    </div>
                    {grievance.technicalWorkReport.rootCause && (
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Root Cause</span>
                        <p className="text-slate-800 dark:text-slate-200">{grievance.technicalWorkReport.rootCause}</p>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Work Performed</span>
                      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{grievance.technicalWorkReport.workPerformed}</p>
                    </div>
                    {grievance.technicalWorkReport.equipmentUsed && (
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Equipment / Resources Used</span>
                        <p className="text-slate-800 dark:text-slate-200">{grievance.technicalWorkReport.equipmentUsed}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Resolution</span>
                      <p className="text-slate-800 dark:text-slate-200">{grievance.technicalWorkReport.resolution}</p>
                    </div>
                  </div>

                  {grievance.technicalWorkReport.evidence && grievance.technicalWorkReport.evidence.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Technical Evidence Attachments
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {grievance.technicalWorkReport.evidence.map((file, i) => (
                          <a
                            key={i}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-xs text-orange-700 dark:text-orange-300 font-medium hover:underline"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            {file.filename}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Student Confirmation Action Banner for FACULTY_VERIFIED */}
              {grievance.status === 'FACULTY_VERIFIED' && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 block">
                      Faculty has verified the technical resolution!
                    </span>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Please confirm if your technical issue is completely resolved.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => setReopenModalOpen(true)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Issue Persists
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      className="text-xs font-bold"
                      onClick={async () => {
                        try {
                          await api.post(`/technical/${id}/confirm-resolution`);
                          refetch();
                        } catch (err: any) {
                          alert(err.response?.data?.message || 'Failed to confirm resolution.');
                        }
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Confirm & Close Issue
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resolution Card if RESOLVED or CLOSED */}
          {['RESOLVED', 'CLOSED'].includes(grievance.status) && (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Resolution Documented by Assigned Officer</span>
                </div>
                {grievance.status === 'RESOLVED' && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900">
                    Pending Student Confirmation
                  </span>
                )}
              </div>

              <div className="text-xs space-y-1">
                <span className="font-semibold text-emerald-950 dark:text-emerald-200">
                  Action Taken:
                </span>
                <p className="text-emerald-800 dark:text-emerald-300 font-medium">
                  {grievance.resolution?.actionTaken || 'The issue has been inspected and rectified.'}
                </p>
                {grievance.resolution?.notes && (
                  <p className="text-emerald-700 dark:text-emerald-400 italic">
                    Notes: {grievance.resolution.notes}
                  </p>
                )}
              </div>

              {/* Student Confirmation Banner */}
              {grievance.status === 'RESOLVED' && (
                <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Was your grievance resolved satisfactorily?
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                      onClick={() => setReopenModalOpen(true)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      No, Request Reopening
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      className="text-xs font-bold"
                      onClick={handleConfirmClose}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Yes, Confirm & Close Ticket
                    </Button>
                  </div>
                </div>
              )}

              {/* Delete button for CLOSED grievances */}
              {grievance.status === 'CLOSED' && (
                <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    This complaint is closed. You may permanently delete this record.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40"
                    onClick={async () => {
                      if (confirm(`Permanently delete closed grievance ${grievance.trackingId}?`)) {
                        try {
                          await api.delete(`/grievances/${grievance._id}`);
                          navigate('/student/grievances');
                        } catch (err: any) {
                          alert(err.response?.data?.message || 'Failed to delete grievance.');
                        }
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete Ticket
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Student Feedback Display */}
          {existingFeedback && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  Your Resolution Feedback
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < existingFeedback.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="font-bold text-slate-700 dark:text-slate-300 ml-1">
                    {existingFeedback.rating}/5
                  </span>
                </div>
              </div>
              {existingFeedback.comment && (
                <p className="text-slate-600 dark:text-slate-400 italic">
                  "{existingFeedback.comment}"
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discussion Timeline Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base">Discussion Timeline</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Direct communication thread between you and the assigned institutional officers.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No discussion messages exchanged yet.
              </div>
            ) : (
              messages.map((msg) => {
                const isStudent = msg.senderRole === 'student';
                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
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
                        isStudent
                          ? 'bg-blue-600 text-white rounded-br-sm'
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

          {/* Send Message Form */}
          {grievance.status !== 'CLOSED' && (
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Type your message to the assigned faculty officer..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Button type="submit" size="sm" isLoading={isSendingMessage} className="px-4 font-bold">
                <Send className="w-3.5 h-3.5 mr-1" />
                Reply
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Reopen Request Modal */}
      <Modal
        isOpen={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        title="Request Grievance Reopening"
        description="Please explain why the documented resolution was not effective or what remains unfixed."
      >
        <form onSubmit={handleReopenSubmit} className="space-y-4">
          <Textarea
            label="Reason for Reopening"
            required
            rows={4}
            placeholder="e.g. WiFi connects for 2 minutes then drops again; speed is below 1 Mbps..."
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReopenModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isReopening}
              className="font-bold"
            >
              Submit Reopen Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Feedback Rating Modal */}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title="Resolution Feedback & Rating"
        description="Help us measure faculty responsiveness and resolution quality."
      >
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {rating === 5
                ? 'Outstanding Resolution'
                : rating === 4
                ? 'Good'
                : rating === 3
                ? 'Average'
                : rating === 2
                ? 'Below Expectations'
                : 'Unsatisfactory'}
            </span>
          </div>

          <Textarea
            label="Additional Comments (Optional)"
            rows={3}
            placeholder="Share feedback on resolution speed, teacher communication..."
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFeedbackModalOpen(false)}
            >
              Skip
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmittingFeedback}
              className="font-bold"
            >
              Submit Rating
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
