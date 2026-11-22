import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
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
   * Administratively approve an enrollment request via trusted callable Cloud Function.
   * Atomically verifies the student enrollment, reserves the roll number in enrollmentNumbers,
   * updates the user profile, and records an administrative audit log.
   */
  async approveEnrollmentRequest(
    requestId: string,
    studentId: string,
    department: string,
    semester: number
  ): Promise<void> {
    const fn = httpsCallable<
      { requestId: string; studentId: string; department: string; semester: number },
      { success: boolean; message: string }
    >(functions, 'adminApproveEnrollment');
    const res = await fn({ requestId, studentId: studentId.trim(), department: department.trim(), semester });
    if (res.data && res.data.success === false) {
      throw new Error(res.data.message || 'Failed to approve enrollment.');
    }
  },

  /**
   * Administratively reject an enrollment request via trusted callable Cloud Function.
   * Enforces a mandatory explanation and frees any pending reservation.
   */
  async rejectEnrollmentRequest(
    requestId: string,
    _studentId: string,
    reason: string
  ): Promise<void> {
    const fn = httpsCallable<
      { requestId: string; rejectionReason: string },
      { success: boolean; message: string }
    >(functions, 'adminRejectEnrollment');
    const res = await fn({ requestId, rejectionReason: reason.trim() });
    if (res.data && res.data.success === false) {
      throw new Error(res.data.message || 'Failed to reject enrollment.');
    }
  },
};
