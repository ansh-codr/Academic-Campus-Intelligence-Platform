import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuthDemo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Badge } from '@/components/ui/Badge';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  CalendarDays,
  FileText,
  Bot,
  BrainCircuit,
  Building,
  PlusCircle,
  Ticket,
  ShieldAlert,
  Users,
  Bell,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const StudentPortalLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigationGroups = [
    {
      title: 'GENERAL',
      items: [
        { label: 'Overview', path: '/portal/overview', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MODULE A: ACADEMIC INTELLIGENCE',
      items: [
        { label: 'Academic Dashboard', path: '/portal/academic', icon: GraduationCap },
        { label: 'My 6 Subjects', path: '/portal/subjects', icon: BookOpen },
        { label: 'Topic Timeline', path: '/portal/timeline', icon: CalendarDays },
        { label: 'Study Resources', path: '/portal/resources', icon: FileText },
        { label: 'StudyMate AI', path: '/portal/studymate', icon: Bot, badge: 'AI' },
        { label: 'Practice & Quizzes', path: '/portal/practice', icon: BrainCircuit },
      ],
    },
    {
      title: 'MODULE B: CAMPUS INTELLIGENCE',
      items: [
        { label: 'Campus Dashboard', path: '/portal/campus', icon: Building },
        { label: 'Report an Issue', path: '/portal/report', icon: PlusCircle, highlight: true },
        { label: 'My Tickets', path: '/portal/tickets', icon: Ticket },
        { label: 'Speak Freely', path: '/portal/speak-freely', icon: ShieldAlert, badge: 'Privacy' },
        { label: 'Campus Clubs', path: '/portal/clubs', icon: Users },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { label: 'Profile', path: '/portal/profile', icon: User },
        { label: 'Settings', path: '/portal/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#f5f8fd] dark:bg-[#0b1220] text-slate-900 dark:text-slate-100">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 h-screen z-50 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#101a2d] shadow-[8px_0_40px_rgba(15,23,42,.025)] transition-all duration-300',
          collapsed ? 'w-20' : 'w-72',
          mobileOpen ? 'left-0' : '-left-full lg:left-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
          <Link to="/portal/overview" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-cyan flex items-center justify-center text-white shadow-glow-blue">
              <Bot className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">
                  SolveSphere AI
                </span>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Student Portal
                </p>
              </div>
            )}
          </Link>

          <button
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            aria-label="Close navigation" onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                      isActive
                        ? 'bg-blue-50 text-brand-blue ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-cyan-300 dark:ring-blue-500/20 font-bold'
                        : item.highlight
                        ? 'text-brand-blue dark:text-brand-cyan bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white',
                      collapsed && 'justify-center px-0'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-brand-blue dark:text-cyan-300' : '')} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span
                        className={cn(
                          'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-brand-blue/10 text-brand-blue dark:bg-brand-cyan/20 dark:text-brand-cyan'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Card & Admin Portal Quick Switch */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {!collapsed && (
            <Link
              to="/auth/admin-login"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Staff sign in
              </span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}

          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50',
              collapsed && 'justify-center p-1'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-blue to-brand-cyan flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {user?.fullName.charAt(0) || 'S'}
            </div>
            {!collapsed && (
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {user?.fullName || 'Demo Student'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.studentId || 'CS26019'} &bull; Sem 1
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="workspace-content flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-brand-surfaceDark/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation" onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-400">Student workspace</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="font-semibold text-brand-blue dark:text-brand-cyan">
                Semester {user?.semester ?? 1}
              </span>
            </div>
            <Badge variant="green" size="sm" className="hidden sm:inline-flex">
              Academic + Campus
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Notifications Dropdown */}
            <NotificationDropdown />

            <ThemeToggle variant="outline" />

            {/* Quick Link to Landing Page */}
            <Link to="/">
              <button className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Public Home
              </button>
            </Link>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
