import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuthDemo';
import { AcademicService } from '@/services/academicService';
import { CampusService } from '@/services/campusService';
import { SubjectSummary, CampusTicket, SyllabusTopic } from '@solvesphere/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  GraduationCap,
  Building,
  Flame,
  ArrowRight,
  BookOpen,
  PlusCircle,
  Bot,
  BrainCircuit,
  Ticket,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

export const StudentOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [tickets, setTickets] = useState<CampusTicket[]>([]);
  const [ongoingTopics, setOngoingTopics] = useState<SyllabusTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const [subjs, tkts, timeline] = await Promise.all([
          AcademicService.getSubjects(),
          CampusService.getTickets(),
          AcademicService.getTimeline(),
        ]);
        setSubjects(subjs);
        setTickets(tkts);
        setOngoingTopics(timeline.ongoing);
      } finally {
        setIsLoading(false);
      }
    }
    loadOverview();
  }, []);

  const activeTickets = tickets.filter(
    (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED'
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Personalized Welcome Banner */}
      <div className="p-6 sm:p-9 rounded-[28px] bg-gradient-to-br from-[#172e6e] via-brand-blue to-[#037f99] text-white shadow-premium relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Semester 1 &bull; Academic Year 2026-27</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName || 'Aarav'}!
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
            Your academic and campus updates, brought together in one focused workspace.
          </p>

          {/* Quick Actions Bar */}
          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link to="/portal/report">
              <Button size="sm" className="bg-white text-brand-blue hover:bg-blue-50 font-semibold shadow-sm">
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Report Campus Issue
              </Button>
            </Link>
            <Link to="/portal/studymate">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 border border-white/30">
                <Bot className="w-3.5 h-3.5 mr-1" />
                Ask StudyMate AI
              </Button>
            </Link>
            <Link to="/portal/timeline">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 border border-white/30">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                View Topic Timeline
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Illustrative Notice Pill */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-brand-blue dark:text-blue-300">
        <Info className="w-4 h-4 shrink-0" />
        <span>
          <strong>Phase 1 Full-Stack Notice:</strong> Information may include sample records when remote data is unavailable; verify critical details with your institution.
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>ENROLLED SUBJECTS</span>
            <GraduationCap className="w-4 h-4 text-brand-blue" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{isLoading ? "—" : subjects.length} Subjects</p>
          <p className="text-xs text-slate-500">Subjects in your learning workspace</p>
        </Card>

        {/* KPI 2 */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>AVG SYLLABUS COVERAGE</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{isLoading ? "—" : subjects.length ? (subjects.reduce((sum, s) => sum + s.progressPercentage, 0) / subjects.length).toFixed(1) : "0"}%</p>
          <p className="text-xs text-slate-500">Average across available subjects</p>
        </Card>

        {/* KPI 3 */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>ACTIVE CAMPUS TICKETS</span>
            <Building className="w-4 h-4 text-brand-cyan" />
          </div>
          <p className="text-2xl font-extrabold text-brand-cyan">{activeTickets.length}</p>
          <p className="text-xs text-slate-500">Unresolved items in your ticket queue</p>
        </Card>

        {/* KPI 4 */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>ONGOING TOPICS</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{isLoading ? "—" : ongoingTopics.length}</p>
          <p className="text-xs text-slate-500">See your current syllabus timeline</p>
        </Card>
      </div>

      {/* Main Two-Column Hub: Academic Pulse vs Campus Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Academic Intelligence Pulse */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-brand-blue">
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Today&apos;s Ongoing Classroom Topics
                </h2>
                <p className="text-xs text-slate-500">Live topics currently active in lecture halls</p>
              </div>
            </div>
            <Link to="/portal/timeline" className="text-xs font-bold text-brand-blue hover:underline">
              View All Topics &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {!isLoading && ongoingTopics.length === 0 && <p className="p-5 text-sm text-slate-500 dark:text-slate-400 border border-dashed rounded-2xl">No ongoing topics currently available.</p>}
            {ongoingTopics.slice(0, 3).map((topic) => (
              <div
                key={topic.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-surfaceDark hover:border-brand-blue/40 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="blue" size="sm">
                    Unit {topic.unit} &bull; Ongoing
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ~{topic.estimatedHours} hrs allocated
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {topic.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {topic.description}
                </p>
                <div className="pt-1 flex items-center justify-between text-xs">
                  <Link
                    to={`/portal/resources?subjectId=${topic.subjectId}`}
                    className="font-semibold text-brand-blue dark:text-brand-cyan hover:underline"
                  >
                    Study Lecture Materials &rarr;
                  </Link>
                  <Link
                    to="/portal/studymate"
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  >
                    Explain with AI
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Subject Progress Preview */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Semester Curriculum Progress</span>
              <Link to="/portal/academic" className="text-xs text-brand-blue font-semibold hover:underline">
                All Subjects
              </Link>
            </h3>
            <div className="space-y-3">
              {subjects.slice(0, 3).map((subj) => (
                <div key={subj.id} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{subj.name} ({subj.code})</span>
                    <span className="text-brand-blue dark:text-cyan-400">{subj.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full transition-all duration-500"
                      style={{ width: `${subj.progressPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Campus Intelligence Pulse */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-brand-cyan">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  My Active Campus Tickets
                </h2>
                <p className="text-xs text-slate-500">Live maintenance requests &amp; status logs</p>
              </div>
            </div>
            <Link to="/portal/tickets" className="text-xs font-bold text-brand-cyan hover:underline">
              View All ({tickets.length}) &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {!isLoading && tickets.length === 0 && <p className="p-5 text-sm text-slate-500 dark:text-slate-400 border border-dashed rounded-2xl">No campus tickets to display.</p>}
            {tickets.slice(0, 3).map((tkt) => (
              <div
                key={tkt.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-surfaceDark hover:border-brand-cyan/40 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {tkt.referenceNumber}
                    </span>
                    <Badge
                      variant={
                        tkt.status === 'RESOLVED'
                          ? 'green'
                          : tkt.status === 'IN_PROGRESS'
                          ? 'blue'
                          : 'amber'
                      }
                      size="sm"
                    >
                      {tkt.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {tkt.building} &bull; {tkt.room}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {tkt.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Dept: {tkt.assignedDepartment}</span>
                  <Link
                    to="/portal/tickets"
                    className="font-semibold text-brand-cyan hover:underline"
                  >
                    View Status Log &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Report CTA Box */}
          <Card className="p-5 border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Experiencing an AC, Wi-Fi or Electrical fault?
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit an issue in under 60 seconds with location tagging.
              </p>
            </div>
            <Link to="/portal/report" className="shrink-0">
              <Button size="sm" variant="gradient">
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Report Now
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};
