import React, { useEffect, useState } from 'react';
import { AcademicService } from '@/services/academicService';
import { SubjectSummary, SyllabusTopic } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import {
  CalendarDays,
  CheckCircle2,
  Flame,
  Clock,
  BookOpen,
  Filter,
  Check,
} from 'lucide-react';

export const TopicTimelinePage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'COMPLETED' | 'ONGOING' | 'UPCOMING'>('ALL');
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);

  useEffect(() => {
    async function load() {
      const [subjs, tl] = await Promise.all([
        AcademicService.getSubjects(),
        AcademicService.getTimeline(selectedSubject === 'ALL' ? undefined : selectedSubject),
      ]);
      setSubjects(subjs);
      setTopics([...tl.completed, ...tl.ongoing, ...tl.upcoming]);
    }
    load();
  }, [selectedSubject]);

  const filteredTopics = topics.filter((t) => {
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" size="sm">Curriculum Timeline</Badge>
          <span className="text-xs text-slate-500 font-semibold">Live Classroom Pacing</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Academic Topic Timeline
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Chronological breakdown of syllabus units across Completed, Ongoing, and Upcoming milestones.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-brand-surfaceDark border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Status:</span>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            {(['ALL', 'COMPLETED', 'ONGOING', 'UPCOMING'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  selectedStatus === status
                    ? 'bg-white dark:bg-brand-cardDark text-brand-blue shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vertical Interactive Timeline */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-8">
        {filteredTopics.map((topic, idx) => {
          const isOngoing = topic.status === 'ONGOING';
          const isCompleted = topic.status === 'COMPLETED';

          return (
            <div key={topic.id} className="relative group">
              {/* Timeline marker icon */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ring-white dark:ring-brand-darkBg ${
                  isOngoing
                    ? 'bg-brand-blue animate-pulse shadow-glow-blue'
                    : isCompleted
                    ? 'bg-emerald-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                {isOngoing ? (
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                ) : isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                )}
              </div>

              {/* Topic Card */}
              <Card
                className={`p-5 transition-all ${
                  isOngoing
                    ? 'border-2 border-brand-blue shadow-glow-blue bg-blue-50/20 dark:bg-blue-950/20'
                    : 'bg-white dark:bg-brand-surfaceDark'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        isOngoing ? 'blue' : isCompleted ? 'green' : 'slate'
                      }
                      size="sm"
                    >
                      {topic.status}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Unit {topic.unit} &bull; Step {idx + 1}
                    </span>
                  </div>
                  {topic.completedAt && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Finished on {topic.completedAt}
                    </span>
                  )}
                  {isOngoing && (
                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                      ● Active In Lecture Hall
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {topic.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {topic.description}
                </p>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Est. Duration: {topic.estimatedHours || 4} lecture hours
                  </span>
                  <a
                    href={`/portal/resources?subjectId=${topic.subjectId}`}
                    className="font-semibold text-brand-blue dark:text-cyan-400 hover:underline"
                  >
                    View Verified Notes &rarr;
                  </a>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};
