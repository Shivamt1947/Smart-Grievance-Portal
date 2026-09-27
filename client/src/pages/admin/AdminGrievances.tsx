import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Grievance, User } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { SLACountdown } from '@/components/ui/SLACountdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import {
  Search,
  UserPlus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Building,
  UserCheck,
  AlertOctagon,
  Calendar,
  Layers,
  Trash2,
} from 'lucide-react';

export const AdminGrievances: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [category, setCategory] = useState(searchParams.get('category') || 'ALL');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'ALL');
  const [page, setPage] = useState(1);

  // Assign Faculty Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch Grievances
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-grievances-list', { page, status, category, priority, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (status !== 'ALL') params.set('status', status);
      if (category !== 'ALL') params.set('category', category);
      if (priority !== 'ALL') params.set('priority', priority);
      if (search.trim()) params.set('search', search.trim());

      const res = await api.get(`/grievances?${params.toString()}`);
      return res.data;
    },
  });

  // Fetch Faculty Officers list for assignment dropdown
  const { data: teachersData } = useQuery({
    queryKey: ['available-teachers'],
    queryFn: async () => {
      const res = await api.get('/users/teachers');
      return res.data.teachers as User[];
    },
  });

  const teachers = teachersData || [];
  const grievances: Grievance[] = data?.grievances || [];
  const pagination = data?.pagination || { total: 0, pages: 1, page: 1 };

  const handleOpenAssignModal = (e: React.MouseEvent, g: Grievance) => {
    e.stopPropagation();
    setSelectedGrievance(g);
    setSelectedTeacherId(g.assignedTeacher?._id || (teachers[0]?._id || ''));
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievance || !selectedTeacherId) return;

    setIsAssigning(true);
    try {
      await api.patch(`/grievances/${selectedGrievance._id}/assign`, {
        teacherId: selectedTeacherId,
      });
      setAssignModalOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign faculty officer.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Campus Grievance Master Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Administrative oversight of all university complaints, SLA escalations, and faculty assignments.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name, ID, tracking ID, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setPage(1);
                refetch();
              }}
            >
              Filter Records
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
              <option value="PENDING">Pending Assignment</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="ESCALATED">Escalated (24h Breached)</option>
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
        </CardContent>
      </Card>

      {/* Directory List */}
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
          title="No grievances match administrative filters"
          description="Clear search or reset filters to display all complaints."
          actionText="Reset Filters"
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
              onClick={() => navigate(`/admin/grievances/${g._id}`)}
              className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Student: {g.student?.name} ({g.student?.institutionalId})
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {g.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(g.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      Officer: {g.assignedTeacher ? g.assignedTeacher.name : 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-start lg:items-end gap-2">
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
                              queryClient.invalidateQueries({ queryKey: ['admin-grievances-list'] });
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleOpenAssignModal(e, g)}
                      className="text-xs font-semibold"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1 text-blue-600" />
                      {g.assignedTeacher ? 'Reassign Faculty' : 'Assign Faculty'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/student/grievances/${g._id}`)}
                      className="text-xs"
                    >
                      View Timeline →
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
                Page {pagination.page} of {pagination.pages} ({pagination.total} total records)
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

      {/* Assign Faculty Officer Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Faculty Resolution Officer"
        description={`Assign departmental faculty to take ownership of ticket ${selectedGrievance?.trackingId}.`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">
              {selectedGrievance?.title}
            </div>
            <div className="text-slate-500">
              Category: {selectedGrievance?.category} • Location: {selectedGrievance?.location}
            </div>
          </div>

          <Select
            label="Select Active Faculty Officer"
            required
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
          >
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.department} - {t.institutionalId})
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isAssigning}
              className="font-bold"
            >
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
