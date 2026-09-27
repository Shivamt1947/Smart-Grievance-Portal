import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { User } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Power,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'registered' | 'students' | 'teachers'>('registered');
  const [search, setSearch] = useState('');
  const [addRecordModalOpen, setAddRecordModalOpen] = useState(false);

  // Form for adding approved record
  const [newType, setNewType] = useState<'student' | 'teacher'>('student');
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Computer Science');
  const [newYear, setNewYear] = useState('1');
  const [newDiv, setNewDiv] = useState('A');
  const [isAdding, setIsAdding] = useState(false);

  // 1. Fetch Registered Users
  const { data: usersData, isLoading: isUsersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users-list', search],
    queryFn: async () => {
      const res = await api.get(`/admin/users?search=${encodeURIComponent(search)}`);
      return res.data.users as User[];
    },
    enabled: activeTab === 'registered',
  });

  // 2. Fetch Approved Students Roster
  const { data: studentsData, isLoading: isStudentsLoading, refetch: refetchStudents } = useQuery({
    queryKey: ['admin-approved-students', search],
    queryFn: async () => {
      const res = await api.get(`/admin/approved-records?type=students&search=${encodeURIComponent(search)}`);
      return res.data.records as any[];
    },
    enabled: activeTab === 'students',
  });

  // 3. Fetch Approved Faculty Roster
  const { data: teachersData, isLoading: isTeachersLoading, refetch: refetchTeachers } = useQuery({
    queryKey: ['admin-approved-teachers', search],
    queryFn: async () => {
      const res = await api.get(`/admin/approved-records?type=teachers&search=${encodeURIComponent(search)}`);
      return res.data.records as any[];
    },
    enabled: activeTab === 'teachers',
  });

  // Toggle user active status
  const handleToggleUser = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`);
      refetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  // Add approved record submit
  const handleAddRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim() || !newEmail.trim() || isAdding) return;

    setIsAdding(true);
    try {
      await api.post('/admin/approved-records', {
        type: newType,
        institutionalId: newId.trim().toUpperCase(),
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        department: newDept,
        year: parseInt(newYear, 10),
        division: newDiv.trim().toUpperCase(),
      });
      setAddRecordModalOpen(false);
      setNewId('');
      setNewName('');
      setNewEmail('');
      if (newType === 'student') refetchStudents();
      else refetchTeachers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add approved identity record.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Identity & Whitelist Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Control registered university user accounts and institutional roster databases.
          </p>
        </div>
        <Button
          onClick={() => setAddRecordModalOpen(true)}
          className="font-bold shrink-0"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Add Whitelist Identity
        </Button>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex rounded-xl p-1 bg-slate-200/80 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('registered')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'registered'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Registered Users
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'students'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Approved Students Roster
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'teachers'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Approved Faculty Database
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Tab 1: Registered Users */}
      {activeTab === 'registered' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Institutional ID</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        Loading registered accounts...
                      </td>
                    </tr>
                  ) : !usersData || usersData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    usersData.map((u) => (
                      <tr key={u.id || (u as any)._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {u.institutionalId}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : u.role === 'teacher'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{u.department}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                            }`}
                          >
                            {u.isActive ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-red-500" /> Deactivated
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {u.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant={u.isActive ? 'danger' : 'success'}
                              onClick={() => handleToggleUser(u.id || (u as any)._id)}
                              className="text-[11px] h-7 px-2.5"
                            >
                              <Power className="w-3 h-3 mr-1" />
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Approved Students Roster */}
      {activeTab === 'students' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Roster Student ID</th>
                    <th className="p-4">Approved Name</th>
                    <th className="p-4">Official Institutional Email</th>
                    <th className="p-4">Department & Year</th>
                    <th className="p-4">Claim Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {isStudentsLoading ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Loading student roster...
                      </td>
                    </tr>
                  ) : !studentsData || studentsData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No approved student records found.
                      </td>
                    </tr>
                  ) : (
                    studentsData.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {s.institutionalId}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{s.name}</td>
                        <td className="p-4 text-slate-500">{s.email}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">
                          {s.department} (Year {s.year} - {s.division})
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.isClaimed
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {s.isClaimed ? 'Registered & Claimed' : 'Unclaimed Whitelist'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Approved Faculty Database */}
      {activeTab === 'teachers' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Staff ID</th>
                    <th className="p-4">Faculty Name</th>
                    <th className="p-4">Institutional Email</th>
                    <th className="p-4">Department & Designation</th>
                    <th className="p-4">Claim Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {isTeachersLoading ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Loading faculty database...
                      </td>
                    </tr>
                  ) : !teachersData || teachersData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No approved faculty records found.
                      </td>
                    </tr>
                  ) : (
                    teachersData.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {t.institutionalId}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{t.name}</td>
                        <td className="p-4 text-slate-500">{t.email}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">
                          {t.department} • {t.designation}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.isClaimed
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {t.isClaimed ? 'Registered & Claimed' : 'Unclaimed Faculty ID'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Whitelist Identity Modal */}
      <Modal
        isOpen={addRecordModalOpen}
        onClose={() => setAddRecordModalOpen(false)}
        title="Add Institutional Identity to Whitelist"
        description="Pre-approve a student or faculty member so they can safely self-register on the portal."
      >
        <form onSubmit={handleAddRecordSubmit} className="space-y-4">
          <Select
            label="Role to Approve"
            value={newType}
            onChange={(e: any) => setNewType(e.target.value)}
          >
            <option value="student">Student (University Student ID)</option>
            <option value="teacher">Faculty / Staff Member</option>
          </Select>

          <Input
            label={newType === 'student' ? 'University Student ID' : 'Staff Employee ID'}
            required
            placeholder={newType === 'student' ? 'e.g. MU0321282942' : 'e.g. FAC1045'}
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
          />

          <Input
            label="Full Official Name"
            required
            placeholder="Official institutional name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <Input
            label="Institutional Email"
            type="email"
            required
            placeholder="Official campus email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />

          <Select
            label="Department"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
          >
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics Engineering">Electronics Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            <option value="IT / Network">IT / Network</option>
            <option value="Administration">Administration</option>
          </Select>

          {newType === 'student' && (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Academic Year"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </Select>

              <Input
                label="Division"
                placeholder="A, B, C"
                value={newDiv}
                onChange={(e) => setNewDiv(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddRecordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isAdding}
              className="font-bold"
            >
              Add to Official Whitelist
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
