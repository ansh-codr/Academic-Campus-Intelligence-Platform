import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AcademicService } from '@/services/academicService';
import { SubjectSummary, SyllabusTopic } from '@solvesphere/shared';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  CalendarDays,
  CheckCircle2,
  Flame,
  Clock,
  BookOpen,
  Filter,
  Check,
  FileText,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';

export const TopicTimelinePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubject = searchParams.get('subjectId') || 'ALL';

  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'COMPLETED' | 'ONGOING' | 'UPCOMING'>('ALL');
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [studyProgress, setStudyProgress] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [progressError, setProgressError] = useState<string | null>(null);

  // Load subject list and initial progress
  useEffect(() => {
    AcademicService.getSubjects()
      .then(setSubjects)
      .catch((err: any) => {
        console.error('Failed to load subjects:', err);
        setLoadError(err?.message || 'Failed to load course subjects.');
      });
    if (user?.id) {
      AcademicService.getStudentStudyProgress(user.id).then(setStudyProgress)
        .catch(() => setProgressError('Could not load your personal study progress.'));
    }
  }, [user?.id]);

  // Real-time listener for syllabus topics
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = AcademicService.subscribeToTopics(
      selectedSubject === 'ALL' ? undefined : selectedSubject,
      (liveTopics) => {
        setTopics(liveTopics);
        setIsLoading(false);
        setLoadError(null);
      },
      (error) => {
        console.error('Topic subscription error:', error);
        setLoadError('Failed to load syllabus topics in real-time.');
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [selectedSubject]);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    if (subjectId === 'ALL') {
      searchParams.delete('subjectId');
    } else {
      searchParams.set('subjectId', subjectId);
    }
    setSearchParams(searchParams);
  };

  const handleTogglePersonalProgress = async (topic: SyllabusTopic) => {
    if (!user?.id) return;
    const current = !!studyProgress[topic.id];
    const nextState = !current;

    setProgressError(null);
    // Optimistic UI update
    setStudyProgress((prev) => ({ ...prev, [topic.id]: nextState }));

    try {
      await AcademicService.togglePersonalTopicStudy(user.id, topic.id, topic.subjectId, nextState);
    } catch (err) {
      console.error('Failed to update personal study progress:', err);
      setProgressError('Could not save your personal study progress.');
      // Revert on error
      setStudyProgress((prev) => ({ ...prev, [topic.id]: current }));
    }
  };

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
          Chronological breakdown of syllabus units with real-time updates and personal self-study checklists.
        </p>
      </div>

      {(loadError || progressError) && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-200 text-xs sm:text-sm flex items-center justify-between"
        >
          <span>{loadError || progressError}</span>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-brand-surfaceDark border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
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
      {filteredTopics.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-10 h-10" />}
          title="No topics match your filters"
          description="Adjust the subject or status filter to view syllabus topics."
        />
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-8">
          {filteredTopics.map((topic, idx) => {
            const isOngoing = topic.status === 'ONGOING';
            const isCompleted = topic.status === 'COMPLETED';
            const isSelfStudied = !!studyProgress[topic.id];

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
                        variant={isOngoing ? 'blue' : isCompleted ? 'green' : 'slate'}
                        size="sm"
                      >
                        {topic.status}
                      </Badge>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Unit {topic.unit} &bull; Step {idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {topic.completedAt && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Lectured on {topic.completedAt}
                        </span>
                      )}
                      {isOngoing && (
                        <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                          ● Active In Lecture Hall
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {topic.description}
                  </p>

                  {/* Dual Action Bar: Self-study checklist + Study Resources link */}
                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isSelfStudied ? 'secondary' : 'outline'}
                        className={`text-xs ${
                          isSelfStudied
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : ''
                        }`}
                        onClick={() => handleTogglePersonalProgress(topic)}
                      >
                        <BookmarkCheck className={`w-3.5 h-3.5 mr-1 ${isSelfStudied ? 'text-emerald-500' : ''}`} />
                        {isSelfStudied ? 'Personal Self-Study Completed' : 'Mark as Studied (Personal)'}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/portal/resources?subjectId=${topic.subjectId}&topicId=${topic.id}`}>
                        <Button size="sm" variant="ghost" className="text-xs text-brand-blue dark:text-brand-cyan">
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          Topic Resources &rarr;
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
