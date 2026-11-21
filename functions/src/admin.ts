import { onCall, HttpsError } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { TicketStatus } from '@solvesphere/shared';
import { sendInAppNotification } from './notifications.js';

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
    const updated: Record<string, any> = await db.runTransaction(async (transaction) => {
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
        ...(snap.data() || {}),
        status: newStatus,
        updatedAt: now,
      };
    });

    // Send In-App Notification to ticket owner
    if (updated?.submittedById) {
      const notifType = newStatus === 'RESOLVED' ? 'RESOLVED' : 'STATUS_CHANGED';
      const refNum = updated.referenceNumber || ticketId;
      await sendInAppNotification(db, {
        userId: updated.submittedById,
        ticketId,
        referenceNumber: refNum,
        type: notifType,
        title: `Ticket Status Updated to ${newStatus}`,
        message: note
          ? `Ticket ${refNum}: ${note}`
          : `Your ticket ${refNum} has been updated to ${newStatus}.`,
      });
    }

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

  const { ticketId, departmentName, departmentId, note } = request.data || {};
  if (!ticketId || !departmentName) {
    throw new HttpsError('invalid-argument', 'ticketId and departmentName are required.');
  }

  const db = admin.firestore();
  const ticketRef = db.collection('complaints').doc(ticketId);
  const now = new Date().toISOString();
  const adminName = request.auth.token.name || request.auth.token.email || 'Administrator';

  try {
    let ownerId = '';
    let refNum = '';

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ticketRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', `Ticket ${ticketId} not found.`);
      }

      const currentData = snap.data();
      ownerId = currentData?.submittedById || '';
      refNum = currentData?.referenceNumber || ticketId;

      const currentStatus = currentData?.status;
      const newStatus = (currentStatus === 'SUBMITTED' || currentStatus === 'UNDER_REVIEW') 
        ? 'ASSIGNED' 
        : currentStatus;

      const updatePayload: Record<string, any> = {
        assignedDepartment: departmentName,
        status: newStatus,
        updatedAt: now,
      };

      if (departmentId) {
        updatePayload.assignedDepartmentId = departmentId;
      }

      transaction.update(ticketRef, updatePayload);

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

    if (ownerId) {
      await sendInAppNotification(db, {
        userId: ownerId,
        ticketId,
        referenceNumber: refNum,
        type: 'ASSIGNED',
        title: 'Ticket Assigned to Department',
        message: `Your ticket ${refNum} has been assigned to ${departmentName}.`,
      });
    }

    return {
      success: true,
      message: `Assigned ticket ${ticketId} to ${departmentName}`,
    };
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', err.message || 'Failed to assign ticket.');
  }
});

/**
 * Callable Cloud Function: adminManageDepartment (Admin only)
 * Creates, updates, or toggles active status for campus departments
 */
export const adminManageDepartment = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can manage departments.');
  }

  const { action, departmentId, data } = request.data || {};
  if (!action || !['create', 'update', 'toggleActive'].includes(action)) {
    throw new HttpsError('invalid-argument', 'Valid action (create, update, toggleActive) is required.');
  }

  const db = admin.firestore();
  const now = new Date().toISOString();

  try {
    if (action === 'create') {
      if (!data?.name || !data?.code) {
        throw new HttpsError('invalid-argument', 'name and code are required to create a department.');
      }
      const deptRef = departmentId ? db.collection('departments').doc(departmentId) : db.collection('departments').doc();
      const newDept = {
        id: deptRef.id,
        name: data.name,
        code: data.code,
        category: data.category || 'GENERAL_INFRASTRUCTURE',
        contactEmail: data.contactEmail || '',
        headName: data.headName || '',
        activeTicketsCount: 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
      };
      await deptRef.set(newDept);
      return { success: true, department: newDept };
    }

    if (!departmentId) {
      throw new HttpsError('invalid-argument', 'departmentId is required for this action.');
    }
    const deptRef = db.collection('departments').doc(departmentId);
    const snap = await deptRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', `Department ${departmentId} not found.`);
    }

    if (action === 'toggleActive') {
      const currentActive = snap.data()?.isActive ?? true;
      await deptRef.update({
        isActive: !currentActive,
        updatedAt: now,
      });
      return { success: true, isActive: !currentActive };
    }

    if (action === 'update') {
      await deptRef.update({
        ...data,
        updatedAt: now,
      });
      const updatedSnap = await deptRef.get();
      return { success: true, department: updatedSnap.data() };
    }
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', err.message || 'Failed to manage department.');
  }
});

