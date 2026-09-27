import React from 'react';
import { Button } from './Button';
import { AlertCircle, FolderSearch, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no active items to display under this view or filter.',
  icon,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-white/50 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 mb-4">
        {icon || <FolderSearch className="w-7 h-7" />}
      </div>
      <h4 className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h4>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} className="mt-5" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'An error occurred while connecting to the server. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-red-900 dark:text-red-300">
        {title}
      </h4>
      <p className="mt-1 text-sm text-red-700 dark:text-red-400 max-w-md">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-4 gap-2">
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
};
