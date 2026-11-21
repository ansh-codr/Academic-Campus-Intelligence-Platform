import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  BookOpen,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Brain,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Compass,
  FileCheck,
  Zap,
  HelpCircle,
  GraduationCap,
  Users2,
  Layers,
  Flame,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activePreviewTab, setActivePreviewTab] = useState<'academic' | 'campus'>('academic');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is SolveSphere AI?',
      a: 'SolveSphere AI is an integrated Academic and Campus Intelligence Platform tailored specifically for first-year university cohorts. It connects real-time syllabus topic tracking with AI-assisted study tools and an intelligent campus maintenance complaint resolution system.',
    },
    {
      q: 'How does the Live Classroom Topic Timeline work?',
      a: 'Instructors and department coordinators update the progression of the syllabus. Students instantly see what topic is currently ongoing in lecture halls, what has already been covered with faculty notes attached, and what is coming next on the exam horizon.',
    },
    {
      q: 'What is AI Common Issue Clustering in Campus Intelligence?',
      a: 'When multiple students in the same wing or lecture hall report related issues (e.g., "Library AC not cooling" and "Reading room feels hot"), SolveSphere semantic algorithms cluster them into a single root-cause work order. This prevents duplicate tickets and helps campus technicians fix the master system faster.',
    },
    {
      q: 'What are the 6 first-year subjects supported in Phase 1?',
      a: 'The platform ships with structured syllabus models for CS101 Foundation in AI, Design Thinking, Digital Electronics, Digital Electronics Lab, Mathematics, and Business Communication.',
    },
    {
      q: 'Is authentication and real AI inference fully live in Phase 1?',
      a: 'Phase 1 delivers the full architectural foundation, typed service interfaces, PostgreSQL Prisma schema, health endpoints, and interactive high-fidelity frontend UI. Live session-based JWT authentication and production AI inference providers will be connected in Phase 2.',
    },
  ];

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Ambient Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-blue/20 via-brand-cyan/20 to-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Tag Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 text-brand-blue dark:text-cyan-300 text-xs font-semibold shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation University Intelligence &bull; Phase 1 Portal</span>
        </div>

        {/* Headline & Tagline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-brand-navy dark:text-white max-w-4xl mx-auto leading-[1.1]">
          Your Problems. <br />
          <span className="bg-gradient-to-r from-brand-blue via-indigo-600 to-brand-cyan bg-clip-text text-transparent">
            Our Smart Solutions.
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          One Platform for Smarter Learning and a Better Campus Experience. Unifying real-time academic topic tracking with intelligent campus maintenance ticketing.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/portal/overview">
            <Button variant="gradient" size="lg" className="w-full sm:w-auto text-base px-8 py-3.5">
              <span>Instant Demo Experience</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/auth/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-3.5">
              <span>Student Login</span>
            </Button>
          </Link>
        </div>

        {/* Interactive Product Preview Shell */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-brand-surfaceDark/90 backdrop-blur-xl shadow-2xl p-4 sm:p-6 text-left">
            {/* Preview Switcher Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="ml-2 text-xs font-mono text-slate-400">solvesphere.portal/preview</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setActivePreviewTab('academic')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activePreviewTab === 'academic'
                      ? 'bg-white dark:bg-brand-cardDark text-brand-blue shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Module A: Academic Intelligence</span>
                </button>
                <button
                  onClick={() => setActivePreviewTab('campus')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activePreviewTab === 'campus'
                      ? 'bg-white dark:bg-brand-cardDark text-brand-cyan shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Module B: Campus Maintenance</span>
                </button>
              </div>
            </div>

            {/* Tab Preview Content */}
            <div className="pt-6">
              {activePreviewTab === 'academic' ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="blue" size="sm">CS101 &bull; Core Course</Badge>
                        <span className="text-xs text-slate-500 font-medium">Instructor: Dr. Aris Thorne</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        Foundation in AI (CS101)
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Current Syllabus Coverage: 44% (8 of 18 Topics Completed)
                      </p>
                    </div>

                    <Link to="/portal/academic">
                      <Button variant="secondary" size="sm">
                        Open Full Course View
                      </Button>
                    </Link>
                  </div>

                  {/* Topic Timeline Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Completed */}
                    <div className="p-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed Topics (8)</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Uninformed &amp; Heuristic Search (A*, Greedy)
                      </p>
                      <p className="text-xs text-slate-500">
                        Lecture notes &amp; practice problem sheets verified by faculty.
                      </p>
                    </div>

                    {/* Current Ongoing */}
                    <div className="p-4 rounded-2xl border-2 border-brand-blue bg-blue-50/50 dark:bg-blue-950/30 space-y-2 relative shadow-glow-blue">
                      <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-brand-blue text-[10px] font-bold text-white uppercase tracking-wider">
                        Live In Class
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-blue dark:text-cyan-300">
                        <Flame className="w-4 h-4 animate-pulse text-amber-500" />
                        <span>Currently Ongoing</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Neural Networks &amp; Activation Functions
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Unit 2 &bull; Multi-layer perceptrons, ReLU, Sigmoid formulas.
                      </p>
                    </div>

                    {/* Upcoming */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>Upcoming Topic</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Backpropagation &amp; Optimization
                      </p>
                      <p className="text-xs text-slate-500">
                        Scheduled for next Tuesday &bull; Pre-reading slides available.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Campus Maintenance Preview */}
                  <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="cyan" size="sm">CMP-2026-0841</Badge>
                        <Badge variant="amber" size="sm">HIGH PRIORITY</Badge>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        Lecture Hall 204 AC Unit Leaking Water &amp; Not Cooling
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Location: Engineering Block A &bull; 2nd Floor &bull; Hall 204
                      </p>
                    </div>
                    <Link to="/portal/tickets">
                      <Button variant="secondary" size="sm">
                        View Live Ticket
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-slate-400 block font-semibold">TICKET STATUS</span>
                      <span className="font-bold text-sm text-blue-600 dark:text-cyan-400 mt-1 inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        In Progress
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-slate-400 block font-semibold">ASSIGNED DEPARTMENT</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white mt-1 block truncate">
                        HVAC &amp; Climate Control
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-slate-400 block font-semibold">SEMANTIC CLUSTER</span>
                      <span className="font-bold text-sm text-purple-600 dark:text-purple-400 mt-1 block">
                        4 Related Reports
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-slate-400 block font-semibold">EXPECTED RESOLUTION</span>
                      <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-1 block">
                        Today by 5:00 PM
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1: Module A - Academic Intelligence */}
      <section id="academic" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="blue" size="md">MODULE A</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Academic Intelligence for First-Year Success
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Eliminate confusion over what is being taught. Track live curriculum progression, access verified lecture resources, and test readiness with AI practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* Card 1 */}
          <Card hoverEffect className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-brand-blue flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Live Classroom Topic Timeline
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Real-time synchronization with classroom teaching. Easily distinguish between Completed, Ongoing, and Upcoming topics across your enrolled semester.
            </p>
            <div className="pt-2 text-xs font-semibold text-brand-blue flex items-center gap-1">
              <span>View timeline feature</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Card>

          {/* Card 2 */}
          <Card hoverEffect className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Six First-Year Curricula
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Curated units for Foundation in AI (CS101), Design Thinking, Digital Electronics, Digital Lab, Mathematics, and Business Communication.
            </p>
            <div className="pt-2 text-xs font-semibold text-cyan-600 flex items-center gap-1">
              <span>Explore subjects</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Card>

          {/* Card 3 */}
          <Card hoverEffect className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Syllabus-Aware Resource Discovery
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Filter resources explicitly marked as Within Syllabus or Outside Syllabus, backed by verified faculty endorsement badges.
            </p>
            <div className="pt-2 text-xs font-semibold text-indigo-600 flex items-center gap-1">
              <span>Filter study notes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Card>

          {/* Card 4 */}
          <Card hoverEffect className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              StudyMate AI Assistant
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Interactive educational tutor designed to explain complex formulas, solve tricky logic gates, and draft structured revision guides.
            </p>
            <div className="pt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>Try assistant demo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Card>

          {/* Card 5 */}
          <Card hoverEffect className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Multiple-Choice Quizzes
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Topic-targeted interactive quizzes with instant answer rationale, score tracking, and revision recommendations.
            </p>
            <div className="pt-2 text-xs font-semibold text-amber-600 flex items-center gap-1">
              <span>Practice now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Card>

          {/* Card 6 */}
          <Card hoverEffect className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              GD &amp; Extempore Coaching
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Prepare for Business Communication presentations with real-time impromptu topic prompts and debate structure rubrics.
            </p>
            <div className="pt-2 text-xs font-semibold text-purple-600 flex items-center gap-1">
              <span>Speech training</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        </div>
      </section>

      {/* Feature Section 2: Module B - Campus Intelligence */}
      <section id="campus" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="cyan" size="md">MODULE B</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Smart Campus Intelligence &amp; Maintenance
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            A transparent, responsive infrastructure portal. Report problems seamlessly, avoid duplicate tickets with semantic clustering, and discover student clubs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* Card 1 */}
          <Card hoverEffect className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Smart Maintenance Ticketing
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Easily submit complaints for classroom AC faults, Wi-Fi dead-zones, electrical issues, plumbing, or hostel infrastructure with location tagging.
            </p>
          </Card>

          {/* Card 2 */}
          <Card hoverEffect className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-brand-blue flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Complete Ticket Lifecycle
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Track progress from Submitted &rarr; Under Review &rarr; Assigned &rarr; In Progress &rarr; Resolved &rarr; Closed with auditable timestamps.
            </p>
          </Card>

          {/* Card 3 */}
          <Card hoverEffect className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              AI Common Issue Clustering
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Detects semantically related complaints across dorms or lecture blocks to group duplicates and propose shared incident work orders.
            </p>
          </Card>

          {/* Card 4 */}
          <Card hoverEffect className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Speak Freely (Sensitive Concerns)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              A privacy-conscious channel for reporting sensitive campus concerns, backed by clear advisory notices on anonymity boundaries.
            </p>
          </Card>

          {/* Card 5 */}
          <Card hoverEffect className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Campus Care Guidance
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Interactive assistant that recommends the correct building, floor, department, and priority when lodging an urgent complaint.
            </p>
          </Card>

          {/* Card 6 */}
          <Card hoverEffect className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <Users2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Campus Club Directory
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Explore technical societies, debate unions, robotics labs, and design collectives. See meeting schedules and upcoming activities.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="blue" size="md">WORKFLOW</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            How SolveSphere AI Works
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Three simple steps to streamline your first-year university experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 relative">
          {/* Step 1 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-brand-surfaceDark border border-slate-200 dark:border-slate-800 shadow-premium relative text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-blue text-white font-extrabold flex items-center justify-center mx-auto text-lg shadow-glow-blue">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Create Your Account
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Sign up with your university student ID or log in with one-click Instant Demo to test all academic and campus features immediately.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-brand-surfaceDark border border-slate-200 dark:border-slate-800 shadow-premium relative text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-cyan text-slate-950 font-extrabold flex items-center justify-center mx-auto text-lg shadow-glow-cyan">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Choose Academic or Campus
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Navigate seamlessly between lecture topic timelines and campus problem reporting with dedicated, distraction-free dashboards.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-brand-surfaceDark border border-slate-200 dark:border-slate-800 shadow-premium relative text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Learn, Report, Manage &amp; Track
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Ace exams with verified notes and AI assistance while keeping tabs on your maintenance requests through an auditable status pipeline.
            </p>
          </div>
        </div>
      </section>

      {/* Role-Specific Benefits Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <Badge variant="slate" size="md">STAKEHOLDERS</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Designed for Every Campus Role
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 border-t-4 border-t-brand-blue">
            <div className="flex items-center gap-2 text-brand-blue font-bold text-sm">
              <GraduationCap className="w-5 h-5" />
              <span>For First-Year Students</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Know exactly which topic is active in lectures today.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Filter official professor notes vs exploratory reading.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Instant status updates on dorm and lab maintenance tickets.</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 space-y-4 border-t-4 border-t-brand-cyan">
            <div className="flex items-center gap-2 text-cyan-600 font-bold text-sm">
              <BookOpen className="w-5 h-5" />
              <span>For Faculty Instructors</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>One-click topic completion and syllabus pacing controls.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Distribute verified slides, formulas, and practice sheets.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Clear visibility into student concept readiness before midterms.</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 space-y-4 border-t-4 border-t-amber-500">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <Building2 className="w-5 h-5" />
              <span>For Campus Administrators</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>AI issue clustering groups duplicate complaints automatically.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Department workload dispatching for HVAC, IT, and Plumbing.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Auditable SLA tracking with historical resolution logs.</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-10">
          <Badge variant="blue" size="md">FAQS</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Everything you need to know about the SolveSphere AI platform.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-surfaceDark overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-90 text-brand-blue' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* High-Impact CTA Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-brand-blue via-indigo-600 to-brand-cyan text-white shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready for a Smarter First-Year University Experience?
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Explore the SolveSphere AI student and administrative portals with realistic curricula and live maintenance tickets.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link to="/portal/overview">
                <Button variant="outline" size="lg" className="bg-white text-brand-blue hover:bg-slate-100 border-none">
                  Launch Student Portal Demo
                </Button>
              </Link>
              <Link to="/admin/dashboard">
                <Button variant="ghost" size="lg" className="text-white hover:bg-white/20 border border-white/30">
                  Staff Administrative Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
