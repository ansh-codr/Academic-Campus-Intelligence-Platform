import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  runTransaction,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import {
  EnrollmentRequest,
  EnrollmentStatus,
} from '@solvesphere/shared';

export const EnrollmentService = {
  /** Retrieve student enrollment verification requests */
  async getEnrollmentRequests(statusFilter?: EnrollmentStatus): Promise<EnrollmentRequest[]> {
    const colRef = collection(db, 'enrollmentRequests');
    const q = statusFilter
      ? query(colRef, where('status', '==', statusFilter))
      : colRef;
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EnrollmentRequest, 'id'>) }));
  },

  /**
   * Administratively approve an enrollment request.
   * Transactionally reserves the enrollment number in `enrollmentNumbers/{studentId}`
   * to strictly guarantee uniqueness across all university student accounts.
   */
  async approveEnrollmentRequest(
    requestId: string,
    studentId: string,
    department: string,
    semester: number
  ): Promise<void> {
    const adminUser = auth.currentUser;
    const adminIdentifier = adminUser?.email || adminUser?.uid || 'University Administrator';
    const cleanId = studentId.trim();
    const now = new Date().toISOString();

    const reservationRef = doc(db, 'enrollmentNumbers', cleanId);
    const requestRef = doc(db, 'enrollmentRequests', requestId);
    const userRef = doc(db, 'users', requestId);

    await runTransaction(db, async (tx) => {
      const reservationSnap = await tx.get(reservationRef);
      if (reservationSnap.exists()) {
        const existing = reservationSnap.data();
        if (existing.userId !== requestId) {
          throw new Error(
            `Enrollment Number "${cleanId}" is already officially registered to another student account.`
          );
        }
      }

      // 1. Reserve unique enrollment number
      tx.set(reservationRef, {
        studentId: cleanId,
        userId: requestId,
        verifiedAt: now,
        verifiedBy: adminIdentifier,
      });

      // 2. Mark request as VERIFIED
      tx.update(requestRef, {
        status: 'VERIFIED',
        reviewedAt: now,
        reviewedBy: adminIdentifier,
        rejectionReason: null,
      });

      // 3. Update authoritative student user document
      tx.update(userRef, {
        studentId: cleanId,
        enrollmentStatus: 'VERIFIED',
        department: department.trim(),
        semester: semester,
        rejectionReason: null,
        updatedAt: now,
      });
    });
  },

  /**
   * Administratively reject an enrollment request with a mandatory reason.
   */
  async rejectEnrollmentRequest(
    requestId: string,
    studentId: string,
    reason: string
  ): Promise<void> {
    const adminUser = auth.currentUser;
    const adminIdentifier = adminUser?.email || adminUser?.uid || 'University Administrator';
    const now = new Date().toISOString();
    const cleanReason = reason.trim();
    if (!cleanReason) throw new Error('Rejection reason is required.');

    const requestRef = doc(db, 'enrollmentRequests', requestId);
    const userRef = doc(db, 'users', requestId);
    const reservationRef = doc(db, 'enrollmentNumbers', studentId.trim());

    // Update request
    await updateDoc(requestRef, {
      status: 'REJECTED',
      rejectionReason: cleanReason,
      reviewedAt: now,
      reviewedBy: adminIdentifier,
    });

    // Update user profile
    await updateDoc(userRef, {
      enrollmentStatus: 'REJECTED',
      rejectionReason: cleanReason,
      updatedAt: now,
    });

    // Clean up reservation if previously reserved
    try {
      const resSnap = await getDoc(reservationRef);
      if (resSnap.exists() && resSnap.data().userId === requestId) {
        await deleteDoc(reservationRef);
      }
    } catch (_e) {
      // Non-fatal
    }
  },
};
