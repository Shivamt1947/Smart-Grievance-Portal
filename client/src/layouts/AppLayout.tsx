import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/services/api';
import type { NotificationItem } from '@/types';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard,
  FilePlus2,
  ListOrdered,
  Bell,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ShieldAlert,
  GraduationCap,
  Users,
  Layers,
  LineChart,
  History,
  FolderTree,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Wrench,
  BookOpen,
  Cpu,
  ClipboardList,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [facultyOpen, setFacultyOpen] = useState(true);
  const [technicalOpen, setTechnicalOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotifDropdownOpen(false);
  }, [location.pathname]);

  // Auto-expand Faculty/Technical sections based on current path
  useEffect(() => {
    if (location.pathname.startsWith('/teacher')) {
      setFacultyOpen(true);
    }
    if (location.pathname.startsWith('/teacher/technical')) {
      setTechnicalOpen(true);
    }
  }, [location.pathname]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      if (res.data.success) {
        setUnreadCount(res.data.unreadCount || 0);
        setRecentNotifications(res.data.notifications || []);
      }
    } catch {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // Poll every 20s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Nav Links configuration based on user role
  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === 'student') {
      return [
        { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
        { label: 'My Grievances', path: '/student/grievances', icon: ListOrdered },
        { label: 'Submit Grievance', path: '/student/grievances/new', icon: FilePlus2 },
        { label: 'Notifications', path: '/student/notifications', icon: Bell, badge: unreadCount },
        { label: 'Profile', path: '/student/profile', icon: UserIcon },
      ];
    }

    if (user.role === 'worker') {
      return [
        { label: 'Technical Dashboard', path: '/teacher/technical', icon: LayoutDashboard },
        { label: 'My Tasks', path: '/teacher/technical/grievances', icon: ClipboardList },
        { label: 'Notifications', path: '/teacher/notifications', icon: Bell, badge: unreadCount },
        { label: 'Profile', path: '/teacher/profile', icon: UserIcon },
      ];
    }

    if (user.role === 'admin') {
      return [
        { label: 'Executive Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'All Grievances', path: '/admin/grievances', icon: ListOrdered },
        { label: 'Common Issues', path: '/admin/common-issues', icon: Layers },
        { label: 'Roster & Users', path: '/admin/users', icon: Users },
        { label: 'Analytics & Trends', path: '/admin/analytics', icon: LineChart },
        { label: 'Categories & SLA', path: '/admin/categories', icon: FolderTree },
        { label: 'Audit Trail', path: '/admin/audit-logs', icon: History },
        { label: 'Notifications', path: '/admin/notifications', icon: Bell, badge: unreadCount },
      ];
    }

    return [];
  };

  // Faculty sub-nav for teacher role
  const teacherSubLinks = [
    { label: 'Teacher Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Assigned Cases', path: '/teacher/grievances', icon: ListOrdered },
  ];
  const technicalSubLinks = [
    { label: 'Technical Dashboard', path: '/teacher/technical', icon: Cpu },
    { label: 'Technical Grievances', path: '/teacher/technical/grievances', icon: ClipboardList },
  ];

  const navLinks = getNavLinks();

  const roleBadgeStyles: Record<string, string> = {
    student: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300',
    teacher: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300',
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300',
    worker: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => {
                const homePath =
                  user?.role === 'admin'
                    ? '/admin/dashboard'
                    : user?.role === 'teacher'
                    ? '/teacher/dashboard'
                    : user?.role === 'worker'
                    ? '/teacher/technical'
                    : '/student/dashboard';
                navigate(homePath);
              }}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  Smart Grievance
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-bold">
                    PORTAL
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  University Resolution System
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions, Notifications, User info, Theme */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Badge */}
            {user && (
              <span
                className={cn(
                  'hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border tracking-wider',
                  roleBadgeStyles[user.role]
                )}
              >
                {user.role}
              </span>
            )}

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white p-3 shadow-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Notifications ({unreadCount} new)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                    {recentNotifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      recentNotifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => {
                            setNotifDropdownOpen(false);
                            navigate(notif.link);
                          }}
                          className={cn(
                            'p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors text-left',
                            !notif.isRead && 'bg-blue-50/50 dark:bg-blue-950/20'
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h5 className="text-xs font-semibold text-slate-900 dark:text-white">
                              {notif.title}
                            </h5>
                            {!notif.isRead && (
                              <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {notif.message}
                          </p>
                          <span className="mt-1 block text-[10px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      onClick={() => {
                        setNotifDropdownOpen(false);
                        const notifPath = `/${user?.role}/notifications`;
                        navigate(notifPath);
                      }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View all notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile snippet & Logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {user.institutionalId}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                  title="Sign Out"
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body: Desktop Sidebar + Content */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/80 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 p-4 shrink-0">
          <div className="mb-4 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
            <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Department
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
              {user?.department}
            </div>
            {user?.role === 'student' && user.year && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Year {user.year} • Div {user.division || 'A'}
              </div>
            )}
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto">
            {user?.role === 'teacher' ? (
              <>
                {/* Faculty Parent */}
                <button
                  onClick={() => setFacultyOpen(!facultyOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Wrench className="w-4 h-4 shrink-0 text-indigo-500" />
                    <span>Faculty</span>
                  </div>
                  {facultyOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {facultyOpen && (
                  <div className="pl-4 space-y-1">
                    {/* Teacher Sub-section */}
                    <div className="px-2 pt-1 pb-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Teacher</span>
                    </div>
                    {teacherSubLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={true}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                              isActive
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                            )
                          }
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}

                    {/* Technical Sub-section */}
                    <div className="pt-2">
                      <button
                        onClick={() => setTechnicalOpen(!technicalOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Cpu className="w-4 h-4 shrink-0 text-orange-500" />
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Technical</span>
                        </div>
                        {technicalOpen ? (
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                      {technicalOpen && (
                        <div className="pl-2 mt-1 space-y-1">
                          {technicalSubLinks.map((item) => {
                            const Icon = item.icon;
                            return (
                              <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/teacher/technical'}
                                className={({ isActive }) =>
                                  cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                                    isActive
                                      ? 'bg-orange-500 text-white shadow-sm'
                                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                                  )
                                }
                              >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span>{item.label}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notifications & Profile always visible */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 mt-2">
                  <NavLink
                    to="/teacher/notifications"
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 shrink-0" />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </NavLink>
                  <NavLink
                    to="/teacher/profile"
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                      )
                    }
                  >
                    <UserIcon className="w-4 h-4 shrink-0" />
                    <span>Profile</span>
                  </NavLink>
                </div>
              </>
            ) : (
              navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/30 dark:bg-blue-600'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })
            )}
          </nav>

          {/* Quick Support / SLA Guarantee Card */}
          <div className="mt-auto p-3.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100 dark:border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>24h SLA Protected</span>
            </div>
            <p className="mt-1 text-[11px] text-blue-700/80 dark:text-slate-400 leading-relaxed">
              Every complaint is monitored under strict 24-hour resolution deadlines with auto-escalation.
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-72 flex-col bg-white p-5 shadow-2xl dark:bg-slate-900 z-10">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Smart Grievance
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {user?.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {user?.institutionalId} • {user?.department}
                </div>
              </div>

              <nav className="mt-4 space-y-1 flex-1 overflow-y-auto">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="mt-auto flex items-center gap-2 p-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
