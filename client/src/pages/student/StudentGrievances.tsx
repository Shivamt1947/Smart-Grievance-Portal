import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Grievance } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { SLACountdown } from '@/components/ui/SLACountdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/EmptyState';
import {
  FilePlus2,
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Building,
  Calendar,
  Trash2,
} from 'lucide-react';

export const StudentGrievances: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [category, setCategory] = useState(searchParams.get('category') || 'ALL');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'ALL');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const limit = 10;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-grievances', { page, status, category, priority, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (status !== 'ALL') params.set('status', status);
      if (category !== 'ALL') params.set('category', category);
      if (priority !== 'ALL') params.set('priority', priority);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Grievance Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track active tickets, resolutions, and authoritative 24-hour SLA countdowns.
          </p>
        </div>
        <Button
          onClick={() => navigate('/student/grievances/new')}
          className="font-bold shrink-0"
        >
          <FilePlus2 className="w-4 h-4 mr-1.5" />
          Submit Grievance
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by tracking ID, title, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <Button type="submit" variant="secondary" size="md">
                Search
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="ESCALATED">Escalated (24h)</option>
                <option value="REOPENED">Reopened</option>
              </Select>

              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All Categories</option>
                <option value="Academic">Academic</option>
                <option value="Examination">Examination</option>
                <option value="IT / Network">IT / Network</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Library">Library</option>
                <option value="Hostel">Hostel</option>
                <option value="Fees">Fees</option>
                <option value="Faculty">Faculty</option>
                <option value="Administration">Administration</option>
                <option value="Transport">Transport</option>
                <option value="Other">Other</option>
              </Select>

              <Select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
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
          title="No grievances match your criteria"
          description="Try changing the filter options or clear the search query."
          actionText="Clear Filters"
          onAction={() => {
            setStatus('ALL');
            setCategory('ALL');
            setPriority('ALL');
            setSearch('');
            setPage(1);
          }}
        />
      ) : (
        <div className="space-y-3">
          {grievances.map((g) => (
            <Card
              key={g._id}
              onClick={() => navigate(`/student/grievances/${g._id}`)}
              className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
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
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {g.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(g.createdAt).toLocaleDateString()}
                    </span>
                    {g.assignedTeacher && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        Assigned: {g.assignedTeacher.name}
                      </span>
                    )}
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
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      <span>View Details</span>
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