/**
 * Callable Cloud Function: adminManageClub (Admin only)
 * Creates, updates, or archives campus clubs
 */
export const adminManageClub = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can manage campus clubs.');
  }

  const { action, clubId, data } = request.data || {};
  if (!action || !['create', 'update', 'archive'].includes(action)) {
    throw new HttpsError('invalid-argument', 'Valid action (create, update, archive) is required.');
  }

  const db = admin.firestore();
  const now = new Date().toISOString();

  try {
    if (action === 'create') {
      if (!data?.name || !data?.category) {
        throw new HttpsError('invalid-argument', 'name and category are required to create a club.');
      }
      const clubRef = clubId ? db.collection('campusClubs').doc(clubId) : db.collection('campusClubs').doc();
      const newClub = {
        id: clubRef.id,
        name: data.name,
        category: data.category,
        leadName: data.leadName || '',
        description: data.description || '',
        memberCount: data.memberCount || 0,
        meetingSchedule: data.meetingSchedule || '',
        bannerGradient: data.bannerGradient || 'from-indigo-600 to-purple-600',
        tags: Array.isArray(data.tags) ? data.tags : [],
        recentActivities: Array.isArray(data.recentActivities) ? data.recentActivities : [],
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };
      await clubRef.set(newClub);
      return { success: true, club: newClub };
    }

    if (!clubId) {
      throw new HttpsError('invalid-argument', 'clubId is required for update or archive.');
    }
    const clubRef = db.collection('campusClubs').doc(clubId);
    const snap = await clubRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', `Club ${clubId} not found.`);
    }

    if (action === 'archive') {
      await clubRef.update({
        isArchived: true,
        updatedAt: now,
      });
      return { success: true, message: `Club ${clubId} archived.` };
    }

    if (action === 'update') {
      await clubRef.update({
        ...data,
        updatedAt: now,
      });
      const updatedSnap = await clubRef.get();
      return { success: true, club: updatedSnap.data() };
    }
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', err.message || 'Failed to manage club.');
  }
});

/**
 * Callable Cloud Function: adminReviewCluster (Admin only)
 * Reviews, merges, resolves, or dismisses suggested issue clusters
 */
export const adminReviewCluster = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can review issue clusters.');
  }

  const { clusterId, action, note } = request.data || {};
  if (!clusterId || !action || !['merge', 'resolve', 'dismiss'].includes(action)) {
    throw new HttpsError('invalid-argument', 'clusterId and valid action (merge, resolve, dismiss) are required.');
  }

  const db = admin.firestore();
  const now = new Date().toISOString();
  const clusterRef = db.collection('issueClusters').doc(clusterId);

  try {
    const snap = await clusterRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', `Cluster ${clusterId} not found.`);
    }

    let newStatus: 'ACTIVE_INCIDENT' | 'RESOLVING' | 'MERGED' | 'DISMISSED';
    if (action === 'merge') newStatus = 'MERGED';
    else if (action === 'resolve') newStatus = 'RESOLVING';
    else newStatus = 'DISMISSED';

    await clusterRef.update({
      status: newStatus,
      updatedAt: now,
      ...(note ? { reviewNote: note } : {}),
    });

    return {
      success: true,
      message: `Cluster ${clusterId} status updated to ${newStatus}.`,
      status: newStatus,
    };
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', err.message || 'Failed to review cluster.');
  }
});
