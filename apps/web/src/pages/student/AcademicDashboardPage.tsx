import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AcademicService, TimelineGroup } from '@/services/academicService';
import { SubjectSummary, StudyResource, Quiz } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  FileText,
  Brain,
  Info,
  Award,
  Sparkles,
  Layers,
} from 'lucide-react';

export const AcademicDashboardPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [timeline, setTimeline] = useState<TimelineGroup>({
    completed: [],
    ongoing: [],
    upcoming: [],
  });
  const [recentResources, setRecentResources] = useState<StudyResource[]>([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [subjs, tl, resList, quizzes] = await Promise.all([
          AcademicService.getSubjects(),
          AcademicService.getTimeline(selectedSubjectId === 'ALL' ? undefined : selectedSubjectId),
          AcademicService.getResources({ subjectId: selectedSubjectId === 'ALL' ? undefined : selectedSubjectId }),
          AcademicService.getQuizzes(selectedSubjectId === 'ALL' ? undefined : selectedSubjectId),
        ]);
        setSubjects(subjs);
        setTimeline(tl);
        setRecentResources(resList.slice(0, 4));
        setUpcomingQuizzes(quizzes.slice(0, 3));
      } catch (err) {
        console.error('Failed to load academic dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedSubjectId]);

  // Derive dynamic metrics strictly from actual loaded subject and topic data
  const totalTopicsCount = subjects.reduce((acc, s) => acc + (s.totalTopics || 0), 0);
  const totalCompletedTopics = subjects.reduce((acc, s) => acc + (s.completedTopics || 0), 0);
  const overallSyllabusProgress = totalTopicsCount > 0
    ? Math.round((totalCompletedTopics / totalTopicsCount) * 100)
    : 0;

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
            Monitor real-time syllabus topic pacing, study resources, and assessments across all six courses.
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

      {/* Curriculum Banner with Real Dynamic Progress */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/20 via-slate-900 to-indigo-900/20 border border-blue-500/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-bold text-brand-cyan uppercase tracking-wider">
              Cohort Pacing Overview
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Semester 1 Engineering &amp; Computing Curriculum
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Live database-backed pacing tracking {subjects.length} enrolled subjects. Completed topics are verified by official lecture hall logs.
          </p>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Syllabus Completion</span>
            <div className="text-2xl font-black text-white flex items-baseline gap-1">
              <span>{overallSyllabusProgress}%</span>
              <span className="text-xs font-normal text-slate-400">
                ({totalCompletedTopics}/{totalTopicsCount} Topics)
              </span>
            </div>
            <div className="w-44 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full transition-all duration-500"
                style={{ width: `${overallSyllabusProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={selectedSubjectId}
        onChange={setSelectedSubjectId}
      />

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-10 h-10" />}
          title="No Academic Courses Found"
          description="Ensure subjects have been seeded into Firestore."
        />
      ) : (
        /* 6 Subject Realistic Cards Grid */
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

                  {/* Dynamic Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Syllabus Completion</span>
                      <span className="text-brand-blue font-bold">{subject.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full transition-all duration-500"
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
      )}

      {/* Academic Topic Timeline Component (Completed -> Ongoing -> Upcoming) */}
      <div className="mt-12 space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Live Classroom Topic Progression
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Visual breakdown of curriculum pacing: Completed &rarr; Ongoing &rarr; Upcoming
            </p>
          </div>
          <Link to={`/portal/timeline?subjectId=${selectedSubjectId}`}>
            <Button variant="ghost" size="sm" className="text-xs text-brand-blue dark:text-brand-cyan">
              View Detailed Timeline &rarr;
            </Button>
          </Link>
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
              {timeline.completed.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  No completed topics in this selection.
                </div>
              ) : (
                timeline.completed.map((t) => (
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
                ))
              )}
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
              {timeline.ongoing.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  No active lectures ongoing right now.
                </div>
              ) : (
                timeline.ongoing.map((t) => (
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
                        Clarify Concept with StudyMate &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              )}
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
              {timeline.upcoming.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  All syllabus topics completed.
                </div>
              ) : (
                timeline.upcoming.map((t) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Section: Recent Study Resources & Upcoming Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Recently Added Resources */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-blue" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recently Added Study Resources
              </h3>
            </div>
            <Link to="/portal/resources" className="text-xs text-brand-blue hover:underline">
              View all &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recentResources.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No recent resources recorded.
              </div>
            ) : (
              recentResources.map((res) => (
                <div
                  key={res.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-brand-surfaceDark border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-brand-blue transition-colors"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <Badge variant={res.facultyApproved ? 'green' : 'slate'} size="sm">
                        {res.type}
                      </Badge>
                      {res.facultyApproved && (
                        <span className="text-[10px] font-bold text-emerald-500">Faculty Approved</span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {res.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {res.authorFaculty || 'Academic Staff'} &bull; {res.scope.replace('_', ' ')}
                    </p>
                  </div>
                  <Link to={`/portal/resources?subjectId=${res.subjectId}`}>
                    <Button variant="ghost" size="sm" className="text-xs shrink-0">
                      View
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Practice Quizzes & Upcoming Assessments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Academic Practice &amp; MCQ Assessments
              </h3>
            </div>
            <Link to="/portal/practice" className="text-xs text-brand-blue hover:underline">
              Start quiz &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingQuizzes.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No active quizzes found.
              </div>
            ) : (
              upcomingQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-brand-surfaceDark border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-amber-500/50 transition-colors"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <Badge variant="amber" size="sm">
                        {quiz.difficulty}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {quiz.durationMinutes} mins &bull; {quiz.questionsCount} Questions
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {quiz.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {quiz.description}
                    </p>
                  </div>
                  <Link to="/portal/practice">
                    <Button variant="secondary" size="sm" className="text-xs shrink-0">
                      Practice &rarr;
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
