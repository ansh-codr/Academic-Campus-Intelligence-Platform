import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  runTransaction,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '@/lib/firebase';
import {
  CampusTicket,
  IssueCluster,
  CampusClub,
  CreateTicketInput,
  AnonymousReport,
  TicketEvent,
} from '@solvesphere/shared';
import {
  FIXTURE_TICKETS,
  FIXTURE_CLUSTERS,
  FIXTURE_CLUBS,
} from '@/fixtures/campusFixtures';

export const CampusService = {
  /**
   * Create a complaint using Cloud Function or atomic Firestore transaction.
   * Generates atomic reference SS-2026-XXXX and records initial lifecycle event.
   */
  async createTicket(input: CreateTicketInput): Promise<{
    ticket: CampusTicket;
    isRemote: boolean;
  }> {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be logged in to submit a ticket.');

    try {
      // 1. Attempt Cloud Function callable (enforces server-side sequence & validation)
      const createComplaintFn = httpsCallable<{ data: CreateTicketInput }, { success: boolean; data: CampusTicket }>(
        functions,
        'createComplaint'
      );
      const res = await createComplaintFn(input as any);
      if (res.data?.success && res.data.data) {
        return { ticket: res.data.data, isRemote: true };
      }
    } catch (cfError) {
      console.warn('Cloud Function invocation notice, using direct Firestore transaction fallback:', cfError);
    }

    // 2. Direct Firestore Transaction Fallback (governed by Firestore Security Rules)
    const now = new Date().toISOString();
    const counterRef = doc(db, 'systemCounters', 'complaints');
    const newDocRef = doc(collection(db, 'complaints'));
    const ticketId = newDocRef.id;

    const createdTicket = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let nextSeq = 850;
      if (counterSnap.exists()) {
        nextSeq = (counterSnap.data()?.currentSequence || 850) + 1;
      }
      transaction.set(counterRef, { currentSequence: nextSeq }, { merge: true });

      const refNum = `SS-2026-${String(nextSeq).padStart(4, '0')}`;
      const submitterName = user.displayName || user.email || 'Student';

      const ticketData: Omit<CampusTicket, 'timeline'> = {
        id: ticketId,
        referenceNumber: refNum,
        title: input.title,
        category: input.category,
        building: input.building,
        floor: input.floor,
        room: input.room,
        description: input.description,
        priority: input.priority || 'MEDIUM',
        status: 'SUBMITTED',
        assignedDepartment: getDepartmentForCategory(input.category),
        submittedById: user.uid,
        submittedBy: submitterName,
        submittedAt: now,
        updatedAt: now,
      };

      transaction.set(newDocRef, ticketData);

      const eventRef = doc(collection(newDocRef, 'timeline'));
      const initialEvent: TicketEvent = {
        id: eventRef.id,
        ticketId,
        status: 'SUBMITTED',
        note: 'Issue submitted via SolveSphere Portal.',
        updatedBy: submitterName,
        timestamp: now,
      };
      transaction.set(eventRef, initialEvent);

      return {
        ...ticketData,
        timeline: [initialEvent],
      };
    });

    return { ticket: createdTicket, isRemote: true };
  },

  /**
   * Retrieve tickets from Firestore.
   * If userId is provided, queries owner tickets; otherwise queries all (admin).
   */
  async getTickets(userId?: string): Promise<CampusTicket[]> {
    try {
      const complaintsCol = collection(db, 'complaints');
      let q = query(complaintsCol, orderBy('createdAt', 'desc'));

      if (userId) {
        q = query(complaintsCol, where('submittedById', '==', userId));
      }

      const snap = await getDocs(q);
      if (!snap.empty) {
        const tickets: CampusTicket[] = [];
        for (const d of snap.docs) {
          const data = d.data();
          // Fetch timeline subcollection
          const timelineSnap = await getDocs(query(collection(d.ref, 'timeline'), orderBy('timestamp', 'asc')));
          const timeline: TicketEvent[] = timelineSnap.docs.map((t) => ({ id: t.id, ...t.data() } as TicketEvent));
          tickets.push({ id: d.id, ...data, timeline } as CampusTicket);
        }
        return tickets;
      }
    } catch (err) {
      console.warn('Firestore tickets fetch note (falling back to fixtures):', err);
    }

    return FIXTURE_TICKETS;
  },

  /**
   * Real-time Firestore Subscription for Tickets.
   * Automatically updates UI when ticket status transitions or new tickets arrive.
   */
  subscribeTickets(
    callback: (tickets: CampusTicket[]) => void,
    userId?: string
  ): () => void {
    const complaintsCol = collection(db, 'complaints');
    let q = query(complaintsCol);

    if (userId) {
      q = query(complaintsCol, where('submittedById', '==', userId));
    }

    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) {
          callback(FIXTURE_TICKETS);
          return;
        }

        const tickets: CampusTicket[] = [];
        for (const d of snap.docs) {
          const data = d.data();
          try {
            const timelineSnap = await getDocs(query(collection(d.ref, 'timeline'), orderBy('timestamp', 'asc')));
            const timeline = timelineSnap.docs.map((t) => ({ id: t.id, ...t.data() } as TicketEvent));
            tickets.push({ id: d.id, ...data, timeline } as CampusTicket);
          } catch {
            tickets.push({ id: d.id, ...data, timeline: data.timeline || [] } as CampusTicket);
          }
        }

        // Sort descending by submittedAt
        tickets.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        callback(tickets);
      },
      (error) => {
        console.warn('Firestore subscription notice, fallback to fixtures:', error);
        callback(FIXTURE_TICKETS);
      }
    );

    return unsubscribe;
  },

  /**
   * Retrieve Single Ticket by ID with its timeline subcollection
   */
  async getTicketById(ticketId: string): Promise<CampusTicket | null> {
    try {
      const docRef = doc(db, 'complaints', ticketId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const timelineSnap = await getDocs(query(collection(docRef, 'timeline'), orderBy('timestamp', 'asc')));
        const timeline = timelineSnap.docs.map((t) => ({ id: t.id, ...t.data() } as TicketEvent));
        return { id: snap.id, ...data, timeline } as CampusTicket;
      }
    } catch (err) {
      console.warn('Error fetching ticket by ID:', err);
    }
    return FIXTURE_TICKETS.find((t) => t.id === ticketId) || null;
  },

  /**
   * Retrieve AI Issue Clusters from Firestore
   */
  async getClusters(): Promise<IssueCluster[]> {
    try {
      const snap = await getDocs(collection(db, 'issueClusters'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as IssueCluster));
      }
    } catch {
      // ignore
    }
    return FIXTURE_CLUSTERS;
  },

  /**
   * Retrieve Campus Clubs from Firestore
   */
  async getClubs(): Promise<CampusClub[]> {
    try {
      const snap = await getDocs(collection(db, 'campusClubs'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampusClub));
      }
    } catch {
      // ignore
    }
    return FIXTURE_CLUBS;
  },

  /**
   * Speak Freely (Sensitive concerns)
   */
  async submitSpeakFreely(
    category: string,
    description: string
  ): Promise<AnonymousReport> {
    const trackingCode = `ANON-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const report: AnonymousReport = {
      id: `anon-${Date.now()}`,
      trackingCode,
      category,
      description,
      submittedAt: new Date().toISOString(),
      status: 'RECEIVED',
      privacyLevel: 'ANONYMOUS_UNVERIFIED_DEMO',
    };

    try {
      await setDoc(doc(db, 'anonymousReports', report.id), report);
    } catch {
      // ignore in demo
    }

    return report;
  },
};

function getDepartmentForCategory(cat: string): string {
  switch (cat) {
    case 'AC_HVAC':
      return 'HVAC & Climate Control';
    case 'WIFI_NETWORK':
      return 'IT & Campus Network Operations';
    case 'ELECTRICAL':
      return 'Electrical Maintenance';
    case 'WATER_SUPPLY':
      return 'Public Health & Plumbing';
    case 'HOSTEL':
      return 'Hostel Administration Office';
    case 'SANITATION':
      return 'Housekeeping & Sanitation';
    default:
      return 'Campus Estate & General Infrastructure';
  }
}
