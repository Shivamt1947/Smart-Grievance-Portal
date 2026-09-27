import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { Clock, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface SLACountdownProps {
  dueAt: string;
  status: string;
  className?: string;
  compact?: boolean;
}

export const SLACountdown: React.FC<SLACountdownProps> = ({
  dueAt,
  status,
  className,
  compact = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isOverdue: false });

  const isResolvedOrClosed = ['RESOLVED', 'CLOSED'].includes(status.toUpperCase());
  const isEscalated = status.toUpperCase() === 'ESCALATED';

  useEffect(() => {
    if (isResolvedOrClosed) return;

    const calculateTime = () => {
      const target = new Date(dueAt).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        const absDiff = Math.abs(diff);
        const hours = Math.floor(absDiff / (1000 * 60 * 60));
        const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isOverdue: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isOverdue: false });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [dueAt, isResolvedOrClosed]);

  if (isResolvedOrClosed) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
          className
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>SLA Fulfilled</span>
      </div>
    );
  }

  if (isEscalated) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-300 dark:border-rose-800 shadow-sm animate-pulse-subtle',
          className
        )}
      >
        <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        <span>24h SLA Escalated to Administration</span>
      </div>
    );
  }

  // Determine SLA Tier:
  // On Track (> 12 hours remaining)
  // Approaching Deadline (0 to 12 hours remaining)
  // Overdue (< 0)
  const totalHours = timeLeft.hours;
  const isApproaching = !timeLeft.isOverdue && totalHours <= 12;
  const isOverdue = timeLeft.isOverdue;

  let tierStyles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
  let tierLabel = 'On Track';
  let icon = <Clock className="w-3.5 h-3.5 text-blue-500" />;

  if (isApproaching) {
    tierStyles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    tierLabel = 'Approaching SLA Deadline';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-bounce" />;
  } else if (isOverdue) {
    tierStyles = 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800';
    tierLabel = 'Overdue';
    icon = <AlertOctagon className="w-3.5 h-3.5 text-red-500 animate-pulse" />;
  }

  const formattedTime = `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-medium border',
          tierStyles,
          className
        )}
      >
        {icon}
        <span>{isOverdue ? `+${formattedTime} over` : formattedTime}</span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border text-xs shadow-sm font-medium',
        tierStyles,
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold">{tierLabel}</span>
      </div>
      <div className="font-mono text-sm font-bold tracking-tight">
        {isOverdue ? `+${formattedTime} Overdue` : `${formattedTime} remaining`}
      </div>
    </div>
  );
};
