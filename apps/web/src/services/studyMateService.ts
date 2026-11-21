import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import {
  AskStudyMateRequest,
  AskStudyMateResponse,
  StudyMateConversation,
  StudyMateMessage,
} from '@solvesphere/shared';

export const StudyMateService = {
  /**
   * Calls the secure server-side Cloud Function askStudyMateAi
   */
  async askStudyMate(request: AskStudyMateRequest): Promise<AskStudyMateResponse> {
    const askFn = httpsCallable<AskStudyMateRequest, AskStudyMateResponse>(
      functions,
      'askStudyMateAi'
    );
    const result = await askFn(request);
    return result.data;
  },

  /**
   * Loads recent chat conversations owned by the authenticated student.
   */
  async getConversations(userId: string): Promise<StudyMateConversation[]> {
    try {
      const q = query(
        collection(db, 'studyMateConversations'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudyMateConversation));
    } catch (err) {
      console.warn('Could not load conversations:', err);
      return [];
    }
  },

  /**
   * Loads messages from a specific conversation subcollection.
   */
  async getConversationMessages(conversationId: string): Promise<StudyMateMessage[]> {
    try {
      const q = query(
        collection(db, 'studyMateConversations', conversationId, 'messages'),
        orderBy('timestamp', 'asc'),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudyMateMessage));
    } catch (err) {
      console.warn('Could not load messages:', err);
      return [];
    }
  },

  /**
   * Deletes a conversation session.
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await deleteDoc(doc(db, 'studyMateConversations', conversationId));
  },
};
