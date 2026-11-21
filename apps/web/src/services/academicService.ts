import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SubjectSummary, SyllabusTopic, StudyResource, PracticeModule } from '@solvesphere/shared';
import {
  FIXTURE_SUBJECTS,
  FIXTURE_TOPICS,
  FIXTURE_RESOURCES,
  FIXTURE_PRACTICE_MODULES,
} from '@/fixtures/academicFixtures';

export interface TimelineGroup {
  completed: SyllabusTopic[];
  ongoing: SyllabusTopic[];
  upcoming: SyllabusTopic[];
}

export const AcademicService = {
  async getSubjects(): Promise<SubjectSummary[]> {
    try {
      const snap = await getDocs(collection(db, 'subjects'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SubjectSummary));
      }
    } catch {
      // Fallback to centralized fixtures
    }
    return FIXTURE_SUBJECTS;
  },

  async getSubjectById(subjectId: string): Promise<SubjectSummary | undefined> {
    const subjects = await this.getSubjects();
    return subjects.find((s) => s.id === subjectId || s.code.toLowerCase() === subjectId.toLowerCase());
  },

  async getTimeline(subjectId?: string): Promise<TimelineGroup> {
    try {
      const topicsCol = collection(db, 'syllabusTopics');
      let q = query(topicsCol, orderBy('order', 'asc'));
      if (subjectId) {
        q = query(topicsCol, where('subjectId', '==', subjectId), orderBy('order', 'asc'));
      }
      const snap = await getDocs(q);
      if (!snap.empty) {
        const topics = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SyllabusTopic));
        return {
          completed: topics.filter((t) => t.status === 'COMPLETED'),
          ongoing: topics.filter((t) => t.status === 'ONGOING'),
          upcoming: topics.filter((t) => t.status === 'UPCOMING'),
        };
      }
    } catch {
      // Fallback to centralized fixtures
    }

    let topics = FIXTURE_TOPICS;
    if (subjectId) {
      topics = topics.filter((t) => t.subjectId === subjectId);
    }

    return {
      completed: topics.filter((t) => t.status === 'COMPLETED'),
      ongoing: topics.filter((t) => t.status === 'ONGOING'),
      upcoming: topics.filter((t) => t.status === 'UPCOMING'),
    };
  },

  async getResources(filter?: { subjectId?: string; scope?: string }): Promise<StudyResource[]> {
    try {
      const resCol = collection(db, 'resources');
      let q = query(resCol);
      if (filter?.subjectId && filter.subjectId !== 'ALL') {
        q = query(q, where('subjectId', '==', filter.subjectId));
      }
      if (filter?.scope && filter.scope !== 'ALL') {
        q = query(q, where('scope', '==', filter.scope));
      }
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudyResource));
      }
    } catch {
      // Fallback
    }

    let resources = FIXTURE_RESOURCES;
    if (filter?.subjectId && filter.subjectId !== 'ALL') {
      resources = resources.filter((r) => r.subjectId === filter.subjectId);
    }
    if (filter?.scope && filter.scope !== 'ALL') {
      resources = resources.filter((r) => r.scope === filter.scope);
    }
    return resources;
  },

  async getPracticeModules(subjectId?: string): Promise<PracticeModule[]> {
    if (subjectId && subjectId !== 'ALL') {
      return FIXTURE_PRACTICE_MODULES.filter((m) => m.subjectId === subjectId);
    }
    return FIXTURE_PRACTICE_MODULES;
  },
};
