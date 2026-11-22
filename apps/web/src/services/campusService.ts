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
  PublicCampusIncident,
  CampusClub,
  CampusDepartment,
  CampusNotification,
  CreateTicketInput,
  AnonymousReport,
  TicketEvent,
} from '@solvesphere/shared';

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
   * Create a complaint exclusively using the authenticated Cloud Function callable.
   * Direct client Firestore write fallback is strictly disabled to prevent
   * client forgery of reference numbers, ownership, or status.
   */
  async createTicket(input: CreateTicketInput): Promise<{
    ticket: CampusTicket;
    isRemote: boolean;
  }> {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be logged in to submit a ticket.');

    const createComplaintFn = httpsCallable<{ data: CreateTicketInput }, { success: boolean; data: CampusTicket }>(
      functions,
      'createComplaint'
    );
    const res = await createComplaintFn(input as any);
    if (res.data?.success && res.data.data) {
      return { ticket: res.data.data, isRemote: true };
    }
    throw new Error('Failed to create ticket via authenticated service.');
  },

  /**
   * Reopen a resolved or closed ticket exclusively via the trusted callable Cloud Function.
   * Direct client Firestore write fallback is strictly removed to prevent students
   * from bypassing status-transition authorization checks.
   */
  async reopenTicket(ticketId: string, reason: string): Promise<void> {
    const reopenFn = httpsCallable<{ ticketId: string; reason: string }, any>(
      functions,
      'reopenTicket'
    );
    try {
      const res = await reopenFn({ ticketId, reason });
      if (res.data && res.data.success === false) {
        throw new Error(res.data.message || 'Failed to reopen ticket.');
      }
    } catch (cfErr: any) {
      console.error('reopenTicket Cloud Function error:', cfErr);
      throw new Error(cfErr.message || 'Failed to reopen ticket. Please try again.');
    }
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
      console.error('Unable to load live complaints:', err);
    }

    return [];
  },

  /**
   * Real-time Firestore Subscription for Tickets.
   * Automatically updates UI when ticket status transitions or new tickets arrive.
   */
  subscribeTickets(
    callback: (tickets: CampusTicket[]) => void,
    userId?: string,
    onError?: (error: Error) => void
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
          callback([]);
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
        console.error('Live complaints subscription failed:', error);
        if (onError) onError(error as Error);
        callback([]);
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
    return null;
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
    return [];
  },

  /**
   * Real-time Firestore Subscription for Departments
   */
  subscribeDepartments(
    callback: (departments: CampusDepartment[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return onSnapshot(
      collection(db, 'departments'),
      (snap) => {
        if (!snap.empty) {
          const depts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampusDepartment));
          callback(depts);
        } else {
          callback([]);
        }
      },
      (err) => {
        if (onError) onError(err as Error);
        callback([]);
      }
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
    return [];
  },

  /**
   * Real-time Firestore Subscription for Issue Clusters (Admin Only)
   */
  subscribeClusters(
    callback: (clusters: IssueCluster[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return onSnapshot(
      collection(db, 'issueClusters'),
      (snap) => {
        if (!snap.empty) {
          const clusters = snap.docs.map((d) => ({ id: d.id, ...d.data() } as IssueCluster));
          callback(clusters);
        } else {
          callback([]);
        }
      },
      (err) => {
        console.warn('issueClusters subscription notice (Admin role required):', err.message);
        if (onError) onError(err as Error);
        callback([]);
      }
    );
  },

  /**
   * Real-time Firestore Subscription for Sanitized Public Campus Incidents (Student Safe)
   * Exposes only verified, privacy-reviewed maintenance incidents without student IDs or individual complaint references.
   */
  subscribePublicIncidents(
    callback: (incidents: PublicCampusIncident[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return onSnapshot(
      collection(db, 'publicIncidents'),
      (snap) => {
        if (!snap.empty) {
          const incidents = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PublicCampusIncident));
          callback(incidents);
        } else {
          callback([]);
        }
      },
      (err) => {
        console.warn('publicIncidents subscription notice:', err.message);
        if (onError) onError(err as Error);
        callback([]);
      }
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
    return [];
  },

  /**
   * Real-time Firestore Subscription for Campus Clubs
   */
  subscribeClubs(
    callback: (clubs: CampusClub[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return onSnapshot(
      collection(db, 'campusClubs'),
      (snap) => {
        if (!snap.empty) {
          const clubs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampusClub));
          callback(clubs.filter((c) => !c.isArchived));
        } else {
          callback([]);
        }
      },
      (err) => {
        console.warn('Campus clubs subscription failed:', err.message);
        if (onError) onError(err as Error);
        callback([]);
      }
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
   * Live client submissions are disabled for security compliance pending full cryptographic audit.
   */
  async submitSpeakFreely(
    _category: string,
    _description: string
  ): Promise<AnonymousReport> {
    throw new Error(
      'Live Speak Freely submissions are temporarily disabled pending zero-knowledge privacy architecture certification. Please submit urgent or standard issues through the authenticated Campus Issue Reporting portal.'
    );
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
