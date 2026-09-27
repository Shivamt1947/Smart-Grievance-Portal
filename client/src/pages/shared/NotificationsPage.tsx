import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { NotificationItem } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
  AlertOctagon,
  FileCheck2,
  MessageSquare,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications-page', page],
    queryFn: async () => {
      const res = await api.get(`/notifications?page=${page}&limit=15`);
      return res.data;
    },
  });

  const notifications: NotificationItem[] = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const pagination = data?.pagination || { total: 0, pages: 1, page: 1 };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
    } catch (err: any) {
      alert('Failed to mark notifications read.');
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
      } catch {}
    }
    navigate(notif.link);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <span>Notifications Center</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time alerts regarding status updates, faculty responses, and SLA escalations.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllRead}
            className="text-xs font-semibold gap-1.5 shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            <span>Mark All as Read ({unreadCount})</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You are completely up to date. You will receive notifications when officers act on your complaints."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <Card
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              className={`cursor-pointer transition-all hover:border-blue-400 hover:shadow-md p-4 ${
                !notif.isRead
                  ? 'bg-blue-50/40 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/60'
                  : 'bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {notif.title}
                    </span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>

                <ExternalLink className="w-4 h-4 text-slate-400 hover:text-blue-600 shrink-0 mt-1" />
              </div>
            </Card>
          ))}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
