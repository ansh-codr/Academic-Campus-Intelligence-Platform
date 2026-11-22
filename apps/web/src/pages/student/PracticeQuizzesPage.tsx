import React, { useEffect, useState } from 'react';
import { AcademicService } from '@/services/academicService';
import { Quiz, SanitizedQuizQuestion, QuizAttempt, QuizAnswerSubmission } from '@solvesphere/shared';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  BrainCircuit,
  CheckCircle2,
  Clock,
  HelpCircle,
  Award,
  Sparkles,
  ArrowRight,
  Info,
  RotateCcw,
  AlertCircle,
  XCircle,
  History,
} from 'lucide-react';

export const PracticeQuizzesPage: React.FC = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'QUIZ' | 'EXAM_PREP' | 'ATTEMPTS'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<SanitizedQuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestAttemptResult, setLatestAttemptResult] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [loadedQuizzes, userAttempts] = await Promise.all([
          AcademicService.getQuizzes(),
          user?.id ? AcademicService.getQuizAttempts(user.id) : Promise.resolve([]),
        ]);
        setQuizzes(loadedQuizzes);
        setAttempts(userAttempts);
        setLoadError(null);
      } catch (err: any) {
        console.error('Failed to load quizzes:', err);
        setLoadError(err?.message || 'Failed to load practice assessments.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user?.id]);

  // Timer countdown hook for active quiz
  useEffect(() => {
    if (!activeQuiz || timeLeftSeconds <= 0 || latestAttemptResult) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, timeLeftSeconds, latestAttemptResult]);

  const handleStartQuiz = async (quiz: Quiz) => {
    setIsSubmitting(true);
    try {
      const data = await AcademicService.getQuizQuestions(quiz.id);
      setActiveQuiz(quiz);
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setTimeLeftSeconds((quiz.durationMinutes || 15) * 60);
      setLatestAttemptResult(null);
    } catch (err) {
      console.error('Failed to start quiz:', err);
      alert('Could not initialize quiz questions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleAutoSubmit = () => {
    handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const submission: QuizAnswerSubmission[] = questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
      }));

      const res = await AcademicService.submitQuiz(activeQuiz.id, submission);
      setLatestAttemptResult(res.attempt);

      // Refresh attempts
      if (user?.id) {
        AcademicService.getQuizAttempts(user.id).then(setAttempts);
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      alert('Error submitting answers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseQuizModal = () => {
    setActiveQuiz(null);
    setQuestions([]);
    setLatestAttemptResult(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const filteredQuizzes = quizzes.filter((q) => {
    if (activeTab === 'ATTEMPTS') return false;
    if (activeTab !== 'ALL' && q.type !== activeTab) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" size="sm">Academic Practice Hub</Badge>
          <span className="text-xs text-slate-500 font-semibold">Continuous Assessment Readiness</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Practice &amp; Assessment Readiness
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Prepare with topic multiple-choice quizzes, server-graded practice simulators, and immediate conceptual reviews.
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
        {[
          { id: 'ALL', label: 'All Modules' },
          { id: 'QUIZ', label: 'MCQ Quizzes' },
          { id: 'EXAM_PREP', label: 'Midterm Readiness' },
          { id: 'ATTEMPTS', label: `My Attempts (${attempts.length})` },
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

      {/* Attempts View */}
      {activeTab === 'ATTEMPTS' ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-brand-blue" />
            Previous Assessment Attempts &amp; Scores
          </h3>

          {attempts.length === 0 ? (
            <EmptyState
              icon={<Award className="w-10 h-10" />}
              title="No quiz attempts recorded yet"
              description="Select any quiz from the modules above to test your knowledge."
              action={
                <Button size="sm" onClick={() => setActiveTab('ALL')}>
                  Browse Practice Modules
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {attempts.map((att) => (
                <Card key={att.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-brand-blue">{att.quizTitle}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(att.completedAt).toLocaleDateString()} at{' '}
                        {new Date(att.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Score: <strong>{att.score}</strong> of <strong>{att.totalQuestions}</strong> questions correct
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge
                      variant={att.percentage >= 70 ? 'green' : att.percentage >= 40 ? 'amber' : 'slate'}
                      size="sm"
                    >
                      {att.percentage}% Score
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <EmptyState
          icon={<HelpCircle className="w-10 h-10" />}
          title="No quizzes available"
          description="Check back later or browse other practice tabs."
        />
      ) : (
        /* Practice Modules Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((mod) => (
            <Card key={mod.id} hoverEffect className="p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <Badge
                    variant={mod.type === 'QUIZ' ? 'blue' : 'amber'}
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
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {mod.questionsCount} Questions
                  </span>
                </div>
              </div>

              <Button
                variant="gradient"
                size="sm"
                className="w-full text-xs"
                onClick={() => handleStartQuiz(mod)}
              >
                Launch Practice Simulator &rarr;
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Active Interactive Quiz Simulator Modal */}
      {activeQuiz && (
        <Modal
          isOpen={!!activeQuiz}
          onClose={handleCloseQuizModal}
          title={activeQuiz.title}
          description={latestAttemptResult ? 'Assessment Results & Review' : `Timed Assessment: ${formatTime(timeLeftSeconds)} remaining`}
        >
          {latestAttemptResult ? (
            /* Quiz Completed Review Screen */
            <div className="space-y-6 text-xs sm:text-sm">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-brand-cyan uppercase tracking-wider">Assessment Complete</span>
                  <h3 className="text-xl font-black text-white">
                    Your Score: {latestAttemptResult.score} / {latestAttemptResult.totalQuestions}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Recorded to your university student profile audit history.
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-black ${latestAttemptResult.percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {latestAttemptResult.percentage}%
                  </span>
                </div>
              </div>

              {/* Question Breakdown and Explanations */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                <h4 className="font-bold text-slate-900 dark:text-white">Question Review &amp; Explanations:</h4>
                {latestAttemptResult.answers.map((ans, idx) => (
                  <div
                    key={ans.questionId}
                    className={`p-4 rounded-xl border ${
                      ans.isCorrect
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                    } space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Question {idx + 1}: {ans.questionText}
                      </span>
                      {ans.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      {ans.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`px-3 py-1.5 rounded-lg ${
                            optIdx === ans.correctOptionIndex
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold'
                              : optIdx === ans.selectedOptionIndex
                              ? 'bg-red-500/20 text-red-700 dark:text-red-300 font-medium'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {opt} {optIdx === ans.correctOptionIndex && '✓ (Correct)'}
                          {optIdx === ans.selectedOptionIndex && optIdx !== ans.correctOptionIndex && '✗ (Your Choice)'}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                      <strong>Explanation:</strong> {ans.explanation}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button variant="secondary" size="sm" onClick={handleCloseQuizModal}>
                  Close Review
                </Button>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Clock className="w-8 h-8 mx-auto text-brand-blue animate-spin" />
              <p className="text-xs text-slate-400">Loading quiz questions...</p>
            </div>
          ) : (
            /* Live Question Form */
            <div className="space-y-6 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-brand-blue">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className={`font-mono font-bold ${timeLeftSeconds < 120 ? 'text-red-500 animate-pulse' : 'text-slate-700 dark:text-slate-300'}`}>
                  Time Remaining: {formatTime(timeLeftSeconds)}
                </span>
              </div>

              {/* Current Question */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                  {questions[currentQuestionIndex].questionText}
                </h4>

                <div className="space-y-2.5">
                  {questions[currentQuestionIndex].options.map((option, optIdx) => {
                    const isSelected = selectedAnswers[questions[currentQuestionIndex].id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(questions[currentQuestionIndex].id, optIdx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-brand-blue text-brand-blue dark:text-cyan-300 shadow-sm'
                            : 'bg-white dark:bg-brand-surfaceDark border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-brand-blue text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation and Submission Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                >
                  &larr; Previous
                </Button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  >
                    Next Question &rarr;
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleSubmitQuiz}
                  >
                    {isSubmitting ? 'Grading...' : 'Submit Assessment'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
