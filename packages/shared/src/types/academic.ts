export type TopicStatus = 'COMPLETED' | 'ONGOING' | 'UPCOMING';

export interface SyllabusTopic {
  id: string;
  subjectId: string;
  unit: number;
  title: string;
  description: string;
  status: TopicStatus;
  order: number;
  estimatedHours?: number;
  completedAt?: string;
  isCurrent?: boolean;
  isArchived?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export type ResourceScope = 'WITHIN_SYLLABUS' | 'OUTSIDE_SYLLABUS';
export type ResourceType = 'PDF' | 'VIDEO' | 'SLIDES' | 'NOTE' | 'PRACTICE_SHEET';

export interface StudyResource {
  id: string;
  subjectId: string;
  topicId?: string;
  title: string;
  description: string;
  scope: ResourceScope;
  type: ResourceType;
  facultyApproved: boolean;
  authorFaculty?: string;
  fileUrl?: string;
  storagePath?: string;
  downloadCount?: number;
  uploadedBy?: string;
  uploadedById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SubjectSummary {
  id: string;
  code: string;
  name: string;
  instructor: string;
  credits: number;
  totalTopics: number;
  completedTopics: number;
  currentTopic: string;
  nextTopic: string;
  progressPercentage: number;
  category: 'CORE' | 'LAB' | 'HUMANITIES' | 'FOUNDATION';
  description: string;
  semester?: number;
  academicYear?: string;
  department?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizQuestion {
  id: string;
  quizId?: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  subjectId?: string;
}

export interface SanitizedQuizQuestion {
  id: string;
  quizId?: string;
  questionText: string;
  options: string[];
  subjectId?: string;
}

export type QuizType = 'QUIZ' | 'EXAM_PREP' | 'GROUP_DISCUSSION' | 'EXTEMPORE';
export type QuizDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Quiz {
  id: string;
  subjectId: string;
  topicId?: string;
  title: string;
  description: string;
  type: QuizType;
  durationMinutes: number;
  difficulty: QuizDifficulty;
  published: boolean;
  questionsCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PracticeModule {
  id: string;
  subjectId: string;
  title: string;
  type: QuizType;
  durationMinutes: number;
  questionCount?: number;
  difficulty: QuizDifficulty;
  description: string;
  published?: boolean;
}

export interface QuizAnswerSubmission {
  questionId: string;
  selectedOptionIndex: number;
}

export interface QuizAnswerReview {
  questionId: string;
  questionText: string;
  options: string[];
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: QuizAnswerReview[];
  completedAt: string;
}

export interface StudentStudyProgress {
  id: string;
  userId: string;
  topicId: string;
  subjectId: string;
  completed: boolean;
  updatedAt: string;
}
