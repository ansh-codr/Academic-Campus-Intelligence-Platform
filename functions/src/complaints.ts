import { onCall, HttpsError } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { CreateTicketSchema, TicketStatus } from '@solvesphere/shared';
import { sendInAppNotification } from './notifications.js';

// Mapping for default department routing
export function getDepartmentForCategory(category: string): string {
  switch (category) {
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

/**
 * Validates that an attachment URL belongs strictly to the authenticated student's storage workspace.
 * Prevents arbitrary external links or cross-student attachment hijacking.
 */
function validateAttachmentUrl(urlStr: string, uid: string): void {
  try {
    const parsed = new URL(urlStr);
    const isAllowedHost =
      parsed.hostname.includes('firebasestorage.googleapis.com') ||
      parsed.hostname.includes('storage.googleapis.com') ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === 'localhost';

    if (!isAllowedHost) {
      throw new HttpsError('permission-denied', `Disallowed attachment host: ${parsed.hostname}`);
    }

    const decodedPath = decodeURIComponent(parsed.pathname);
    const expectedPrefix = `/attachments/${uid}/`;
    const expectedEncodedPrefix = `attachments%2F${uid}%2F`;

    if (!decodedPath.includes(expectedPrefix) && !parsed.pathname.includes(expectedEncodedPrefix)) {
      throw new HttpsError(
        'permission-denied',
        'Attachment ownership verification failed. URLs must belong to the authenticated student workspace.'
      );
    }
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('invalid-argument', `Invalid attachment URL format: ${urlStr}`);
  }
}

/**
 * Callable Cloud Function: createComplaint
 * Securely creates a complaint with atomic sequence numbering (SS-2026-XXXX)
 * Enforces ownership from context.auth.uid
 * Validates attachment ownership, implements rule-based heuristic clustering, and idempotent notification
 */
export const createComplaint = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to submit a complaint.');
  }

  const parseResult = CreateTicketSchema.safeParse(request.data);
  if (!parseResult.success) {
    throw new HttpsError('invalid-argument', 'Invalid complaint payload', parseResult.error.format());
  }

  const data = parseResult.data;
  const db = admin.firestore();
  const uid = request.auth.uid;

  // Validate all attachment URLs belong to the authenticated student
  if (data.attachmentUrls && data.attachmentUrls.length > 0) {
    for (const url of data.attachmentUrls) {
      validateAttachmentUrl(url, uid);
    }
  }

  // Retrieve user name / student ID from user profile or auth token
  let submitterName = request.auth.token.name || request.auth.token.email || 'Student';
  const userDoc = await db.collection('users').doc(uid).get();
  if (userDoc.exists) {
    const userData = userDoc.data();
    if (userData?.fullName) {
      submitterName = `${userData.fullName} (${userData.studentId || ''})`.trim();
    }
  }

  const now = new Date().toISOString();
  const counterRef = db.collection('systemCounters').doc('complaints');

  try {
    const newComplaint: Record<string, any> = await db.runTransaction(async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let nextSeq = 1;
      if (counterSnap.exists) {
        nextSeq = (counterSnap.data()?.currentSequence || 0) + 1;
      }
      transaction.set(counterRef, { currentSequence: nextSeq }, { merge: true });

      const refNum = `SS-2026-${String(nextSeq).padStart(4, '0')}`;
      const complaintRef = db.collection('complaints').doc();
      const complaintId = complaintRef.id;

      const complaintData: Record<string, any> = {
        id: complaintId,
        referenceNumber: refNum,
        title: data.title,
        category: data.category,
        building: data.building,
        floor: data.floor,
        room: data.room,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        status: 'SUBMITTED' as TicketStatus,
        assignedDepartment: getDepartmentForCategory(data.category),
        submittedById: uid,
        submittedBy: submitterName,
        submittedAt: now,
        updatedAt: now,
      };

      if (data.attachmentUrls && data.attachmentUrls.length > 0) {
        complaintData.attachmentUrls = data.attachmentUrls;
      }

      transaction.set(complaintRef, complaintData);

      // Add initial timeline event in subcollection
      const eventRef = complaintRef.collection('timeline').doc();
      const initialEvent = {
        id: eventRef.id,
        ticketId: complaintId,
        status: 'SUBMITTED',
        note: 'Issue submitted via SolveSphere Portal.',
        updatedBy: submitterName,
        timestamp: now,
      };
      transaction.set(eventRef, initialEvent);

      return {
        ...complaintData,
        timeline: [initialEvent],
      };
    });

    const complaintId = newComplaint.id;
    const refNum = newComplaint.referenceNumber;

    // --- Deterministic Duplicate Issue Grouping (Rule-based Suggestion) ---
    // Check for active complaints in the same building and room with same category in last 48 hours
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const duplicateCandidatesSnap = await db
        .collection('complaints')
        .where('category', '==', data.category)
        .where('building', '==', data.building)
        .get();

      const matchingDocs = duplicateCandidatesSnap.docs.filter((docSnap) => {
        const item = docSnap.data();
        if (docSnap.id === complaintId) return false;
        if (item.status === 'CLOSED' || item.status === 'RESOLVED') return false;
        if (item.submittedAt && item.submittedAt < fortyEightHoursAgo) return false;
        const roomMatches = String(item.room).trim().toLowerCase() === String(data.room).trim().toLowerCase();
        return roomMatches;
      });

      if (matchingDocs.length > 0) {
        const existingClusterDoc = matchingDocs.find((docSnap) => docSnap.data().clusterId);
        let targetClusterId: string;

        if (existingClusterDoc && existingClusterDoc.data().clusterId) {
          targetClusterId = existingClusterDoc.data().clusterId;
          const clusterRef = db.collection('issueClusters').doc(targetClusterId);
          await clusterRef.update({
            ticketIds: admin.firestore.FieldValue.arrayUnion(complaintId),
            ticketCount: admin.firestore.FieldValue.increment(1),
            updatedAt: now,
          });
        } else {
          // Represent match as an unreviewed rule-based suggestion, requiring admin verification
          const clusterRef = db.collection('issueClusters').doc();
          targetClusterId = clusterRef.id;
          const allTicketIds = [complaintId, ...matchingDocs.map((d) => d.id)];

          await clusterRef.set({
            id: targetClusterId,
            title: `Suggested Incident: ${data.category.replace(/_/g, ' ')} at ${data.building} (${data.room})`,
            category: data.category,
            affectedArea: `${data.building}, Room ${data.room}`,
            building: data.building,
            room: data.room,
            ticketCount: allTicketIds.length,
            ticketIds: allTicketIds,
            clusteringMethod: 'RULE_BASED_LOCATION_PROXIMITY',
            verifiedByAdmin: false,
            status: 'SUGGESTED_INCIDENT',
            suggestedAction: `Heuristic rule matched identical category and room within 48 hours. Requires administrator confirmation to verify shared root cause.`,
            createdAt: now,
            updatedAt: now,
          });

          // Link the cluster suggestion to earlier matching tickets
          const batch = db.batch();
          for (const d of matchingDocs) {
            batch.update(d.ref, { clusterId: targetClusterId });
          }
          await batch.commit();
        }

        // Link new complaint to the cluster
        await db.collection('complaints').doc(complaintId).update({ clusterId: targetClusterId });
        newComplaint.clusterId = targetClusterId;
      }
    } catch (groupingErr) {
      console.warn('Issue grouping non-fatal warning:', groupingErr);
    }

    // --- Dispatch In-App Notification (Idempotent) ---
    try {
      await sendInAppNotification(db, {
        userId: uid,
        ticketId: complaintId,
        referenceNumber: refNum,
        type: 'SUBMITTED',
        title: 'Ticket Submitted Successfully',
        message: `Your ticket ${refNum} has been received and assigned to ${newComplaint.assignedDepartment}.`,
        idempotencyKey: `${complaintId}_SUBMITTED`,
      });
    } catch (notifErr) {
      console.warn('Notification send non-fatal warning:', notifErr);
    }

    return {
      success: true,
      data: newComplaint,
    };
  } catch (error: any) {
    console.error('Error creating complaint transaction:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message || 'Failed to submit complaint.');
  }
});

