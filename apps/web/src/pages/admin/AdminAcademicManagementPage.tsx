import React, { useEffect, useState } from 'react';
import { AcademicService } from '@/services/academicService';
import { SubjectSummary } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BookOpen, CheckCircle, Edit3, Flame, Clock, Award, Info } from 'lucide-react';

export const AdminAcademicManagementPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);

  useEffect(() => {
    AcademicService.getSubjects().then(setSubjects);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="amber" size="sm">Academic Affairs</Badge>
          <span className="text-xs text-slate-400 font-semibold">Curriculum Coordination</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          Academic Management &amp; Topic Controls
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Faculty and department chairs can mark syllabus topics completed and verify published study resources.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <strong>Phase 1 Full-Stack Notice:</strong> This interface displays academic course orchestration for faculty coordinators. Live syllabus mutation endpoints and audit authorization will connect in Phase 2.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map((subj) => (
          <Card key={subj.id} className="p-6 bg-slate-950 border-slate-800 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-bold text-amber-400">{subj.code}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{subj.name}</h3>
                <p className="text-xs text-slate-400">Instructor: {subj.instructor}</p>
              </div>
              <Badge variant="amber" size="sm">{subj.progressPercentage}% Completed</Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">Active in Class:</span>
                <span className="truncate">{subj.currentTopic}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Next Topic:</span>
                <span className="truncate">{subj.nextTopic}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs text-amber-400 border-slate-700 bg-slate-900"
                onClick={() => alert(`[Demo] Pacing update initiated for ${subj.code}.`)}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Update Syllabus Pacing (Demo)
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
