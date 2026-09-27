import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { CommonIssueData, Grievance } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import {
  Layers,
  Plus,
  Users,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderSync,
} from 'lucide-react';

export const AdminCommonIssues: React.FC = () => {
  const queryClient = useQueryClient();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('IT / Network');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Common Issues
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['common-issues-list'],
    queryFn: async () => {
      const res = await api.get('/common-issues');
      return res.data.commonIssues as CommonIssueData[];
    },
  });

  const issues = data || [];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category || !location.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post('/common-issues', {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
      });
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setLocation('');
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to declare common campus issue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.patch(`/common-issues/${id}/status`, { status });
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Campus Common Issues & Incident Clustering
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cluster recurring grievances across multiple students into unified institutional outages and campus incidents.
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="font-bold shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Declare Common Issue
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : issues.length === 0 ? (
        <EmptyState
          title="No active common campus issues declared"
          description="Common issues group multiple student complaints reporting the same underlying outage (e.g. WiFi outage in Lab 3)."
          actionText="Declare First Common Issue"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {issues.map((issue) => (
            <Card key={issue._id} className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                      {issue.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        issue.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {issue.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold shrink-0">
                  <Users className="w-4 h-4" />
                  <span>{issue.affectedStudentCount} affected</span>
                </div>
              </div>

              {issue.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {issue.description}
                </p>
              )}

              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Building className="w-3.5 h-3.5" />
                <span>{issue.location}</span>
              </div>

              {/* Linked Grievances Preview */}
              {issue.grievances && issue.grievances.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <span className="font-semibold text-slate-400 text-[10px] uppercase">
                    Clustered Grievance Tickets ({issue.grievances.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {issue.grievances.map((g) => (
                      <span
                        key={g._id}
                        className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        {g.trackingId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Created {new Date(issue.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  {issue.status !== 'RESOLVED' && (
                    <Button
                      size="sm"
                      variant="success"
                      className="text-xs"
                      onClick={() => handleStatusUpdate(issue._id, 'RESOLVED')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Mark Resolved
                    </Button>
                  )}
                  {issue.status === 'INVESTIGATING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleStatusUpdate(issue._id, 'IN_PROGRESS')}
                    >
                      Set In Progress
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Declare Common Issue Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Declare Campus Common Issue"
        description="Establish an overarching incident report for wide-spread campus disruptions."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Common Issue Title"
            required
            placeholder="e.g. Central Library Air Conditioning Failure"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="Incident Description"
            rows={3}
            placeholder="Provide context on scope of disruption..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="IT / Network">IT / Network</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Academic">Academic</option>
              <option value="Examination">Examination</option>
              <option value="Library">Library</option>
              <option value="Hostel">Hostel</option>
              <option value="Transport">Transport</option>
              <option value="Other">Other</option>
            </Select>

            <Input
              label="Affected Campus Location"
              required
              placeholder="e.g. Central Library Ground & 1st Floor"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              className="font-bold"
            >
              Declare Incident
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
