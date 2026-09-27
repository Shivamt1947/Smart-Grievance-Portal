import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  User,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/users/change-password', {
        oldPassword,
        newPassword,
      });
      setPasswordSuccess('Password successfully changed.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          <span>Institutional Profile</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your verified credentials and security configuration.
        </p>
      </div>

      {/* Profile Details Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Identity Record</CardTitle>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Account
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px]">
                Full Name
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {user?.name}
              </p>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px]">
                Institutional ID
              </span>
              <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {user?.institutionalId}
              </p>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px]">
                Campus Email
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {user?.email}
              </p>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px]">
                Assigned Role
              </span>
              <p className="text-sm font-bold uppercase text-purple-600 dark:text-purple-400 mt-0.5">
                {user?.role}
              </p>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px]">
                Department
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {user?.department}
              </p>
            </div>

            {user?.role === 'student' && user.year && (
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px]">
                  Academic Year / Div
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  Year {user.year} • Division {user.division || 'A'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>Update Password</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Manage your credentials to ensure your account security.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <Input
              label="Current Password"
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />

            <Input
              label="New Password"
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Input
              label="Confirm New Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" isLoading={isChangingPassword} className="font-bold">
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
