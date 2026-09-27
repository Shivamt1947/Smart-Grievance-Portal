import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { AuditLogItem } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [role, setRole] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-audit-logs', { page, role, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (role !== 'ALL') params.set('role', role);
      if (search.trim()) params.set('search', search.trim());

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      return res.data;
    },
  });

  const logs: AuditLogItem[] = data?.logs || [];
  const pagination = data?.pagination || { total: 0, pages: 1, page: 1 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Institutional Compliance & Audit Trail
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Immutable event log of all grievance lifecycle state transitions, assignments, SLA automated sweeps, and user activities.
        </p>
      </div>

      {/* Filter and Search */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit details or keywords..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <Select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48"
          >
            <option value="ALL">All Event Roles</option>
            <option value="system">System (Automated SLA Sweeps)</option>
            <option value="student">Student Actions</option>
            <option value="teacher">Faculty Actions</option>
            <option value="admin">Administrator Actions</option>
          </Select>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Tracking ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading audit records...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-red-500">
                      Failed to load audit logs.
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No audit events recorded under this filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.role === 'system'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : log.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : log.role === 'teacher'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {log.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300">
                        {log.user ? log.user.name : 'System Scheduler'}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 max-w-md truncate">
                        {log.details}
                      </td>
                      <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {log.grievance ? log.grievance.trackingId : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.pages} ({pagination.total} events)
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
        </CardContent>
      </Card>
    </div>
  );
};
