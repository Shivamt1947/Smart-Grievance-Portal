import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
          Verifying institutional authentication session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Route to user's authorized home
    const redirectPath =
      user.role === 'admin'
        ? '/admin/dashboard'
        : user.role === 'teacher'
        ? '/teacher/dashboard'
        : '/student/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
