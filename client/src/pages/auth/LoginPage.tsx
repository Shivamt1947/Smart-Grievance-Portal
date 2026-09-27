import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { GraduationCap, ShieldCheck, UserCheck, KeyRound, Sparkles, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login({ email, password });
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
        else if (user.role === 'teacher') navigate('/teacher/dashboard', { replace: true });
        else navigate('/student/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (role: 'student' | 'teacher' | 'admin') => {
    if (role === 'student') {
      setEmail('aarav.sharma@student.university.edu');
      setPassword('Password123!');
    } else if (role === 'teacher') {
      setEmail('rajesh.verma@faculty.university.edu');
      setPassword('Password123!');
    } else {
      setEmail('admin@university.edu');
      setPassword('Password123!');
    }
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md">
        {/* University Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 mb-3">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Smart Grievance Portal
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Institutional Redressal & Resolution Platform
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-slate-200/80 dark:border-slate-800">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Institutional Sign In</CardTitle>
            <CardDescription>
              Enter your verified university credentials to access your portal.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="Institutional Email"
                type="email"
                required
                placeholder="id@student.university.edu or @faculty"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold mt-2"
                isLoading={isLoading}
              >
                Sign In to Portal
              </Button>
            </CardContent>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="px-6 pb-4">
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-white dark:bg-slate-900 px-2">
                One-Click Role Demonstration
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('student')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 dark:border-slate-800 dark:bg-emerald-950/20 dark:text-emerald-300 dark:hover:bg-emerald-950/40 transition-colors text-[11px] font-medium"
              >
                <UserCheck className="w-4 h-4 mb-1 text-emerald-600" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('teacher')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-800 dark:border-slate-800 dark:bg-indigo-950/20 dark:text-indigo-300 dark:hover:bg-indigo-950/40 transition-colors text-[11px] font-medium"
              >
                <KeyRound className="w-4 h-4 mb-1 text-indigo-600" />
                <span>Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('admin')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50 text-purple-800 dark:border-slate-800 dark:bg-purple-950/20 dark:text-purple-300 dark:hover:bg-purple-950/40 transition-colors text-[11px] font-medium"
              >
                <ShieldCheck className="w-4 h-4 mb-1 text-purple-600" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <CardFooter className="justify-center border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              New student or faculty member?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Register with Institutional ID
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
