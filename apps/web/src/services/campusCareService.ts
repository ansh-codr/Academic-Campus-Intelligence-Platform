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
  AskCampusCareRequest,
  AskCampusCareResponse,
  AiAssistComplaintRequest,
  AiAssistComplaintResponse,
  CampusCareConversation,
  CampusCareMessage,
} from '@solvesphere/shared';

export const CampusCareService = {
  /**
   * Calls the secure server-side Cloud Function askCampusCareAi
   */
  async askCampusCare(request: AskCampusCareRequest): Promise<AskCampusCareResponse> {
    const askFn = httpsCallable<AskCampusCareRequest, AskCampusCareResponse>(
      functions,
      'askCampusCareAi'
    );
    const result = await askFn(request);
    return result.data;
  },

  /**
   * Calls the secure server-side Cloud Function aiAssistComplaint to enhance rough issue descriptions
   */
  async aiAssistComplaint(request: AiAssistComplaintRequest): Promise<AiAssistComplaintResponse> {
    const assistFn = httpsCallable<AiAssistComplaintRequest, AiAssistComplaintResponse>(
      functions,
      'aiAssistComplaint'
    );
    const result = await assistFn(request);
    return result.data;
  },

  /**
   * Loads recent chat conversations owned by the authenticated student.
   */
  async getConversations(userId: string): Promise<CampusCareConversation[]> {
    try {
      const q = query(
        collection(db, 'campusCareConversations'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampusCareConversation));
    } catch (err) {
      console.warn('Could not load campus care conversations:', err);
      return [];
    }
  },

  /**
   * Loads messages from a specific conversation subcollection.
   */
  async getConversationMessages(conversationId: string): Promise<CampusCareMessage[]> {
    try {
      const q = query(
        collection(db, 'campusCareConversations', conversationId, 'messages'),
        orderBy('timestamp', 'asc'),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampusCareMessage));
    } catch (err) {
      console.warn('Could not load campus care messages:', err);
      return [];
    }
  },

  /**
   * Deletes a conversation session.
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await deleteDoc(doc(db, 'campusCareConversations', conversationId));
  },
};
