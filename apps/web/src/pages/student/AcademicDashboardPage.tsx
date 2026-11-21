import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AcademicService, TimelineGroup } from '@/services/academicService';
import { SubjectSummary } from '@solvesphere/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  Filter,
  FileText,
  Brain,
  Info,
} from 'lucide-react';

export const AcademicDashboardPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [timeline, setTimeline] = useState<TimelineGroup>({
    completed: [],
    ongoing: [],
    upcoming: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [subjs, tl] = await Promise.all([
          AcademicService.getSubjects(),
          AcademicService.getTimeline(selectedSubjectId === 'ALL' ? undefined : selectedSubjectId),
        ]);
        setSubjects(subjs);
        setTimeline(tl);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedSubjectId]);

  const tabs = [
    { id: 'ALL', label: 'All 6 First-Year Subjects' },
    ...subjects.map((s) => ({ id: s.id, label: s.code })),
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="blue" size="sm">Module A</Badge>
            <span className="text-xs font-semibold text-slate-500">First-Year Curriculum Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Academic Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor real-time syllabus topic status across all six first-year courses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/portal/studymate">
            <Button variant="gradient" size="sm">
              <Brain className="w-3.5 h-3.5 mr-1.5" />
              Ask StudyMate AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Illustrative Notice */}
      <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
        <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-brand-blue dark:text-cyan-300">Illustrative Prototype Notice: </span>
          The syllabus topic breakdown and progress metrics below represent high-fidelity models for first-year engineering cohorts and do not constitute official university registrar grades.
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={selectedSubjectId}
        onChange={setSelectedSubjectId}
      />

      {/* 6 Subject Realistic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects
          .filter((s) => selectedSubjectId === 'ALL' || s.id === selectedSubjectId)
          .map((subject) => (
            <Card key={subject.id} hoverEffect className="p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <Badge variant="blue" size="sm">
                    {subject.code} &bull; {subject.category}
                  </Badge>
                  <span className="text-xs font-bold text-brand-blue dark:text-brand-cyan">
                    {subject.credits} Credits
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {subject.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Faculty: {subject.instructor}
                  </p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {subject.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Syllabus Completion</span>
                    <span className="text-brand-blue font-bold">{subject.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full"
                      style={{ width: `${subject.progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{subject.completedTopics} of {subject.totalTopics} Topics Covered</span>
                  </div>
                </div>

                {/* Current & Next Topic Details */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-start gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">Current: </span>
                      <span className="text-slate-600 dark:text-slate-400">{subject.currentTopic}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Next: </span>
                      <span className="text-slate-500">{subject.nextTopic}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <Link to={`/portal/resources?subjectId=${subject.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Resources
                  </Button>
                </Link>
                <Link to={`/portal/timeline?subjectId=${subject.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    Timeline &rarr;
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
      </div>

      {/* Academic Topic Timeline Component (Completed -> Ongoing -> Upcoming) */}
      <div className="mt-12 space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Live Classroom Topic Progression
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visual breakdown of curriculum pacing: Completed &rarr; Ongoing &rarr; Upcoming
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Completed Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Completed Topics
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900 text-[11px]">
                {timeline.completed.length}
              </span>
            </div>

            <div className="space-y-3">
              {timeline.completed.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-white dark:bg-brand-surfaceDark border border-slate-200 dark:border-slate-800 space-y-1.5 opacity-90 hover:opacity-100 transition-opacity"
                >
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    Unit {t.unit} &bull; Covered
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Ongoing Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border-2 border-brand-blue text-brand-blue dark:text-cyan-300 font-bold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                Currently Ongoing
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-blue text-white text-[11px]">
                {timeline.ongoing.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {timeline.ongoing.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-white dark:bg-brand-surfaceDark border-2 border-brand-blue/60 shadow-glow-blue space-y-2 relative"
                >
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-blue text-white uppercase tracking-wider">
                    Live In Hall
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-1">
                    {t.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t.description}
                  </p>
                  <div className="pt-2 flex justify-between items-center text-xs">
                    <Link
                      to="/portal/studymate"
                      className="font-semibold text-brand-blue dark:text-brand-cyan hover:underline"
                    >
                      Clarify Concept &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Upcoming Topics
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[11px]">
                {timeline.upcoming.length}
              </span>
            </div>

            <div className="space-y-3">
              {timeline.upcoming.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-white dark:bg-brand-surfaceDark border border-slate-200 dark:border-slate-800 space-y-1.5"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Unit {t.unit} &bull; Next in Queue
                  </span>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {t.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
