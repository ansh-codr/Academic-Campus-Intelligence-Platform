import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { TicketStatus } from '@solvesphere/shared';

// Permitted status transitions in ticket lifecycle
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'ASSIGNED', 'CLOSED'],
  UNDER_REVIEW: ['ASSIGNED', 'IN_PROGRESS', 'CLOSED'],
  ASSIGNED: ['IN_PROGRESS', 'UNDER_REVIEW', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'UNDER_REVIEW'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'],
};

/**
 * Callable Cloud Function: updateTicketStatus (Admin only)
 */
export const updateTicketStatus = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  // Check admin role custom claim
  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can update ticket status.');
  }

  const { ticketId, newStatus, note } = request.data || {};
  if (!ticketId || !newStatus) {
    throw new HttpsError('invalid-argument', 'ticketId and newStatus are required.');
  }

  const db = admin.firestore();
  const ticketRef = db.collection('complaints').doc(ticketId);
  const now = new Date().toISOString();
  const adminName = request.auth.token.name || request.auth.token.email || 'Administrator';

  try {
    const updated = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ticketRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', `Ticket ${ticketId} not found.`);
      }

      const currentStatus = snap.data()?.status as TicketStatus;
      const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(newStatus as TicketStatus)) {
        throw new HttpsError(
          'failed-precondition',
          `Cannot transition ticket from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ')}`
        );
      }

      transaction.update(ticketRef, {
        status: newStatus,
        updatedAt: now,
      });

      // Write timeline event
      const eventRef = ticketRef.collection('timeline').doc();
      const timelineEvent = {
        id: eventRef.id,
        ticketId,
        status: newStatus,
        note: note || `Status updated to ${newStatus} by admin.`,
        updatedBy: adminName,
        timestamp: now,
      };
      transaction.set(eventRef, timelineEvent);

      return {
        ...snap.data(),
        status: newStatus,
        updatedAt: now,
      };
    });

    return {
      success: true,
      data: updated,
    };
  } catch (err: any) {
    console.error('Error in updateTicketStatus:', err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', err.message || 'Failed to update ticket status.');
  }
});

/**
 * Callable Cloud Function: assignTicketDepartment (Admin only)
 */
export const assignTicketDepartment = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can assign tickets.');
  }

  const { ticketId, departmentName, note } = request.data || {};
  if (!ticketId || !departmentName) {
    throw new HttpsError('invalid-argument', 'ticketId and departmentName are required.');
  }

  const db = admin.firestore();
  const ticketRef = db.collection('complaints').doc(ticketId);
  const now = new Date().toISOString();
  const adminName = request.auth.token.name || request.auth.token.email || 'Administrator';

  try {
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ticketRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', `Ticket ${ticketId} not found.`);
      }

      const currentStatus = snap.data()?.status;
      const newStatus = (currentStatus === 'SUBMITTED' || currentStatus === 'UNDER_REVIEW') 
        ? 'ASSIGNED' 
        : currentStatus;

      transaction.update(ticketRef, {
        assignedDepartment: departmentName,
        status: newStatus,
        updatedAt: now,
      });

      const eventRef = ticketRef.collection('timeline').doc();
      transaction.set(eventRef, {
        id: eventRef.id,
        ticketId,
        status: newStatus,
        note: note || `Assigned to department: ${departmentName}`,
        updatedBy: adminName,
        timestamp: now,
      });
    });

    return {
      success: true,
      message: `Assigned ticket ${ticketId} to ${departmentName}`,
    };
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', err.message || 'Failed to assign ticket.');
  }
});
