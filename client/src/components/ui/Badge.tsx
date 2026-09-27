import React from 'react';
import { cn } from '@/utils/cn';
import type { GrievanceStatus, Priority } from '@/types';
import { AlertTriangle, Clock, CheckCircle2, AlertOctagon, RotateCcw } from 'lucide-react';

interface StatusBadgeProps {
  status: GrievanceStatus | string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, showIcon = true }) => {
  const normalized = status.toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  let icon = <Clock className="w-3.5 h-3.5" />;

  switch (normalized) {
    case 'PENDING':
      styles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800';
      icon = <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />;
      break;
    case 'ASSIGNED':
      styles = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800';
      icon = <Clock className="w-3.5 h-3.5 text-indigo-500" />;
      break;
    case 'IN_PROGRESS':
      styles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800';
      icon = <Clock className="w-3.5 h-3.5 text-blue-500" />;
      break;
    case 'RESOLVED':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800';
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      break;
    case 'CLOSED':
      styles = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700';
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />;
      break;
    case 'ESCALATED':
      styles = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800 font-semibold ring-1 ring-rose-400/40';
      icon = <AlertOctagon className="w-3.5 h-3.5 text-rose-500 animate-pulse" />;
      break;
    case 'REOPENED':
      styles = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800';
      icon = <RotateCcw className="w-3.5 h-3.5 text-purple-500" />;
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        styles,
        className
      )}
    >
      {showIcon && icon}
      <span>{normalized.replace('_', ' ')}</span>
    </span>
  );
};

interface PriorityBadgeProps {
  priority: Priority | string;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
  const normalized = priority.toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  let dotColor = 'bg-slate-400';

  switch (normalized) {
    case 'LOW':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
      dotColor = 'bg-emerald-500';
      break;
    case 'MEDIUM':
      styles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
      dotColor = 'bg-blue-500';
      break;
    case 'HIGH':
      styles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
      dotColor = 'bg-amber-500';
      break;
    case 'URGENT':
      styles = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800 font-bold';
      dotColor = 'bg-red-500 animate-ping';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        styles,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
      <span>{normalized}</span>
    </span>
  );
};
