import React, { useEffect, useState } from 'react';
import { AcademicService } from '@/services/academicService';
import {
  SubjectSummary,
  SyllabusTopic,
  StudyResource,
  Quiz,
  QuizAttempt,
  TopicStatus,
  ResourceScope,
  ResourceType,
} from '@solvesphere/shared';
import { useAuth } from '@/hooks/useAuthDemo';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  BookOpen,
  CheckCircle,
  Edit3,
  Flame,
  Clock,
  Award,
  Plus,
  Trash2,
  UploadCloud,
  Layers,
  FileText,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Eye,
  Check,
} from 'lucide-react';

export const AdminAcademicManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'TOPICS' | 'RESOURCES' | 'QUIZZES' | 'ANALYTICS'>('SUBJECTS');
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isNewSubjectModalOpen, setIsNewSubjectModalOpen] = useState(false);
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState(false);
  const [isNewResourceModalOpen, setIsNewResourceModalOpen] = useState(false);
  const [isNewQuizModalOpen, setIsNewQuizModalOpen] = useState(false);

  // Subject Form
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjInstructor, setNewSubjInstructor] = useState('');
  const [newSubjDept, setNewSubjDept] = useState('Computer Science & AI');
  const [newSubjCredits, setNewSubjCredits] = useState(4);
  const [newSubjCategory, setNewSubjCategory] = useState<'CORE' | 'LAB' | 'HUMANITIES' | 'FOUNDATION'>('CORE');
  const [newSubjDesc, setNewSubjDesc] = useState('');

  // Topic Form
  const [newTopicUnit, setNewTopicUnit] = useState(1);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicHours, setNewTopicHours] = useState(4);
  const [newTopicOrder, setNewTopicOrder] = useState(1);
  const [newTopicStatus, setNewTopicStatus] = useState<TopicStatus>('UPCOMING');

  // Resource Form
  const [resTitle, setResTitle] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resScope, setResScope] = useState<ResourceScope>('WITHIN_SYLLABUS');
  const [resType, setResType] = useState<ResourceType>('PDF');
  const [resFacultyApproved, setResFacultyApproved] = useState(true);
  const [resFile, setResFile] = useState<File | null>(null);

  // Quiz Form
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizSubjectId, setQuizSubjectId] = useState('');
  const [quizDuration, setQuizDuration] = useState(15);
  const [quizDifficulty, setQuizDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [quizQuestions, setQuizQuestions] = useState<
    Array<{
      questionText: string;
      options: [string, string, string, string];
      correctOptionIndex: number;
      explanation: string;
    }>
  >([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: '',
    },
  ]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    loadAllAcademicData();
  }, []);

  const loadAllAcademicData = async () => {
    setIsLoading(true);
    try {
      const [loadedSubjs, loadedRes, loadedQuizzes, loadedAttempts] = await Promise.all([
        AcademicService.getSubjects(),
        AcademicService.getResources(),
        AcademicService.getQuizzes(),
        AcademicService.getAllStudentAttempts(),
      ]);
      setSubjects(loadedSubjs);
      setResources(loadedRes);
      setQuizzes(loadedQuizzes);
      setAttempts(loadedAttempts);
      setLoadError(null);

      if (loadedSubjs.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(loadedSubjs[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load academic records:', err);
      setLoadError(err?.message || 'Failed to load official academic records.');
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time listener for chosen subject's topics
  useEffect(() => {
    if (!selectedSubjectId) return;
    const unsub = AcademicService.subscribeToTopics(selectedSubjectId, setTopics);
    return () => unsub();
  }, [selectedSubjectId]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjCode || !newSubjName) return;
    try {
      await AcademicService.createSubject({
        id: `subj-${newSubjCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        code: newSubjCode.toUpperCase(),
        name: newSubjName,
        instructor: newSubjInstructor || 'Unassigned Faculty',
        department: newSubjDept,
        credits: Number(newSubjCredits),
        category: newSubjCategory,
        description: newSubjDesc,
        semester: 1,
        academicYear: '2026-2027',
      });
      setIsNewSubjectModalOpen(false);
      resetSubjectForm();
      loadAllAcademicData();
    } catch (err) {
      console.error('Failed to create subject:', err);
      alert('Could not save subject.');
    }
  };

  const resetSubjectForm = () => {
    setNewSubjCode('');
    setNewSubjName('');
    setNewSubjInstructor('');
    setNewSubjDesc('');
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !newTopicTitle) return;
    try {
      await AcademicService.createTopic({
        subjectId: selectedSubjectId,
        unit: Number(newTopicUnit),
        title: newTopicTitle,
        description: newTopicDesc,
        estimatedHours: Number(newTopicHours),
        order: Number(newTopicOrder),
        status: newTopicStatus,
        isCurrent: newTopicStatus === 'ONGOING',
        completedAt: newTopicStatus === 'COMPLETED' ? new Date().toISOString().split('T')[0] : undefined,
      });
      setIsNewTopicModalOpen(false);
      setNewTopicTitle('');
      setNewTopicDesc('');
    } catch (err) {
      console.error('Failed to create topic:', err);
      alert('Could not create topic.');
    }
  };

  const handleQuickStatusUpdate = async (topicId: string, status: TopicStatus) => {
    try {
      await AcademicService.updateTopicStatus(topicId, status);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Could not update topic status.');
    }
  };

  const handleDeleteTopic = async (topicId: string, title: string) => {
    if (!window.confirm(`Delete topic "${title}"? This cannot be undone.`)) return;
    try {
      await AcademicService.deleteTopic(topicId);
    } catch (err) {
      console.error('Failed to delete topic:', err);
      alert('Could not delete topic.');
    }
  };

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle || !resFile || !selectedSubjectId) {
      alert('Please provide a title, choose a subject, and select a file.');
      return;
    }
    try {
      setIsLoading(true);
      await AcademicService.uploadResource(resFile, {
        subjectId: selectedSubjectId,
        title: resTitle,
        description: resDesc,
        scope: resScope,
        type: resType,
        facultyApproved: resFacultyApproved,
        authorFaculty: user?.fullName || 'Department Faculty',
        uploadedBy: user?.fullName || 'Faculty Administrator',
        uploadedById: user?.id || 'admin',
      });
      setIsNewResourceModalOpen(false);
      setResTitle('');
      setResDesc('');
      setResFile(null);
      loadAllAcademicData();
    } catch (err) {
      console.error('Failed to upload resource:', err);
      alert('Upload failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFacultyApproval = async (res: StudyResource) => {
    try {
      await AcademicService.updateResource(res.id, {
        facultyApproved: !res.facultyApproved,
      });
      loadAllAcademicData();
    } catch (err) {
      console.error('Failed to update approval:', err);
    }
  };

  const handleDeleteResource = async (res: StudyResource) => {
    if (!window.confirm(`Delete resource "${res.title}"?`)) return;
    try {
      await AcademicService.deleteResource(res.id, res.storagePath);
      loadAllAcademicData();
    } catch (err) {
      console.error('Failed to delete resource:', err);
      alert('Could not delete resource.');
    }
  };

  const handleDeleteSubject = async (subjId: string, name: string) => {
    if (!window.confirm(`Delete subject "${name}"? This removes the subject from the course directory.`)) return;
    try {
      await AcademicService.deleteSubject(subjId);
      loadAllAcademicData();
    } catch (err: any) {
      console.error('Failed to delete subject:', err);
      alert(err?.message || 'Could not delete subject.');
    }
  };

  const handleDeleteQuiz = async (quizId: string, title: string) => {
    if (!window.confirm(`Delete practice quiz "${title}" and all associated questions?`)) return;
    try {
      await AcademicService.deleteQuiz(quizId);
      loadAllAcademicData();
    } catch (err: any) {
      console.error('Failed to delete quiz:', err);
      alert(err?.message || 'Could not delete quiz.');
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      alert('Quiz title is required.');
      return;
    }
    const targetSubjId = quizSubjectId || selectedSubjectId || (subjects[0]?.id || '');
    if (!targetSubjId) {
      alert('Please select a course for this quiz.');
      return;
    }

    const validQuestions = quizQuestions.filter((q) => q.questionText.trim().length > 0);
    if (validQuestions.length === 0) {
      alert('Please add at least one question with text and options.');
      return;
    }

    try {
      setIsLoading(true);
      await AcademicService.saveQuiz(
        {
          subjectId: targetSubjId,
          title: quizTitle.trim(),
          description: quizDesc.trim() || 'Official continuous practice assessment.',
          durationMinutes: Number(quizDuration) || 15,
          difficulty: quizDifficulty,
          type: 'QUIZ',
          published: true,
        },
        validQuestions.map((q, idx) => ({
          questionText: q.questionText.trim(),
          options: q.options.map((opt, i) => opt.trim() || `Option ${String.fromCharCode(65 + i)}`),
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation.trim() || 'Official faculty explanation.',
          order: idx + 1,
        }))
      );

      setIsNewQuizModalOpen(false);
      setQuizTitle('');
      setQuizDesc('');
      setQuizQuestions([
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          explanation: '',
        },
      ]);
      loadAllAcademicData();
    } catch (err: any) {
      console.error('Failed to save quiz:', err);
      alert(err?.message || 'Could not save quiz.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="amber" size="sm">Academic Affairs Console</Badge>
            <span className="text-xs text-slate-400 font-semibold">Faculty &amp; Curriculum Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Academic Management &amp; Course Controls
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time curriculum management, topic status sequencing, resource repository curation, and assessment readiness.
          </p>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-200 text-xs sm:text-sm flex items-center justify-between"
        >
          <span>{loadError}</span>
          <Button size="sm" variant="outline" onClick={loadAllAcademicData} className="border-red-500/30 text-red-300">
            Retry
          </Button>
        </div>
      )}

      {/* Control Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
        {[
          { id: 'SUBJECTS', label: `Subjects (${subjects.length})` },
          { id: 'TOPICS', label: 'Syllabus Topics' },
          { id: 'RESOURCES', label: `Resources (${resources.length})` },
          { id: 'QUIZZES', label: `Assessments (${quizzes.length})` },
          { id: 'ANALYTICS', label: `Student Analytics (${attempts.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 1: SUBJECT MANAGEMENT                                              */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'SUBJECTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Registered Courses &amp; Modules</h3>
              <p className="text-xs text-slate-400">Manage course codes, assigned faculty, credits, and pacing.</p>
            </div>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => setIsNewSubjectModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Course
            </Button>
          </div>

          {subjects.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-10 h-10" />}
              title="No academic subjects registered"
              description="Register the university's accredited courses using the button above."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subj) => (
                <Card key={subj.id} className="p-6 bg-slate-950 border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-amber-400">{subj.code}</span>
                      <Badge variant="amber" size="sm">{subj.progressPercentage}% Taught</Badge>
                    </div>
                    <h4 className="text-lg font-bold text-white">{subj.name}</h4>
                    <p className="text-xs text-slate-400">{subj.description}</p>
                    <div className="text-xs text-slate-500 pt-2 space-y-1">
                      <div>Faculty: <strong className="text-slate-300">{subj.instructor}</strong></div>
                      <div>Department: <strong className="text-slate-300">{subj.department}</strong></div>
                      <div>Credits: <strong className="text-slate-300">{subj.credits} Credits</strong></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-900 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs text-amber-400 border-slate-800 bg-slate-900 hover:bg-slate-800"
                      onClick={() => {
                        setSelectedSubjectId(subj.id);
                        setActiveTab('TOPICS');
                      }}
                    >
                      Manage Topics &rarr;
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
                      onClick={() => handleDeleteSubject(subj.id, subj.name)}
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 2: SYLLABUS TOPICS MANAGEMENT                                      */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'TOPICS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase">Select Course:</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="gradient"
              size="sm"
              onClick={() => setIsNewTopicModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Topic
            </Button>
          </div>

          {topics.length === 0 ? (
            <EmptyState
              icon={<Layers className="w-10 h-10" />}
              title="No topics listed for this course"
              description="Add the first syllabus topic using the button above."
            />
          ) : (
            <div className="space-y-3">
              {topics.map((t) => (
                <Card
                  key={t.id}
                  className="p-5 bg-slate-950 border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={t.status === 'COMPLETED' ? 'green' : t.status === 'ONGOING' ? 'blue' : 'slate'}
                        size="sm"
                      >
                        {t.status}
                      </Badge>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Unit {t.unit} &bull; Order #{t.order}
                      </span>
                      {t.completedAt && (
                        <span className="text-xs text-emerald-400">
                          (Finished: {t.completedAt})
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-white">{t.title}</h4>
                    <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">{t.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => handleQuickStatusUpdate(t.id, 'ONGOING')}
                        title="Mark Ongoing"
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          t.status === 'ONGOING'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => handleQuickStatusUpdate(t.id, 'COMPLETED')}
                        title="Mark Completed"
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          t.status === 'COMPLETED'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleQuickStatusUpdate(t.id, 'UPCOMING')}
                        title="Mark Upcoming"
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          t.status === 'UPCOMING'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Next
                      </button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
                      onClick={() => handleDeleteTopic(t.id, t.title)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 3: STUDY RESOURCE REPOSITORY                                       */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'RESOURCES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Curated Course Documents &amp; Notes</h3>
              <p className="text-xs text-slate-400">Directly upload verified slides and PDF problem sets.</p>
            </div>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => setIsNewResourceModalOpen(true)}
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1" />
              Upload Resource
            </Button>
          </div>

          {resources.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-10 h-10" />}
              title="No resources uploaded"
              description="Upload course slides, syllabus guides, or problem sets using the button above."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((res) => (
                <Card key={res.id} className="p-5 bg-slate-950 border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <Badge variant={res.scope === 'WITHIN_SYLLABUS' ? 'blue' : 'amber'} size="sm">
                        {res.scope.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs font-mono font-bold text-slate-400">{res.type}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{res.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{res.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-900 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant={res.facultyApproved ? 'secondary' : 'outline'}
                      className={`text-xs ${res.facultyApproved ? 'text-emerald-400' : 'text-slate-400'}`}
                      onClick={() => handleToggleFacultyApproval(res)}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      {res.facultyApproved ? 'Approved' : 'Verify'}
                    </Button>

                    <div className="flex items-center gap-1">
                      {res.fileUrl && (
                        <a href={res.fileUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost" className="text-xs text-brand-blue">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
                        onClick={() => handleDeleteResource(res)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 4: QUIZ & ASSESSMENT MANAGEMENT                                    */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'QUIZZES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Multiple-Choice Question Banks</h3>
              <p className="text-xs text-slate-400">Configure continuous assessments and timed practice drills.</p>
            </div>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => setIsNewQuizModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create Quiz
            </Button>
          </div>

          {quizzes.length === 0 ? (
            <EmptyState
              icon={<HelpCircle className="w-10 h-10" />}
              title="No assessments configured"
              description="Create continuous assessments and practice drills with the button above."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((q) => (
                <Card key={q.id} className="p-5 bg-slate-950 border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <Badge variant={q.published ? 'green' : 'slate'} size="sm">
                        {q.published ? 'Published' : 'Draft'}
                      </Badge>
                      <span className="text-xs font-mono text-slate-400">{q.durationMinutes} mins</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{q.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{q.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-900 flex justify-between items-center text-xs">
                    <span className="text-slate-400">{q.questionsCount} Questions</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="amber" size="sm">{q.difficulty}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/40 p-1 h-auto"
                        onClick={() => handleDeleteQuiz(q.id, q.title)}
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 5: STUDENT LEARNING ANALYTICS                                      */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Cohort Practice Performance Logs</h3>
            <p className="text-xs text-slate-400">Directly audited assessment submissions from student sessions.</p>
          </div>

          {attempts.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="w-10 h-10" />}
              title="No quiz attempts recorded yet"
              description="Student assessment scores will populate here as students complete practice quizzes."
            />
          ) : (
            <Card className="p-0 overflow-hidden bg-slate-950 border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Assessment</th>
                      <th className="p-3.5">Score</th>
                      <th className="p-3.5">Percentage</th>
                      <th className="p-3.5">Completed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {attempts.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-900/40">
                        <td className="p-3.5 font-bold text-white">{att.studentName}</td>
                        <td className="p-3.5 text-slate-300">{att.quizTitle}</td>
                        <td className="p-3.5 font-mono text-amber-400">{att.score} / {att.totalQuestions}</td>
                        <td className="p-3.5">
                          <Badge variant={att.percentage >= 70 ? 'green' : 'amber'} size="sm">
                            {att.percentage}%
                          </Badge>
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {new Date(att.completedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL: ADD COURSE                                                      */}
      {/* ---------------------------------------------------------------------- */}
      {isNewSubjectModalOpen && (
        <Modal
          isOpen={isNewSubjectModalOpen}
          onClose={() => setIsNewSubjectModalOpen(false)}
          title="Add New Academic Course"
          description="Register a course code, syllabus container, and faculty lead."
        >
          <form onSubmit={handleCreateSubject} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Course Code</label>
                <Input
                  placeholder="e.g. CS102"
                  value={newSubjCode}
                  onChange={(e) => setNewSubjCode(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">Credits</label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={newSubjCredits}
                  onChange={(e) => setNewSubjCredits(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Course Name</label>
              <Input
                placeholder="e.g. Data Structures & Algorithms"
                value={newSubjName}
                onChange={(e) => setNewSubjName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Faculty Lead / Instructor</label>
              <Input
                placeholder="e.g. Dr. Jane Doe"
                value={newSubjInstructor}
                onChange={(e) => setNewSubjInstructor(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Course Description</label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Curriculum scope, prerequisites, and learning objectives..."
                value={newSubjDesc}
                onChange={(e) => setNewSubjDesc(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsNewSubjectModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" type="submit">
                Save Course
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL: ADD SYLLABUS TOPIC                                              */}
      {/* ---------------------------------------------------------------------- */}
      {isNewTopicModalOpen && (
        <Modal
          isOpen={isNewTopicModalOpen}
          onClose={() => setIsNewTopicModalOpen(false)}
          title="Add Syllabus Topic"
          description="Introduce a unit lesson into the curriculum sequence."
        >
          <form onSubmit={handleCreateTopic} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Unit / Module #</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={newTopicUnit}
                  onChange={(e) => setNewTopicUnit(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">Display Order</label>
                <Input
                  type="number"
                  min={1}
                  value={newTopicOrder}
                  onChange={(e) => setNewTopicOrder(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Topic Title</label>
              <Input
                placeholder="e.g. Backpropagation and Loss Functions"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Topic Description</label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Concepts covered in this lecture..."
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Initial Status</label>
              <select
                value={newTopicStatus}
                onChange={(e) => setNewTopicStatus(e.target.value as TopicStatus)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="ONGOING">Currently Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsNewTopicModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" type="submit">
                Add to Syllabus
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL: UPLOAD STUDY RESOURCE                                           */}
      {/* ---------------------------------------------------------------------- */}
      {isNewResourceModalOpen && (
        <Modal
          isOpen={isNewResourceModalOpen}
          onClose={() => setIsNewResourceModalOpen(false)}
          title="Upload Study Resource"
          description="Upload slides, PDF notes, or practice problem sets."
        >
          <form onSubmit={handleUploadResource} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Resource Title</label>
              <Input
                placeholder="e.g. Lecture 4 Slides: State Minimization"
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Scope</label>
                <select
                  value={resScope}
                  onChange={(e) => setResScope(e.target.value as ResourceScope)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
                >
                  <option value="WITHIN_SYLLABUS">Within Syllabus</option>
                  <option value="OUTSIDE_SYLLABUS">Outside Syllabus</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">Resource Type</label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value as ResourceType)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
                >
                  <option value="PDF">PDF</option>
                  <option value="SLIDES">Slides</option>
                  <option value="NOTE">Note</option>
                  <option value="PRACTICE_SHEET">Practice Sheet</option>
                  <option value="VIDEO">Video Link</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">File Attachment</label>
              <input
                type="file"
                onChange={(e) => setResFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-800 file:text-white file:font-semibold hover:file:bg-slate-700"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Description / Abstract</label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Resource synopsis..."
                value={resDesc}
                onChange={(e) => setResDesc(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="modal-faculty-approved"
                checked={resFacultyApproved}
                onChange={(e) => setResFacultyApproved(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="modal-faculty-approved" className="font-semibold text-slate-300 cursor-pointer">
                Mark as Official Faculty Approved Resource
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsNewResourceModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" type="submit" disabled={isLoading}>
                {isLoading ? 'Uploading...' : 'Upload & Publish'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL: CREATE QUIZ                                                     */}
      {/* ---------------------------------------------------------------------- */}
      {isNewQuizModalOpen && (
        <Modal
          isOpen={isNewQuizModalOpen}
          onClose={() => setIsNewQuizModalOpen(false)}
          title="Create Practice Assessment"
          description="Provision a multiple-choice practice quiz with trusted server-side answers."
        >
          <form onSubmit={handleSaveQuiz} className="space-y-4 text-xs sm:text-sm max-h-[75vh] overflow-y-auto pr-1">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Target Academic Course</label>
              <select
                value={quizSubjectId || selectedSubjectId}
                onChange={(e) => setQuizSubjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
                required
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Quiz Title</label>
              <Input
                placeholder="e.g. Unit 2 Midterm Readiness Quiz"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Description</label>
              <Input
                placeholder="Assessment scope and guidelines..."
                value={quizDesc}
                onChange={(e) => setQuizDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Duration (Minutes)</label>
                <Input
                  type="number"
                  min={1}
                  value={quizDuration}
                  onChange={(e) => setQuizDuration(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">Difficulty</label>
                <select
                  value={quizDifficulty}
                  onChange={(e) => setQuizDifficulty(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  Questions ({quizQuestions.length})
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    setQuizQuestions((prev) => [
                      ...prev,
                      {
                        questionText: '',
                        options: ['', '', '', ''],
                        correctOptionIndex: 0,
                        explanation: '',
                      },
                    ])
                  }
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Another Question
                </Button>
              </div>

              {quizQuestions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-amber-400">Question {qIdx + 1}</h5>
                    {quizQuestions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 p-1 h-auto"
                        onClick={() =>
                          setQuizQuestions((prev) => prev.filter((_, idx) => idx !== qIdx))
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Enter question text..."
                    value={q.questionText}
                    onChange={(e) => {
                      const next = [...quizQuestions];
                      next[qIdx] = { ...next[qIdx], questionText: e.target.value };
                      setQuizQuestions(next);
                    }}
                    required
                  />

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400">Options (Select correct radio)</label>
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`quiz-correct-${qIdx}`}
                          checked={q.correctOptionIndex === optIdx}
                          onChange={() => {
                            const next = [...quizQuestions];
                            next[qIdx] = { ...next[qIdx], correctOptionIndex: optIdx };
                            setQuizQuestions(next);
                          }}
                          className="text-amber-500"
                        />
                        <Input
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          value={opt}
                          onChange={(e) => {
                            const next = [...quizQuestions];
                            const nextOpts = [...next[qIdx].options] as [string, string, string, string];
                            nextOpts[optIdx] = e.target.value;
                            next[qIdx] = { ...next[qIdx], options: nextOpts };
                            setQuizQuestions(next);
                          }}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 block mb-1 text-[11px]">Explanation / Correct Answer Note</label>
                    <Input
                      placeholder="Rationale revealed to student after grading..."
                      value={q.explanation}
                      onChange={(e) => {
                        const next = [...quizQuestions];
                        next[qIdx] = { ...next[qIdx], explanation: e.target.value };
                        setQuizQuestions(next);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsNewQuizModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save & Publish Assessment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
