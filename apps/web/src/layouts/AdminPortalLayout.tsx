import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuthDemo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck2,
  FileCheck2,
  AlertTriangle,
  Network,
  UserCheck,
  Building2,
  EyeOff,
  Sparkles,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AdminPortalLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, loginAsAdmin } = useAuth();

  const adminNavGroups = [
    {
      title: 'OPERATIONAL COMMAND',
      items: [
        { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Enrolled Students', path: '/admin/students', icon: Users },
      ],
    },
    {
      title: 'ACADEMIC MANAGEMENT',
      items: [
        { label: 'All Subjects', path: '/admin/subjects', icon: BookOpen },
        { label: 'Topic Timeline Updates', path: '/admin/topic-updates', icon: CalendarCheck2 },
        { label: 'Resource Verification', path: '/admin/resources', icon: FileCheck2 },
      ],
    },
    {
      title: 'CAMPUS COMPLAINTS & TRIAGE',
      items: [
        { label: 'All Complaints', path: '/admin/complaints', icon: AlertTriangle },
        { label: 'AI Issue Clusters', path: '/admin/clusters', icon: Network, highlight: true },
        { label: 'Ticket Assignments', path: '/admin/assignments', icon: UserCheck },
        { label: 'Department Workload', path: '/admin/departments', icon: Building2 },
        { label: 'Anonymous Concerns', path: '/admin/anonymous-reports', icon: EyeOff },
      ],
    },
    {
      title: 'INSTITUTION',
      items: [
        { label: 'Campus Clubs', path: '/admin/clubs', icon: Sparkles },
        { label: 'Analytics & Reports', path: '/admin/analytics', icon: BarChart3 },
        { label: 'System Settings', path: '/admin/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#0b1220] text-slate-100">
      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 h-screen z-50 flex flex-col border-r border-slate-800 bg-[#0d1627] transition-all duration-300',
          collapsed ? 'w-20' : 'w-72',
          mobileOpen ? 'left-0' : '-left-full lg:left-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Admin Command
                </span>
                <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                  SolveSphere AI
                </p>
              </div>
            )}
          </Link>

          <button
            aria-label={collapsed ? "Expand admin navigation" : "Collapse admin navigation"} onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            aria-label="Close admin navigation" onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {adminNavGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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
                        ? 'bg-amber-500/15 text-amber-300 font-bold ring-1 ring-amber-500/20'
                        : item.highlight
                        ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white',
                      collapsed && 'justify-center px-0'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-amber-300' : '')} />
                    {!collapsed && <span className="truncate">{item.label}</span>}

                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer / Switch back to Student Portal */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {!collapsed && (
            <Link
              to="/portal/overview"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-950/40 border border-blue-900/60 text-blue-300 text-xs font-semibold hover:bg-blue-900/40 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Return to Student Portal
              </span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}

          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-xl bg-slate-900',
              collapsed && 'justify-center p-1'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-xs font-bold">
              ADM
            </div>
            {!collapsed && (
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {user?.fullName || 'Dr. Vikram Malhotra'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  Admin Authority &bull; Ops
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Admin Page Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900 text-slate-100">
        <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open admin navigation" onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-400">Institutional Administration</span>
              <span className="text-slate-600">/</span>
              <span className="font-semibold text-amber-400">Central Academic &amp; Estate Ops</span>
            </div>
            <Badge variant="amber" size="sm">
              Administration
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="outline" className="text-slate-300 border-slate-700 bg-slate-800" />
            <Link to="/portal/overview">
              <button className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
                Student View
              </button>
            </Link>
          </div>
        </header>

        {/* Content View */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
