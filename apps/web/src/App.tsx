import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/hooks/useAuthDemo';

// Layouts
import { PublicLayout } from '@/layouts/PublicLayout';
import { StudentPortalLayout } from '@/layouts/StudentPortalLayout';
import { AdminPortalLayout } from '@/layouts/AdminPortalLayout';

// Public & Landing
const LandingPage = React.lazy(() => import('@/pages/landing/LandingPage').then((module) => ({ default: module.LandingPage })));

// Auth Pages
const StudentLoginPage = React.lazy(() => import('@/pages/auth/StudentLoginPage').then((module) => ({ default: module.StudentLoginPage })));
const StudentRegisterPage = React.lazy(() => import('@/pages/auth/StudentRegisterPage').then((module) => ({ default: module.StudentRegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })));
const AdminLoginPage = React.lazy(() => import('@/pages/auth/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })));

// Student Portal Pages
const StudentOverviewPage = React.lazy(() => import('@/pages/student/StudentOverviewPage').then((module) => ({ default: module.StudentOverviewPage })));
const AcademicDashboardPage = React.lazy(() => import('@/pages/student/AcademicDashboardPage').then((module) => ({ default: module.AcademicDashboardPage })));
const MySubjectsPage = React.lazy(() => import('@/pages/student/MySubjectsPage').then((module) => ({ default: module.MySubjectsPage })));
const TopicTimelinePage = React.lazy(() => import('@/pages/student/TopicTimelinePage').then((module) => ({ default: module.TopicTimelinePage })));
const StudyResourcesPage = React.lazy(() => import('@/pages/student/StudyResourcesPage').then((module) => ({ default: module.StudyResourcesPage })));
const StudyMateAiPage = React.lazy(() => import('@/pages/student/StudyMateAiPage').then((module) => ({ default: module.StudyMateAiPage })));
const PracticeQuizzesPage = React.lazy(() => import('@/pages/student/PracticeQuizzesPage').then((module) => ({ default: module.PracticeQuizzesPage })));
const CampusDashboardPage = React.lazy(() => import('@/pages/student/CampusDashboardPage').then((module) => ({ default: module.CampusDashboardPage })));
const CampusCareAiPage = React.lazy(() => import('@/pages/student/CampusCareAiPage').then((module) => ({ default: module.CampusCareAiPage })));
const ReportIssuePage = React.lazy(() => import('@/pages/student/ReportIssuePage').then((module) => ({ default: module.ReportIssuePage })));
const MyTicketsPage = React.lazy(() => import('@/pages/student/MyTicketsPage').then((module) => ({ default: module.MyTicketsPage })));
const SpeakFreelyPage = React.lazy(() => import('@/pages/student/SpeakFreelyPage').then((module) => ({ default: module.SpeakFreelyPage })));
const CampusClubsPage = React.lazy(() => import('@/pages/student/CampusClubsPage').then((module) => ({ default: module.CampusClubsPage })));
const ProfilePage = React.lazy(() => import('@/pages/student/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const SettingsPage = React.lazy(() => import('@/pages/student/SettingsPage').then((module) => ({ default: module.SettingsPage })));

// Admin Portal Pages
const AdminDashboardPage = React.lazy(() => import('@/pages/admin/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })));
const AdminAcademicManagementPage = React.lazy(() => import('@/pages/admin/AdminAcademicManagementPage').then((module) => ({ default: module.AdminAcademicManagementPage })));
const AdminComplaintsClustersPage = React.lazy(() => import('@/pages/admin/AdminComplaintsClustersPage').then((module) => ({ default: module.AdminComplaintsClustersPage })));
const AdminDepartmentsPage = React.lazy(() => import('@/pages/admin/AdminDepartmentsPage').then((module) => ({ default: module.AdminDepartmentsPage })));
const AdminClubsPage = React.lazy(() => import('@/pages/admin/AdminClubsPage').then((module) => ({ default: module.AdminClubsPage })));
import { ShieldAlert } from 'lucide-react';

// Protected Route Guard: Requires Authenticated Student or Admin
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-offWhite dark:bg-brand-darkBg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Verifying Firebase Authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Protected Route Guard: Requires Verified ADMIN Role Custom Claim
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Validating administrative role claims...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/admin-login" state={{ from: location }} replace />;
  }

  if (role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-slate-900 text-white space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">403 — Forbidden</h2>
        <p className="text-xs text-slate-400 max-w-md">
          Access Denied. Your account is authenticated as <strong className="text-amber-400">{role}</strong> and lacks verified ADMIN permissions for administrative command operations.
        </p>
        <Link
          to="/portal/overview"
          className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blueHover transition-colors"
        >
          Return to Student Portal
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

// 404 Fallback
const NotFoundPage = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
    <h2 className="text-4xl font-extrabold text-brand-blue">404</h2>
    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Page Not Found</h3>
    <p className="text-sm text-slate-500 max-w-sm">
      The requested route does not exist. Return to the portal home or dashboard.
    </p>
    <a
      href="/"
      className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blueHover transition-colors"
    >
      Return Home
    </a>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <React.Suspense fallback={<div role="status" className="min-h-[50vh] grid place-items-center text-sm font-semibold text-slate-500 dark:text-slate-400">Loading your workspace…</div>}>
            <Routes>
              {/* Public Layout */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth/login" element={<StudentLoginPage />} />
                <Route path="/auth/register" element={<StudentRegisterPage />} />
                <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/auth/admin-login" element={<AdminLoginPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Protected Student Portal Layout */}
              <Route
                path="/portal"
                element={
                  <RequireAuth>
                    <StudentPortalLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Navigate to="/portal/overview" replace />} />
                <Route path="overview" element={<StudentOverviewPage />} />
                <Route path="academic" element={<AcademicDashboardPage />} />
                <Route path="subjects" element={<MySubjectsPage />} />
                <Route path="timeline" element={<TopicTimelinePage />} />
                <Route path="resources" element={<StudyResourcesPage />} />
                <Route path="studymate" element={<StudyMateAiPage />} />
                <Route path="practice" element={<PracticeQuizzesPage />} />
                <Route path="campus" element={<CampusDashboardPage />} />
                <Route path="campus-care" element={<CampusCareAiPage />} />
                <Route path="report" element={<ReportIssuePage />} />
                <Route path="tickets" element={<MyTicketsPage />} />
                <Route path="speak-freely" element={<SpeakFreelyPage />} />
                <Route path="clubs" element={<CampusClubsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Protected Admin Portal Layout (Admin Custom Claim required) */}
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminPortalLayout />
                  </RequireAdmin>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="students" element={<AdminDashboardPage />} />
                <Route path="subjects" element={<AdminAcademicManagementPage />} />
                <Route path="topic-updates" element={<AdminAcademicManagementPage />} />
                <Route path="resources" element={<AdminAcademicManagementPage />} />
                <Route path="complaints" element={<AdminComplaintsClustersPage />} />
                <Route path="clusters" element={<AdminComplaintsClustersPage />} />
                <Route path="assignments" element={<AdminComplaintsClustersPage />} />
                <Route path="departments" element={<AdminDepartmentsPage />} />
                <Route path="anonymous-reports" element={<AdminComplaintsClustersPage />} />
                <Route path="clubs" element={<AdminClubsPage />} />
                <Route path="analytics" element={<AdminDashboardPage />} />
                <Route path="settings" element={<AdminDashboardPage />} />
              </Route>
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
