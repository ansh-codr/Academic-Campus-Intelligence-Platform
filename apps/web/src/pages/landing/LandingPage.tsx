import React, { useState } from 'react';
import { PlatformShowcase } from '@/components/marketing/PlatformShowcase';
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
    <div className="overflow-hidden pb-24">
      <section className="premium-stage surface-grid relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-20">
        <div aria-hidden="true" className="pointer-events-none absolute top-0 left-1/4 h-[400px] w-[550px] rounded-full bg-blue-300/20 dark:bg-blue-500/10 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl grid lg:grid-cols-[.95fr_1.05fr] gap-12 lg:gap-10 items-center">
          <div className="text-center lg:text-left">
            <div className="stagger-enter inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 dark:bg-blue-950/50 dark:border-blue-700/50 px-3.5 py-2 text-[11px] sm:text-xs font-bold tracking-wide text-blue-700 dark:text-blue-200 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              One connected campus. A better everyday.
            </div>
            <h1 className="stagger-enter mt-7 text-[clamp(2.9rem,5.3vw,5.6rem)] font-extrabold tracking-[-.075em] leading-[1.05] text-slate-950 dark:text-white">
              Your Problems.<br /><span className="text-gradient">Our Smart<br className="hidden lg:block" /> Solutions.</span>
            </h1>
            <p className="stagger-enter mt-7 max-w-xl mx-auto lg:mx-0 text-base sm:text-lg leading-[1.85] text-slate-600 dark:text-slate-300">
              One intelligent platform for smarter learning, seamless campus support, and a better student experience.
            </p>
            <div className="stagger-enter mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/auth/register"><Button variant="gradient" size="lg" className="w-full sm:w-auto">Get Started Free <ArrowRight className="w-4 h-4"/></Button></Link>
              <a href="#features" className="inline-flex"><Button variant="outline" size="lg" className="w-full sm:w-auto">Explore the Platform <Compass className="w-4 h-4"/></Button></a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 justify-center lg:justify-start text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Academic workflows</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Campus issue tracking</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Student-first design</span>
            </div>
          </div>
          <PlatformShowcase/>
        </div>
      </section>
      <div id="features" className="h-1 scroll-mt-24" aria-hidden="true" />
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
