import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Student Pages
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { StudentGrievances } from '@/pages/student/StudentGrievances';
import { NewGrievance } from '@/pages/student/NewGrievance';
import { GrievanceDetails } from '@/pages/student/GrievanceDetails';

// Teacher Pages
import { TeacherDashboard } from '@/pages/teacher/TeacherDashboard';
import { TeacherGrievances } from '@/pages/teacher/TeacherGrievances';
import { TeacherGrievanceDetails } from '@/pages/teacher/TeacherGrievanceDetails';
import { TechnicalDashboard } from '@/pages/teacher/TechnicalDashboard';
import { TechnicalGrievances } from '@/pages/teacher/TechnicalGrievances';

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminGrievances } from '@/pages/admin/AdminGrievances';
import { AdminCommonIssues } from '@/pages/admin/AdminCommonIssues';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics';
import { AdminAuditLogs } from '@/pages/admin/AdminAuditLogs';

// Shared Pages
import { NotificationsPage } from '@/pages/shared/NotificationsPage';
import { ProfilePage } from '@/pages/shared/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
});

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Initializing Institutional Portal Session...
        </p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (user.role === 'worker') return <Navigate to="/teacher/technical" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Root Route */}
            <Route path="/" element={<RootRedirect />} />

            {/* Student Protected Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="grievances" element={<StudentGrievances />} />
              <Route path="grievances/new" element={<NewGrievance />} />
              <Route path="grievances/:id" element={<GrievanceDetails />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Teacher Protected Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'worker']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="grievances" element={<TeacherGrievances />} />
              <Route path="grievances/:id" element={<TeacherGrievanceDetails />} />
              <Route path="technical" element={<TechnicalDashboard />} />
              <Route path="technical/grievances" element={<TechnicalGrievances />} />
              <Route path="technical/grievances/:id" element={<TeacherGrievanceDetails />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="grievances" element={<AdminGrievances />} />
              <Route path="grievances/:id" element={<TeacherGrievanceDetails />} />
              <Route path="common-issues" element={<AdminCommonIssues />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="students" element={<Navigate to="/admin/users" replace />} />
              <Route path="teachers" element={<Navigate to="/admin/users" replace />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<AdminCategories />} />
            </Route>

            {/* Fallback 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
