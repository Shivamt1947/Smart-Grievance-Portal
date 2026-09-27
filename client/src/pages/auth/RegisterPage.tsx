import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { GraduationCap, ShieldAlert, AlertCircle, CheckCircle2, UserCheck, Briefcase } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [institutionalId, setInstitutionalId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('3');
  const [division, setDivision] = useState('A');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fillUnclaimedStudentDemo = () => {
    setRole('student');
    setInstitutionalId('MU0321282941');
    setName('Ananya Iyer');
    setEmail('ananya.iyer@student.university.edu');
    setDepartment('Electronics Engineering');
    setYear('1');
    setDivision('C');
    setPassword('Password123!');
    setConfirmPassword('Password123!');
    setError('');
  };

  const fillUnclaimedTeacherDemo = () => {
    setRole('teacher');
    setInstitutionalId('FAC1044');
    setName('Prof. Vikram Malhotra');
    setEmail('vikram.malhotra@faculty.university.edu');
    setDepartment('Mechanical Engineering');
    setPassword('Password123!');
    setConfirmPassword('Password123!');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        role,
        institutionalId: institutionalId.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        department,
        password,
      };

      if (role === 'student') {
        payload.year = parseInt(year, 10);
        payload.division = division.trim().toUpperCase();
      }

      const user = await register(payload);
      if (user.role === 'teacher') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Institutional verification failed. Check ID and registered email.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-lg my-8">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 mb-3">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Institutional Onboarding
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Approved Student & Faculty Registration
          </p>
        </div>

        <Card className="shadow-xl border-slate-200/80 dark:border-slate-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Claim Your Account</CardTitle>
                <CardDescription>
                  Verified against official university roster databases.
                </CardDescription>
              </div>
              <div className="flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    role === 'student'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    role === 'teacher'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Faculty
                </button>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-3 rounded-lg bg-blue-50/60 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/50 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <span>
                  Only pre-approved university identities are permitted. Public internet signups without institutional records are automatically rejected.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={role === 'student' ? 'University / Student ID' : 'Staff / Employee ID'}
                  placeholder={role === 'student' ? 'e.g. MU0321282941' : 'e.g. FAC1044'}
                  required
                  value={institutionalId}
                  onChange={(e) => setInstitutionalId(e.target.value)}
                />

                <Input
                  label="Full Name"
                  placeholder="Official institutional name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <Input
                label="Institutional Email"
                type="email"
                placeholder={role === 'student' ? 'name@student.university.edu' : 'name@faculty.university.edu'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={role === 'student' ? 'sm:col-span-1' : 'sm:col-span-3'}>
                  <Select
                    label="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics Engineering">Electronics Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="IT / Network">IT / Network</option>
                    <option value="Administration">Administration</option>
                  </Select>
                </div>

                {role === 'student' && (
                  <>
                    <Select
                      label="Academic Year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </Select>

                    <Input
                      label="Division"
                      placeholder="A, B, C"
                      maxLength={3}
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                    />
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Create Password"
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold mt-2"
                isLoading={isLoading}
              >
                Verify & Register Account
              </Button>
            </CardContent>
          </form>

          {/* Quick Demo Pre-Fill */}
          <div className="px-6 pb-4">
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-white dark:bg-slate-900 px-2">
                Test with Whitelisted Roster ID
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillUnclaimedStudentDemo}
                className="p-2 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 text-left"
              >
                <div className="font-semibold text-blue-600 dark:text-blue-400">
                  Unclaimed Student ID
                </div>
                <div>MU0321282941 (Ananya Iyer)</div>
              </button>

              <button
                type="button"
                onClick={fillUnclaimedTeacherDemo}
                className="p-2 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 text-left"
              >
                <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                  Unclaimed Faculty ID
                </div>
                <div>FAC1044 (Prof. Malhotra)</div>
              </button>
            </div>
          </div>

          <CardFooter className="justify-center border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already verified and registered?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
