import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Sparkles, Menu, X, ShieldAlert, BookOpen, Building2 } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Academic Solutions', path: '/#academic' },
    { label: 'Campus Solutions', path: '/#campus' },
    { label: 'How It Works', path: '/#how-it-works' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-offWhite dark:bg-brand-darkBg text-brand-navy dark:text-slate-100 selection:bg-brand-blue selection:text-white">
      {/* Floating Header */}
      <header className="sticky top-4 z-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="glass-nav rounded-2xl px-5 py-3 shadow-premium flex items-center justify-between border border-slate-200/80 dark:border-slate-800">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-cyan flex items-center justify-center text-white shadow-glow-blue group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan dark:from-white dark:via-blue-200 dark:to-cyan-300 bg-clip-text text-transparent">
                SolveSphere<span className="text-brand-blue dark:text-brand-cyan">.AI</span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Academic & Campus Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.path}
                className="text-sm font-medium text-slate-600 hover:text-brand-blue dark:text-slate-300 dark:hover:text-brand-cyan transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle variant="outline" />
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">
                Student Login
              </Button>
            </Link>
            <Link to="/portal/overview">
              <Button variant="gradient" size="sm">
                Instant Demo
              </Button>
            </Link>
            <Link to="/auth/admin-login">
              <button
                title="Admin Portal Entry"
                className="p-2 text-xs font-semibold rounded-lg text-slate-500 hover:text-brand-blue hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs">Admin</span>
              </button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 p-4 rounded-2xl glass-nav border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  Student Sign In
                </Button>
              </Link>
              <Link to="/portal/overview" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full">
                  Instant Demo Experience
                </Button>
              </Link>
              <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full text-amber-600">
                  Administrative Portal
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-brand-surfaceDark/70 backdrop-blur-md mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-blue flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  SolveSphere AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                &ldquo;Your Problems. Our Smart Solutions.&rdquo;
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unified Academic Topic Tracking and AI-powered Campus Maintenance Ticketing for first-year university cohorts.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-blue" />
                Academic Solutions
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li><Link to="/portal/academic" className="hover:text-brand-blue">6 Core Subject Syllabi</Link></li>
                <li><Link to="/portal/timeline" className="hover:text-brand-blue">Live Topic Timeline</Link></li>
                <li><Link to="/portal/resources" className="hover:text-brand-blue">Faculty-Approved Notes</Link></li>
                <li><Link to="/portal/studymate" className="hover:text-brand-blue">StudyMate AI Assistant</Link></li>
                <li><Link to="/portal/practice" className="hover:text-brand-blue">Exam &amp; GD Practice</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand-cyan" />
                Campus Solutions
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li><Link to="/portal/report" className="hover:text-brand-cyan">Smart Issue Reporting</Link></li>
                <li><Link to="/portal/tickets" className="hover:text-brand-cyan">Full Ticket Lifecycle</Link></li>
                <li><Link to="/portal/speak-freely" className="hover:text-brand-cyan">Speak Freely (Sensitive)</Link></li>
                <li><Link to="/portal/clubs" className="hover:text-brand-cyan">Campus Club Directory</Link></li>
                <li><Link to="/admin/dashboard" className="hover:text-brand-cyan">Admin Workload Triage</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
                Phase 1 Advisory &amp; Status
              </h4>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Phase 1 Full-Stack Foundation
                </p>
                <p>
                  Demonstrates unified navigation, typed contracts, PostgreSQL schema architecture, and interactive demo adapters.
                </p>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  REST API &amp; Health Active
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
            <p>&copy; {new Date().getFullYear()} SolveSphere AI. All rights reserved.</p>
            <div className="flex gap-4 mt-2 sm:mt-0">
              <Link to="/auth/login" className="hover:text-slate-600 dark:hover:text-slate-300">Student Sign In</Link>
              <Link to="/auth/admin-login" className="hover:text-slate-600 dark:hover:text-slate-300">Staff Portal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
