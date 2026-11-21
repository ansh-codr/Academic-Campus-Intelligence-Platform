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
  downloadCount?: number;
  createdAt: string;
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
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  subjectId: string;
}

export interface PracticeModule {
  id: string;
  subjectId: string;
  title: string;
  type: 'QUIZ' | 'EXAM_PREP' | 'GROUP_DISCUSSION' | 'EXTEMPORE';
  durationMinutes: number;
  questionCount?: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  description: string;
}