/**
 * Callable Cloud Function: reopenTicket
 * Allows student (ticket owner) or administrator to reopen a RESOLVED or CLOSED ticket
 */
export const reopenTicket = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to reopen a ticket.');
  }

  const { ticketId, reason } = request.data || {};
  if (!ticketId || typeof ticketId !== 'string') {
    throw new HttpsError('invalid-argument', 'ticketId is required.');
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    throw new HttpsError('invalid-argument', 'A valid reason (at least 5 characters) is required to reopen a ticket.');
  }

  const db = admin.firestore();
  const uid = request.auth.uid;
  const isAdmin = request.auth.token.role === 'ADMIN';
  const ticketRef = db.collection('complaints').doc(ticketId);
  const now = new Date().toISOString();

  let submitterName = request.auth.token.name || request.auth.token.email || 'Student';
  const userDoc = await db.collection('users').doc(uid).get();
  if (userDoc.exists) {
    const userData = userDoc.data();
    if (userData?.fullName) {
      submitterName = `${userData.fullName} (${userData.studentId || ''})`.trim();
    }
  }

  try {
    const result = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ticketRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', `Ticket ${ticketId} not found.`);
      }

      const ticketData = snap.data();
      if (!isAdmin && ticketData?.submittedById !== uid) {
        throw new HttpsError('permission-denied', 'You do not have permission to reopen this ticket.');
      }

      const currentStatus = ticketData?.status;
      if (currentStatus !== 'RESOLVED' && currentStatus !== 'CLOSED') {
        throw new HttpsError(
          'failed-precondition',
          `Only RESOLVED or CLOSED tickets can be reopened. Current status: ${currentStatus}`
        );
      }

      transaction.update(ticketRef, {
        status: 'REOPENED',
        updatedAt: now,
      });

      const eventRef = ticketRef.collection('timeline').doc();
      const eventData = {
        id: eventRef.id,
        ticketId,
        status: 'REOPENED',
        note: `Ticket reopened: ${reason.trim()}`,
        updatedBy: submitterName,
        timestamp: now,
      };
      transaction.set(eventRef, eventData);

      return {
        ticket: { ...ticketData, status: 'REOPENED', updatedAt: now },
        referenceNumber: ticketData?.referenceNumber || ticketId,
        ownerId: ticketData?.submittedById,
        eventId: eventRef.id,
      };
    });

    if (result.ownerId) {
      await sendInAppNotification(db, {
        userId: result.ownerId,
        ticketId,
        referenceNumber: result.referenceNumber,
        type: 'REOPENED',
        title: 'Ticket Reopened',
        message: `Ticket ${result.referenceNumber} has been reopened: ${reason.trim()}`,
        idempotencyKey: `${ticketId}_REOPENED_${result.eventId}`,
      });
    }

    return {
      success: true,
      message: 'Ticket reopened successfully.',
      data: result.ticket,
    };
  } catch (error: any) {
    console.error('Error reopening ticket:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message || 'Failed to reopen ticket.');
  }
});
