import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Grievance } from '@/types';
import {
  ClipboardList,
  ArrowRight,
  RefreshCw,
  Cpu,
  Search,
  Filter,
  Trash2,
} from 'lucide-react';

const TECH_STATUSES = [
  { value: 'ALL', label: 'All Technical' },
  { value: 'FORWARDED_TO_TECHNICAL', label: 'Forwarded' },
  { value: 'TECHNICAL_ASSIGNED', label: 'Assigned' },
  { value: 'TECHNICAL_IN_PROGRESS', label: 'In Progress' },
  { value: 'TECHNICAL_COMPLETED', label: 'Completed' },
  { value: 'PENDING_FACULTY_VERIFICATION', label: 'Pending Verification' },
  { value: 'FACULTY_VERIFIED', label: 'Faculty Verified' },
  { value: 'CLOSED', label: 'Closed' },
];

export const TechnicalGrievances: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const isWorker = user?.role === 'worker';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['technical-grievances-list', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await api.get(`/technical?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 30000,
  });

  const allGrievances: Grievance[] = data?.grievances || [];

  const filtered = allGrievances.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      g.trackingId.toLowerCase().includes(q) ||
      g.title.toLowerCase().includes(q) ||
      g.location.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-orange-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isWorker ? 'My Technical Tasks' : 'Technical Grievances'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading
              ? 'Loading...'
              : `${filtered.length} technical grievance${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, title, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            {TECH_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No technical grievances found"
          description={
            statusFilter !== 'ALL'
              ? 'Try changing the status filter.'
              : isWorker
              ? 'No technical tasks assigned to you yet.'
              : 'No technical grievances in this category.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => (
            <Card
              key={g._id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/teacher/technical/grievances/${g._id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Top row: tracking ID + badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {g.trackingId}
                      </span>
                      <StatusBadge status={g.status} />
                      <PriorityBadge priority={g.priority} />
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-semibold uppercase tracking-wider">
                        Technical
                      </span>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {g.title}
                    </p>

                    {/* Meta */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{g.category}</span>
                      <span>•</span>
                      <span>{g.location}</span>
                      <span>•</span>
                      <span>
                        {typeof g.student === 'object' && g.student?.name
                          ? g.student.name
                          : 'Student'}
                      </span>
                      {g.assignedTeacher && typeof g.assignedTeacher === 'object' && (
                        <>
                          <span>•</span>
                          <span>
                            Faculty: {(g.assignedTeacher as { name: string }).name}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Worker assignment info */}
                    {g.assignedWorker && typeof g.assignedWorker === 'object' && (
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-xs text-orange-700 dark:text-orange-300 font-medium">
                        <Cpu className="w-3 h-3" />
                        {(g.assignedWorker as { name?: string; designation?: string }).name}
                        {(g.assignedWorker as { designation?: string }).designation
                          ? ` • ${(g.assignedWorker as { designation: string }).designation}`
                          : ''}
                      </div>
                    )}

                    {/* Dates */}
                    <div className="mt-1.5 text-[11px] text-slate-400">
                      Submitted: {new Date(g.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 mt-1">
                    {g.status === 'CLOSED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40 py-0.5 px-2 h-7"
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
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
