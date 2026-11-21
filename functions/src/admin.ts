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
        eventId: eventRef.id,
      };
    });

    // Send In-App Notification to ticket owner (Idempotent)
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
        idempotencyKey: `${ticketId}_STATUS_${newStatus}`,
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
 * Validates that the department exists and is active.
 * Prefers stable department IDs over unverified names.
 */
export const assignTicketDepartment = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can assign tickets.');
  }

  const { ticketId, departmentName, departmentId, note } = request.data || {};
  if (!ticketId) {
    throw new HttpsError('invalid-argument', 'ticketId is required.');
  }
  if (!departmentId && !departmentName) {
    throw new HttpsError('invalid-argument', 'departmentId or departmentName is required.');
  }

  const db = admin.firestore();

  // Validate that the department exists and is active
  let targetDeptId = departmentId;
  let targetDeptName = departmentName;

  if (targetDeptId) {
    const deptSnap = await db.collection('departments').doc(targetDeptId).get();
    if (!deptSnap.exists) {
      throw new HttpsError('not-found', `Department ID "${targetDeptId}" not found.`);
    }
    const deptData = deptSnap.data();
    if (deptData?.isActive === false) {
      throw new HttpsError('failed-precondition', `Department "${deptData.name}" is currently disabled/inactive.`);
    }
    targetDeptName = deptData?.name || departmentName;
  } else {
    const deptQuery = await db.collection('departments').where('name', '==', departmentName).limit(1).get();
    if (!deptQuery.empty) {
      const deptDoc = deptQuery.docs[0];
      const deptData = deptDoc.data();
      if (deptData?.isActive === false) {
        throw new HttpsError('failed-precondition', `Department "${deptData.name}" is currently disabled/inactive.`);
      }
      targetDeptId = deptDoc.id;
      targetDeptName = deptData.name;
    } else {
      const allowedCategories = [
        'HVAC & Climate Control',
        'IT & Campus Network Operations',
        'Electrical Maintenance',
        'Public Health & Plumbing',
        'Campus Estate & General Infrastructure',
        'Housekeeping & Sanitation',
        'Hostel Administration Office',
      ];
      if (!allowedCategories.includes(departmentName)) {
        throw new HttpsError('not-found', `Department "${departmentName}" does not exist.`);
      }
    }
  }

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
        assignedDepartment: targetDeptName,
        status: newStatus,
        updatedAt: now,
      };

      if (targetDeptId) {
        updatePayload.assignedDepartmentId = targetDeptId;
      }

      transaction.update(ticketRef, updatePayload);

      const eventRef = ticketRef.collection('timeline').doc();
      transaction.set(eventRef, {
        id: eventRef.id,
        ticketId,
        status: newStatus,
        note: note || `Assigned to department: ${targetDeptName}`,
        updatedBy: adminName,
        timestamp: now,
      });
    });

    if (ownerId) {
      const safeDeptKey = String(targetDeptName).replace(/[^a-zA-Z0-9]/g, '_');
      await sendInAppNotification(db, {
        userId: ownerId,
        ticketId,
        referenceNumber: refNum,
        type: 'ASSIGNED',
        title: 'Ticket Assigned to Department',
        message: `Your ticket ${refNum} has been assigned to ${targetDeptName}.`,
        idempotencyKey: `${ticketId}_ASSIGNED_${safeDeptKey}`,
      });
    }

    return {
      success: true,
      message: `Assigned ticket ${ticketId} to ${targetDeptName}`,
    };
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', err.message || 'Failed to assign ticket.');
  }
});

