import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { CategoryData } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PriorityBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { FolderTree, Plus, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const queryClient = useQueryClient();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultPriority, setDefaultPriority] = useState('MEDIUM');
  const [slaHours, setSlaHours] = useState('24');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.categories as CategoryData[];
    },
  });

  const categories = data || [];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post('/categories', {
        name: name.trim(),
        description: description.trim(),
        defaultPriority,
        slaHours: parseInt(slaHours, 10),
      });
      setAddModalOpen(false);
      setName('');
      setDescription('');
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: CategoryData) => {
    try {
      await api.patch(`/categories/${cat._id}`, { isActive: !cat.isActive });
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update category.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Category & SLA Policy Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure institutional complaint categories, default urgency tiers, and authoritative SLA deadlines.
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="font-bold shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat._id} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-base">
                  {cat.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    cat.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {cat.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                {cat.description || 'Standard institutional resolution category.'}
              </p>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    SLA: {cat.slaHours} hours
                  </span>
                </div>
                <PriorityBadge priority={cat.defaultPriority} />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleActive(cat)}
                  className="text-xs"
                >
                  {cat.isActive ? 'Disable Category' : 'Enable Category'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Create Grievance Category"
        description="Add a new categorical division with defined turnaround policies."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Category Name"
            required
            placeholder="e.g. Sports & Recreation"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Textarea
            label="Description"
            rows={3}
            placeholder="Types of student concerns addressed under this category..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Default Priority"
              value={defaultPriority}
              onChange={(e) => setDefaultPriority(e.target.value)}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </Select>

            <Input
              label="SLA Target (Hours)"
              type="number"
              min={12}
              max={168}
              required
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              className="font-bold"
            >
              Create Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
