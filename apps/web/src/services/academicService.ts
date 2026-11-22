import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '@/lib/firebase';
import {
  SubjectSummary,
  SyllabusTopic,
  StudyResource,
  PracticeModule,
  Quiz,
  QuizAttempt,
  QuizAnswerSubmission,
  SanitizedQuizQuestion,
  StudentStudyProgress,
  TopicStatus,
} from '@solvesphere/shared';

export interface TimelineGroup {
  completed: SyllabusTopic[];
  ongoing: SyllabusTopic[];
  upcoming: SyllabusTopic[];
}

export const AcademicService = {
  /**
   * Retrieves all subjects and derives dynamic progress metrics from actual topics.
   */
  async getSubjects(): Promise<SubjectSummary[]> {
    try {
      const snap = await getDocs(collection(db, 'subjects'));
      if (!snap.empty) {
        const rawSubjects = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SubjectSummary));
        
        // Fetch topics to derive real dynamically calculated progress metrics
        const topicsSnap = await getDocs(collection(db, 'syllabusTopics'));
        const allTopics = topicsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as SyllabusTopic));

        return rawSubjects
          .filter((s) => !s.isArchived)
          .map((subj) => {
            const subjTopics = allTopics
              .filter((t) => t.subjectId === subj.id && !t.isArchived)
              .sort((a, b) => a.order - b.order);

            const total = subjTopics.length;
            const completed = subjTopics.filter((t) => t.status === 'COMPLETED').length;
            const current = subjTopics.find((t) => t.status === 'ONGOING')?.title || 'No active lecture';
            const next = subjTopics.find((t) => t.status === 'UPCOMING')?.title || 'End of syllabus';
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            return {
              ...subj,
              totalTopics: total || subj.totalTopics || 0,
              completedTopics: completed,
              currentTopic: current,
              nextTopic: next,
              progressPercentage: progress,
            };
          });
      }
    } catch (err) {
      console.error('Failed to fetch live subjects:', err);
      throw err;
    }
    return [];
  },

  async getSubjectById(subjectId: string): Promise<SubjectSummary | undefined> {
    const subjects = await this.getSubjects();
    return subjects.find((s) => s.id === subjectId || s.code.toLowerCase() === subjectId.toLowerCase());
  },

  /**
   * Retrieves syllabus topics grouped by completion status.
   */
  async getTimeline(subjectId?: string): Promise<TimelineGroup> {
    try {
      const topicsCol = collection(db, 'syllabusTopics');
      let q = query(topicsCol, orderBy('order', 'asc'));
      if (subjectId && subjectId !== 'ALL') {
        q = query(topicsCol, where('subjectId', '==', subjectId), orderBy('order', 'asc'));
      }
      const snap = await getDocs(q);
      if (!snap.empty) {
        const topics = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as SyllabusTopic))
          .filter((t) => !t.isArchived);

        return {
          completed: topics.filter((t) => t.status === 'COMPLETED'),
          ongoing: topics.filter((t) => t.status === 'ONGOING'),
          upcoming: topics.filter((t) => t.status === 'UPCOMING'),
        };
      }
    } catch (err) {
      console.error('Failed to fetch live syllabus timeline:', err);
      throw err;
    }
    return { completed: [], ongoing: [], upcoming: [] };
  },

  /**
   * Real-time subscription to syllabus topic pacing changes.
   */
  subscribeToTopics(subjectId: string | undefined, callback: (topics: SyllabusTopic[]) => void): Unsubscribe {
    const topicsCol = collection(db, 'syllabusTopics');
    let q = query(topicsCol, orderBy('order', 'asc'));
    if (subjectId && subjectId !== 'ALL') {
      q = query(topicsCol, where('subjectId', '==', subjectId), orderBy('order', 'asc'));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const topics = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as SyllabusTopic))
          .filter((t) => !t.isArchived);
        callback(topics);
      },
      (error) => {
        console.error('Error listening to topics:', error);
        callback([]);
      }
    );
  },

  /**
   * Retrieves study resources with filtering.
   */
  async getResources(filter?: { subjectId?: string; scope?: string; topicId?: string }): Promise<StudyResource[]> {
    try {
      const resCol = collection(db, 'resources');
      let q = query(resCol, orderBy('createdAt', 'desc'));

      if (filter?.subjectId && filter.subjectId !== 'ALL') {
        q = query(q, where('subjectId', '==', filter.subjectId));
      }
      if (filter?.scope && filter.scope !== 'ALL') {
        q = query(q, where('scope', '==', filter.scope));
      }
      if (filter?.topicId) {
        q = query(q, where('topicId', '==', filter.topicId));
      }

      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudyResource));
      }
    } catch (err) {
      console.error('Failed to fetch live resources:', err);
      throw err;
    }
    return [];
  },

  /**
   * Uploads an academic document/notes file to Firebase Storage and writes metadata to Firestore.
   */
  async uploadResource(
    file: File,
    metadata: {
      subjectId: string;
      topicId?: string;
      title: string;
      description: string;
      scope: 'WITHIN_SYLLABUS' | 'OUTSIDE_SYLLABUS';
      type: 'PDF' | 'VIDEO' | 'SLIDES' | 'NOTE' | 'PRACTICE_SHEET';
      facultyApproved: boolean;
      authorFaculty?: string;
      uploadedBy: string;
      uploadedById: string;
    }
  ): Promise<StudyResource> {
    const storagePath = `academic-resources/${metadata.subjectId}/${Date.now()}_${file.name}`;
    const storageReference = ref(storage, storagePath);

    // Upload to Firebase Storage
    await uploadBytes(storageReference, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: metadata.uploadedBy,
        subjectId: metadata.subjectId,
      },
    });

    const downloadUrl = await getDownloadURL(storageReference);
    const resourceRef = doc(collection(db, 'resources'));
    const resourceId = resourceRef.id;

    const resourceDoc: StudyResource = {
      id: resourceId,
      ...metadata,
      fileUrl: downloadUrl,
      storagePath,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(resourceRef, resourceDoc);
    return resourceDoc;
  },

  /**
   * Deletes a study resource record and its backing storage object.
   */
  async deleteResource(resourceId: string, storagePath?: string): Promise<void> {
    if (storagePath) {
      try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn('Could not delete storage file:', err);
      }
    }
    await deleteDoc(doc(db, 'resources', resourceId));
  },

  /**
   * Updates resource metadata (e.g. toggles faculty verification).
   */
  async updateResource(resourceId: string, updates: Partial<StudyResource>): Promise<void> {
    await updateDoc(doc(db, 'resources', resourceId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  // --------------------------------------------------------------------------
  // Quizzes & Practice Modules
  // --------------------------------------------------------------------------

  async getQuizzes(subjectId?: string): Promise<Quiz[]> {
    try {
      const col = collection(db, 'quizzes');
      let q = query(col, orderBy('createdAt', 'desc'));
      if (subjectId && subjectId !== 'ALL') {
        q = query(q, where('subjectId', '==', subjectId));
      }
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quiz));
      }
    } catch (err) {
      console.error('Failed to fetch live quizzes:', err);
      throw err;
    }
    return [];
  },

  /**
   * Fetches questions for a quiz securely via Cloud Function (strips answer keys).
   */
  async getQuizQuestions(quizId: string): Promise<{ quizId: string; title: string; durationMinutes: number; questions: SanitizedQuizQuestion[] }> {
    const getQuestionsFn = httpsCallable<{ quizId: string }, { quizId: string; title: string; durationMinutes: number; questions: SanitizedQuizQuestion[] }>(functions, 'getQuizQuestions');
    const result = await getQuestionsFn({ quizId });
    if (!result.data?.questions || result.data.questions.length === 0) {
      throw new Error('This quiz does not currently have published questions.');
    }
    return result.data;
  },

  /**
   * Submits answers to trusted Cloud Function for server-side score calculation and persistence.
   */
  async submitQuiz(quizId: string, answers: QuizAnswerSubmission[]): Promise<{ attempt: QuizAttempt }> {
    const submitFn = httpsCallable<{ quizId: string; answers: QuizAnswerSubmission[] }, { success: boolean; attempt: QuizAttempt }>(functions, 'submitQuiz');
    const result = await submitFn({ quizId, answers });
    if (!result.data?.success || !result.data.attempt) {
      throw new Error('Quiz submission could not be verified by the server.');
    }
    return { attempt: result.data.attempt };
  },

  /**
   * Retrieves student's previous quiz attempts from Firestore.
   */
  async getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    try {
      const q = query(
        collection(db, 'quizAttempts'),
        where('userId', '==', userId),
        orderBy('completedAt', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizAttempt));
    } catch (err) {
      console.warn('Error fetching quiz attempts:', err);
      return [];
    }
  },

  /**
   * Retrieves all student attempts for admin learning analytics.
   */
  async getAllStudentAttempts(): Promise<QuizAttempt[]> {
    try {
      const q = query(collection(db, 'quizAttempts'), orderBy('completedAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizAttempt));
    } catch (err) {
      console.warn('Error fetching all attempts:', err);
      return [];
    }
  },

  // --------------------------------------------------------------------------
  // Student Personal Study Progress Checklist
  // --------------------------------------------------------------------------

  async getStudentStudyProgress(userId: string): Promise<Record<string, boolean>> {
    try {
      const q = query(collection(db, 'studentStudyProgress'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const map: Record<string, boolean> = {};
      snap.docs.forEach((doc) => {
        const data = doc.data() as StudentStudyProgress;
        map[data.topicId] = data.completed;
      });
      return map;
    } catch (err) {
      console.warn('Error fetching study progress:', err);
      return {};
    }
  },

  async togglePersonalTopicStudy(userId: string, topicId: string, subjectId: string, completed: boolean): Promise<void> {
    const docId = `${userId}_${topicId}`;
    await setDoc(doc(db, 'studentStudyProgress', docId), {
      id: docId,
      userId,
      topicId,
      subjectId,
      completed,
      updatedAt: new Date().toISOString(),
    });
  },

  // --------------------------------------------------------------------------
  // Admin Operations
  // --------------------------------------------------------------------------

  async createSubject(subject: Omit<SubjectSummary, 'totalTopics' | 'completedTopics' | 'currentTopic' | 'nextTopic' | 'progressPercentage'>): Promise<void> {
    const subjId = subject.id || `subj-${subject.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    await setDoc(doc(db, 'subjects', subjId), {
      ...subject,
      id: subjId,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  async updateSubject(subjectId: string, updates: Partial<SubjectSummary>): Promise<void> {
    await updateDoc(doc(db, 'subjects', subjectId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async archiveSubject(subjectId: string, isArchived: boolean): Promise<void> {
    await updateDoc(doc(db, 'subjects', subjectId), {
      isArchived,
      updatedAt: new Date().toISOString(),
    });
  },

  async createTopic(topic: Omit<SyllabusTopic, 'id'> & { id?: string }): Promise<void> {
    const topicRef = topic.id ? doc(db, 'syllabusTopics', topic.id) : doc(collection(db, 'syllabusTopics'));
    await setDoc(topicRef, {
      ...topic,
      id: topicRef.id,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  async updateTopicStatus(topicId: string, status: TopicStatus, completedAt?: string): Promise<void> {
    const updateFn = httpsCallable<{ topicId: string; status: TopicStatus; completedAt?: string }, { success: boolean }>(functions, 'adminUpdateTopicStatus');
    const result = await updateFn({ topicId, status, completedAt });
    if (!result.data?.success) throw new Error('Server did not confirm syllabus status change.');
  },

  async deleteTopic(topicId: string): Promise<void> {
    await deleteDoc(doc(db, 'syllabusTopics', topicId));
  },
};
