import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AcademicService } from '@/services/academicService';
import { SubjectSummary } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookOpen, UserCheck, Award, Layers, FileText, Building2, Flame } from 'lucide-react';

export const MySubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    AcademicService.getSubjects()
      .then((data) => {
        setSubjects(data);
        setLoadError(null);
      })
      .catch((err: any) => {
        console.error('Failed to load subjects:', err);
        setLoadError(err?.message || 'Failed to load enrolled courses.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" size="sm">Course Directory</Badge>
          <span className="text-xs text-slate-500 font-semibold">Semester 1 Enrolled Curricula</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Enrolled Academic Curricula
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Complete syllabus structure, course credits, and assigned department faculty.
        </p>
      </div>

      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-200 text-xs sm:text-sm flex items-center justify-between"
        >
          <span>{loadError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-14 w-full" />
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-10 h-10" />}
          title="No courses registered"
          description="Courses will appear once enrollment is processed."
        />
      ) : (
        <div className="space-y-6">
          {subjects.map((subj, index) => (
            <Card key={subj.id} className="p-6 overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-brand-blue font-mono font-bold text-xs">
                      {subj.code}
                    </span>
                    <Badge variant="slate" size="sm">
                      {subj.category}
                    </Badge>
                    <span className="text-xs text-slate-400">Course #{index + 1}</span>
                    {subj.semester && (
                      <span className="text-xs text-slate-400">&bull; Semester {subj.semester}</span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {subj.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                    {subj.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-brand-blue" />
                      Faculty: <strong>{subj.instructor}</strong>
                    </span>
                    {subj.department && (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {subj.department}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <strong>{subj.credits} University Credits</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-500" />
                      <strong>{subj.totalTopics} Syllabus Topics</strong>
                    </span>
                  </div>

                  {subj.currentTopic && (
                    <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/50 flex items-center gap-2 text-xs">
                      <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Live in Class:</span>
                      <span className="text-slate-600 dark:text-slate-400 truncate">{subj.currentTopic}</span>
                    </div>
                  )}
                </div>

                {/* Progress Box & Quick links */}
                <div className="w-full lg:w-72 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Classroom Pacing</span>
                    <span className="font-bold text-brand-blue text-sm">{subj.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full transition-all duration-500"
                      style={{ width: `${subj.progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {subj.completedTopics} of {subj.totalTopics} topics taught &bull; {Math.max(0, subj.totalTopics - subj.completedTopics)} remaining
                  </p>

                  <div className="pt-2 flex flex-col gap-2">
                    <Link to={`/portal/timeline?subjectId=${subj.id}`}>
                      <Button variant="secondary" size="sm" className="w-full text-xs">
                        View Topic Progression &rarr;
                      </Button>
                    </Link>
                    <Link to={`/portal/resources?subjectId=${subj.id}`}>
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        Subject Resources
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
