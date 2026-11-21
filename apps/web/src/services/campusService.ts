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
  updateDoc,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, functions, auth, storage } from '@/lib/firebase';
import {
  CampusTicket,
  IssueCluster,
  CampusClub,
  CampusDepartment,
  CampusNotification,
  CreateTicketInput,
  AnonymousReport,
  TicketEvent,
} from '@solvesphere/shared';
import {
  FIXTURE_TICKETS,
  FIXTURE_CLUSTERS,
  FIXTURE_CLUBS,
  FIXTURE_DEPARTMENTS,
} from '@/fixtures/campusFixtures';

export const CampusService = {
  /**
   * Upload an attachment file for a complaint to Firebase Storage.
   * Path: attachments/{userId}/{ticketId}/{fileName}
   */
  async uploadAttachment(
    file: File,
    ticketId: string = `draft-${Date.now()}`
  ): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated to upload files.');

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds the 10MB maximum limit.');
    }

    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storageRef = ref(storage, `attachments/${user.uid}/${ticketId}/${safeFileName}`);

    await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
    });

    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  },

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

      const ticketData: Record<string, any> = {
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

      if (input.attachmentUrls && input.attachmentUrls.length > 0) {
        ticketData.attachmentUrls = input.attachmentUrls;
      }

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
      } as CampusTicket;
    });

    return { ticket: createdTicket, isRemote: true };
  },

  /**
   * Reopen a resolved or closed ticket
   */
  async reopenTicket(ticketId: string, reason: string): Promise<void> {
    try {
      const reopenFn = httpsCallable<{ ticketId: string; reason: string }, any>(
        functions,
        'reopenTicket'
      );
      await reopenFn({ ticketId, reason });
      return;
    } catch (cfErr) {
      console.warn('reopenTicket Cloud Function fallback to direct Firestore:', cfErr);
    }

    const ticketRef = doc(db, 'complaints', ticketId);
    const now = new Date().toISOString();
    const user = auth.currentUser;
    const submitterName = user?.displayName || user?.email || 'Student';

    await updateDoc(ticketRef, {
      status: 'REOPENED',
      updatedAt: now,
    });

    const eventRef = doc(collection(ticketRef, 'timeline'));
    await setDoc(eventRef, {
      id: eventRef.id,
      ticketId,
      status: 'REOPENED',
      note: `Ticket reopened: ${reason}`,
      updatedBy: submitterName,
      timestamp: now,
    });
  },

  /**
   * Retrieve tickets from Firestore.
   * If userId is provided, queries owner tickets; otherwise queries all (admin).
   */
  async getTickets(userId?: string): Promise<CampusTicket[]> {
    try {
      const complaintsCol = collection(db, 'complaints');
      let q = query(complaintsCol, orderBy('submittedAt', 'desc'));

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
        tickets.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
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

        tickets.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        callback(tickets);
      },
      (error) => {
        console.warn('Firestore tickets subscription notice, fallback to fixtures:', error);
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
   * Retrieve Departments from Firestore with fallback
   */
  async getDepartments(): Promise<CampusDepartment[]> {
    try {
      const snap = await getDocs(collection(db, 'departments'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampusDepartment));
      }
    } catch {
      // ignore
    }
    return FIXTURE_DEPARTMENTS;
  },

  /**
   * Real-time Firestore Subscription for Departments
   */
  subscribeDepartments(callback: (departments: CampusDepartment[]) => void): () => void {
    return onSnapshot(
      collection(db, 'departments'),
      (snap) => {
        if (!snap.empty) {
          const depts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampusDepartment));
          callback(depts);
        } else {
          callback(FIXTURE_DEPARTMENTS);
        }
      },
      () => callback(FIXTURE_DEPARTMENTS)
    );
  },

  /**
   * Retrieve Issue Clusters from Firestore
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
   * Real-time Firestore Subscription for Issue Clusters
   */
  subscribeClusters(callback: (clusters: IssueCluster[]) => void): () => void {
    return onSnapshot(
      collection(db, 'issueClusters'),
      (snap) => {
        if (!snap.empty) {
          const clusters = snap.docs.map((d) => ({ id: d.id, ...d.data() } as IssueCluster));
          callback(clusters);
        } else {
          callback(FIXTURE_CLUSTERS);
        }
      },
      () => callback(FIXTURE_CLUSTERS)
    );
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
   * Real-time Firestore Subscription for Campus Clubs
   */
  subscribeClubs(callback: (clubs: CampusClub[]) => void): () => void {
    return onSnapshot(
      collection(db, 'campusClubs'),
      (snap) => {
        if (!snap.empty) {
          const clubs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampusClub));
          callback(clubs.filter((c) => !c.isArchived));
        } else {
          callback(FIXTURE_CLUBS);
        }
      },
      () => callback(FIXTURE_CLUBS)
    );
  },

  /**
   * Real-time Firestore Subscription for User In-App Notifications
   */
  subscribeNotifications(
    userId: string,
    callback: (notifications: CampusNotification[]) => void
  ): () => void {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snap) => {
        const notifs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampusNotification));
        notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(notifs);
      },
      (error) => {
        console.warn('Notifications subscription error:', error);
        callback([]);
      }
    );
  },

  /**
   * Mark a single notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      });
    } catch (err) {
      console.warn('Error marking notification read:', err);
    }
  },

  /**
   * Mark all unread notifications as read for current user
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const snap = await getDocs(q);
      if (snap.empty) return;

      const batch = writeBatch(db);
      for (const d of snap.docs) {
        batch.update(d.ref, { read: true });
      }
      await batch.commit();
    } catch (err) {
      console.warn('Error marking all notifications read:', err);
    }
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
