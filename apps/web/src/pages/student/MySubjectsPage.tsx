import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AcademicService } from '@/services/academicService';
import { SubjectSummary } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BookOpen, UserCheck, Award, Layers, FileText, ArrowRight } from 'lucide-react';

export const MySubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);

  useEffect(() => {
    AcademicService.getSubjects().then(setSubjects);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" size="sm">Course Directory</Badge>
          <span className="text-xs text-slate-500 font-semibold">Semester 1 Enrolled Curricula</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          My Six First-Year Subjects
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Complete syllabus structure, course credits, and assigned department faculty.
        </p>
      </div>

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
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <strong>{subj.credits} University Credits</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-500" />
                    <strong>{subj.totalTopics} Syllabus Units</strong>
                  </span>
                </div>
              </div>

              {/* Progress Box & Quick links */}
              <div className="w-full lg:w-72 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Completion</span>
                  <span className="font-bold text-brand-blue text-sm">{subj.progressPercentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full"
                    style={{ width: `${subj.progressPercentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {subj.completedTopics} of {subj.totalTopics} topics taught &bull; {subj.totalTopics - subj.completedTopics} remaining
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
    </div>
  );
};
