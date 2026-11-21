import React, { useState } from 'react';
import { FIXTURE_PRACTICE_MODULES } from '@/fixtures/academicFixtures';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  BrainCircuit,
  CheckCircle2,
  Clock,
  HelpCircle,
  MessageSquare,
  Mic,
  Award,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

export const PracticeQuizzesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'QUIZ' | 'EXAM_PREP' | 'GROUP_DISCUSSION' | 'EXTEMPORE'>('ALL');
  const [activeModalModule, setActiveModalModule] = useState<any | null>(null);

  const modules = FIXTURE_PRACTICE_MODULES.filter((m) => {
    if (activeTab !== 'ALL' && m.type !== activeTab) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" size="sm">Academic Practice Hub</Badge>
          <span className="text-xs text-slate-500 font-semibold">Continuous Assessment Preparation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Practice &amp; Assessment Readiness
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Prepare with topic multiple-choice quizzes, timed exam simulations, Group Discussion drills, and Extempore pitches.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
        {[
          { id: 'ALL', label: 'All Modules' },
          { id: 'QUIZ', label: 'MCQ Quizzes' },
          { id: 'EXAM_PREP', label: 'Midterm Readiness' },
          { id: 'GROUP_DISCUSSION', label: 'Group Discussions' },
          { id: 'EXTEMPORE', label: 'Extempore Speaking' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-brand-cardDark text-brand-blue shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Practice Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <Card key={mod.id} hoverEffect className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <Badge
                  variant={
                    mod.type === 'QUIZ'
                      ? 'blue'
                      : mod.type === 'EXAM_PREP'
                      ? 'amber'
                      : mod.type === 'GROUP_DISCUSSION'
                      ? 'green'
                      : 'cyan'
                  }
                  size="sm"
                >
                  {mod.type.replace('_', ' ')}
                </Badge>
                <span className="text-xs font-mono font-semibold text-slate-400">
                  {mod.difficulty}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {mod.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {mod.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {mod.durationMinutes} mins
                </span>
                {mod.questionCount && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {mod.questionCount} Questions
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              onClick={() => setActiveModalModule(mod)}
            >
              Launch Practice Simulator (Demo) &rarr;
            </Button>
          </Card>
        ))}
      </div>

      {/* Practice Simulator Modal Preview */}
      <Modal
        isOpen={!!activeModalModule}
        onClose={() => setActiveModalModule(null)}
        title={activeModalModule?.title || 'Practice Simulation'}
        description="Phase 1 Interactive Assessment Preview"
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-brand-blue flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Phase 1 Assessment Preview:</strong> Shows the format and timing mechanics. Live adaptive question banking and score analytics persist to PostgreSQL in Phase 2.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Sample Question 1 of 10
            </h4>
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              In a synchronous counter designed using JK flip-flops, why is the toggle condition (J=1, K=1) used for state transitions?
            </p>
            <div className="space-y-2 pt-1 text-xs">
              {[
                'A) Because it guarantees that the clock pulse propagates asynchronously',
                'B) Because it inverts the stored output bit on each active clock edge',
                'C) Because it clears the Q output to ground without reset pulse',
                'D) Because it forces race-around condition',
              ].map((opt, i) => (
                <div
                  key={opt}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                    i === 1
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-blue'
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setActiveModalModule(null)}>
              Exit Drill
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                alert('Drill completed! Sample score: 90% (9/10).');
                setActiveModalModule(null);
              }}
            >
              Submit &amp; View Explanations
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
