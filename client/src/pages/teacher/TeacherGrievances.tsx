import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Grievance } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { SLACountdown } from '@/components/ui/SLACountdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import {
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Building,
  User,
  AlertOctagon,
  Calendar,
  Trash2,
} from 'lucide-react';

export const TeacherGrievances: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'ALL');
  const [isOverdueOnly, setIsOverdueOnly] = useState(searchParams.get('isOverdue') === 'true');
  const [page, setPage] = useState(1);

  const limit = 10;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacher-grievances-list', { page, status, priority, isOverdueOnly, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (status !== 'ALL') params.set('status', status);
      if (priority !== 'ALL') params.set('priority', priority);
      if (isOverdueOnly) params.set('isOverdue', 'true');
      if (search.trim()) params.set('search', search.trim());

      const res = await api.get(`/grievances?${params.toString()}`);
      return res.data;
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const grievances: Grievance[] = data?.grievances || [];
  const pagination = data?.pagination || { total: 0, pages: 1, page: 1 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Assigned Cases Directory
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Faculty resolution queue for your department. Ensure all cases are addressed before the 24-hour SLA deadline.
        </p>
      </div>

      {/* Filter and Search */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name, tracking ID, or keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <Button type="submit" variant="secondary" size="md">
                Search Cases
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-40"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="ESCALATED">Escalated</option>
                  <option value="REOPENED">Reopened</option>
                </Select>

                <Select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    setPage(1);
                  }}
                  className="w-40"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </Select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-rose-700 dark:text-rose-400">
                <input
                  type="checkbox"
                  checked={isOverdueOnly}
                  onChange={(e) => {
                    setIsOverdueOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <span className="flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  Overdue / Escalated Cases Only
                </span>
              </label>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Grievances List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : grievances.length === 0 ? (
        <EmptyState
          title="No assigned cases match filters"
          description="Clear search or adjust filters to view your assigned grievances."
          actionText="Reset All Filters"
          onAction={() => {
            setStatus('ALL');
            setPriority('ALL');
            setIsOverdueOnly(false);
            setSearch('');
            setPage(1);
          }}
        />
      ) : (
        <div className="space-y-3">
          {grievances.map((g) => (
            <Card
              key={g._id}
              onClick={() => navigate(`/teacher/grievances/${g._id}`)}
              className="cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {g.trackingId}
                    </span>
                    <StatusBadge status={g.status} />
                    <PriorityBadge priority={g.priority} />
                    <span className="text-xs text-slate-500 font-medium">• {g.category}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {g.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {g.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {g.student?.name} ({g.student?.institutionalId})
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {g.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(g.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
                  <SLACountdown dueAt={g.dueAt} status={g.status} />
                  <div className="flex items-center gap-2">
                    {g.status === 'CLOSED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Permanently delete closed grievance ${g.trackingId}?`)) {
                            try {
                              await api.delete(`/grievances/${g._id}`);
                              refetch();
                            } catch (err: any) {
                              alert(err.response?.data?.message || 'Failed to delete grievance.');
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-1 text-xs font-semibold">
                      <span>Manage Case</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
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