/**
 * Callable Cloud Function: adminManageDepartment (Admin only)
 * Creates, updates, or toggles active status with strict field allowlist validation.
 * Prevents unauthorized modification of IDs, timestamps, or counters.
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
        name: String(data.name).trim(),
        code: String(data.code).trim().toUpperCase(),
        category: data.category || 'GENERAL_INFRASTRUCTURE',
        contactEmail: data.contactEmail ? String(data.contactEmail).trim() : '',
        headName: data.headName ? String(data.headName).trim() : '',
        activeTicketsCount: 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
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
      // Explicit allowlist: only permitted fields can be updated
      const allowedUpdates: Record<string, any> = { updatedAt: now };
      if (typeof data?.name === 'string' && data.name.trim()) allowedUpdates.name = data.name.trim();
      if (typeof data?.code === 'string' && data.code.trim()) allowedUpdates.code = data.code.trim().toUpperCase();
      if (typeof data?.category === 'string') allowedUpdates.category = data.category;
      if (typeof data?.contactEmail === 'string') allowedUpdates.contactEmail = data.contactEmail.trim();
      if (typeof data?.headName === 'string') allowedUpdates.headName = data.headName.trim();
      if (typeof data?.isActive === 'boolean') allowedUpdates.isActive = data.isActive;

      await deptRef.update(allowedUpdates);
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
 * Creates, updates, or archives campus clubs with strict field allowlist validation.
 * Prevents unauthorized modification of IDs, timestamps, or system metadata.
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
        name: String(data.name).trim(),
        category: data.category,
        leadName: data.leadName ? String(data.leadName).trim() : '',
        description: data.description ? String(data.description).trim() : '',
        memberCount: typeof data.memberCount === 'number' ? data.memberCount : 0,
        meetingSchedule: data.meetingSchedule ? String(data.meetingSchedule).trim() : '',
        bannerGradient: data.bannerGradient ? String(data.bannerGradient).trim() : 'from-indigo-600 to-purple-600',
        tags: Array.isArray(data.tags) ? data.tags.map((t: any) => String(t).trim()) : [],
        recentActivities: Array.isArray(data.recentActivities) ? data.recentActivities.map((a: any) => String(a).trim()) : [],
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
      // Explicit allowlist: only permitted fields can be updated
      const allowedUpdates: Record<string, any> = { updatedAt: now };
      if (typeof data?.name === 'string' && data.name.trim()) allowedUpdates.name = data.name.trim();
      if (typeof data?.category === 'string') allowedUpdates.category = data.category;
      if (typeof data?.leadName === 'string') allowedUpdates.leadName = data.leadName.trim();
      if (typeof data?.description === 'string') allowedUpdates.description = data.description.trim();
      if (typeof data?.meetingSchedule === 'string') allowedUpdates.meetingSchedule = data.meetingSchedule.trim();
      if (typeof data?.bannerGradient === 'string') allowedUpdates.bannerGradient = data.bannerGradient.trim();
      if (typeof data?.contactEmail === 'string') allowedUpdates.contactEmail = data.contactEmail.trim();
      if (Array.isArray(data?.tags)) allowedUpdates.tags = data.tags.map((t: any) => String(t).trim());
      if (Array.isArray(data?.recentActivities)) allowedUpdates.recentActivities = data.recentActivities.map((a: any) => String(a).trim());
      if (typeof data?.memberCount === 'number') allowedUpdates.memberCount = data.memberCount;
      if (typeof data?.isArchived === 'boolean') allowedUpdates.isArchived = data.isArchived;

      await clubRef.update(allowedUpdates);
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
 * Reviews, verifies, merges, resolves, or dismisses suggested rule-based issue clusters.
 * Enforces admin confirmation before converting a suggestion into an official active incident.
 */
export const adminReviewCluster = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can review issue clusters.');
  }

  const { clusterId, action, note } = request.data || {};
  if (!clusterId || !action || !['verify', 'merge', 'resolve', 'dismiss'].includes(action)) {
    throw new HttpsError('invalid-argument', 'clusterId and valid action (verify, merge, resolve, dismiss) are required.');
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
    let verifiedByAdmin = true;

    if (action === 'verify') {
      newStatus = 'ACTIVE_INCIDENT';
    } else if (action === 'merge') {
      newStatus = 'MERGED';
    } else if (action === 'resolve') {
      newStatus = 'RESOLVING';
    } else {
      newStatus = 'DISMISSED';
      verifiedByAdmin = false;
    }

    await clusterRef.update({
      status: newStatus,
      verifiedByAdmin,
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
