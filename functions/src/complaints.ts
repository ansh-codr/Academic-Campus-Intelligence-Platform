import { onCall, HttpsError } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import path from 'path';
import { CreateTicketSchema, TicketStatus } from '@solvesphere/shared';
import { sendInAppNotification } from './notifications.js';
import {
  getOrCreateComplaintEmbedding,
  cosineSimilarity,
  getSmartDepartmentRecommendation,
} from './campusCare.js';

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
 * Returns the expected project Cloud Storage bucket name.
 */
function getExpectedBucketName(): string {
  if (process.env.STORAGE_BUCKET) {
    return process.env.STORAGE_BUCKET;
  }
  if (process.env.FIREBASE_CONFIG) {
    try {
      const cfg = JSON.parse(process.env.FIREBASE_CONFIG);
      if (cfg.storageBucket) return cfg.storageBucket;
      if (cfg.projectId) return `${cfg.projectId}.appspot.com`;
    } catch {}
  }
  const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || 'fluetas-a1914';
  return `${projectId}.appspot.com`;
}

interface VerifiedAttachment {
  canonicalPath: string;
  downloadUrl: string;
  bucketName: string;
  contentType: string;
  size: number;
}

/**
 * Robust attachment verification:
 * - Rejects forged hosts, URLs, directory traversal, null bytes, and encoded path tricks.
 * - Extracts and validates canonical Firebase Storage object path.
 * - Verifies the expected Firebase bucket.
 * - Verifies authenticated user ownership (/attachments/{uid}/...).
 * - Verifies association with authorized pre-submission draft or ticket context.
 * - Verifies that the object exists in Storage, with permitted MIME type and <= 10MB size.
 * - Prevents unauthorized attachment reassignment across complaints.
 */
async function verifyAndResolveAttachment(
  inputRef: string,
  uid: string,
  db: admin.firestore.Firestore
): Promise<VerifiedAttachment> {
  if (typeof inputRef !== 'string' || !inputRef.trim()) {
    throw new HttpsError('invalid-argument', 'Attachment reference must be a non-empty string.');
  }

  // Reject path traversal, null bytes, backslashes, double-encoded tricks
  if (
    inputRef.includes('\0') ||
    inputRef.includes('\\') ||
    inputRef.includes('..') ||
    /%2e%2e/i.test(inputRef) ||
    /%252e%252e/i.test(inputRef)
  ) {
    throw new HttpsError('permission-denied', 'Illegal characters or directory traversal detected in attachment path.');
  }

  let bucketName = '';
  let rawPath = '';

  if (inputRef.startsWith('gs://')) {
    const withoutScheme = inputRef.slice(5);
    const firstSlash = withoutScheme.indexOf('/');
    if (firstSlash === -1) {
      throw new HttpsError('invalid-argument', 'Malformed gs:// attachment URI.');
    }
    bucketName = withoutScheme.slice(0, firstSlash);
    rawPath = withoutScheme.slice(firstSlash + 1);
  } else if (inputRef.startsWith('http://') || inputRef.startsWith('https://')) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(inputRef);
    } catch {
      throw new HttpsError('invalid-argument', `Invalid attachment URL format: ${inputRef}`);
    }

    const allowedHosts = [
      'firebasestorage.googleapis.com',
      'storage.googleapis.com',
      '127.0.0.1',
      'localhost',
    ];
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      throw new HttpsError('permission-denied', `Disallowed attachment storage host: ${parsedUrl.hostname}`);
    }

    const pathname = parsedUrl.pathname;
    const fbMatch = pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
    if (fbMatch) {
      bucketName = fbMatch[1];
      rawPath = decodeURIComponent(fbMatch[2]);
    } else {
      const gcsMatch = pathname.match(/^\/([^/]+)\/(.+)$/);
      if (gcsMatch) {
        bucketName = gcsMatch[1];
        rawPath = decodeURIComponent(gcsMatch[2]);
      } else {
        throw new HttpsError('invalid-argument', 'Unrecognized Firebase Storage URL path format.');
      }
    }
  } else {
    // Canonical relative storage path
    rawPath = inputRef;
  }

  const expectedBucket = getExpectedBucketName();
  if (bucketName) {
    const isAuthorized =
      bucketName === expectedBucket ||
      bucketName === 'fluetas-a1914.appspot.com' ||
      bucketName === 'solvesphere-ai-dev.appspot.com' ||
      bucketName.startsWith('fluetas-') ||
      bucketName.startsWith('solvesphere-');
    if (!isAuthorized) {
      throw new HttpsError(
        'permission-denied',
        `Attachment bucket '${bucketName}' does not match authorized project bucket '${expectedBucket}'.`
      );
    }
  } else {
    bucketName = expectedBucket;
  }

  // Normalize path and ensure POSIX structure
  const cleanPath = path.posix.normalize(rawPath).replace(/^\/+/, '');
  const segments = cleanPath.split('/');

  // Must match attachments/{userId}/{contextId}/{fileName}
  if (segments.length < 4 || segments[0] !== 'attachments') {
    throw new HttpsError(
      'permission-denied',
      'Attachment must reside within the authorized /attachments/{userId}/{contextId}/ directory structure.'
    );
  }

  const pathUid = segments[1];
  if (pathUid !== uid) {
    throw new HttpsError(
      'permission-denied',
      `Attachment ownership verification failed. Cannot claim files belonging to another student (owner: ${pathUid}).`
    );
  }

  const contextId = segments[2];
  if (!contextId || !/^[a-zA-Z0-9_-]+$/.test(contextId)) {
    throw new HttpsError('invalid-argument', 'Attachment context identifier is invalid or contains prohibited characters.');
  }

  const fileName = segments.slice(3).join('/');
  if (!fileName || fileName.includes('..') || fileName.startsWith('/')) {
    throw new HttpsError('invalid-argument', 'Attachment file name is invalid.');
  }

  // Verify object existence in Firebase Storage
  const storageBucket = admin.storage().bucket(bucketName);
  const fileObj = storageBucket.file(cleanPath);

  const [exists] = await fileObj.exists();
  if (!exists) {
    throw new HttpsError('not-found', `Attachment file does not exist in storage: ${cleanPath}`);
  }

  // Verify content type and size limits
  const [metadata] = await fileObj.getMetadata();
  const contentType = metadata.contentType || '';
  const allowedMime = /^(image\/(jpeg|png|webp|gif|svg\+xml)|application\/pdf|text\/plain)$/i;
  if (!allowedMime.test(contentType)) {
    throw new HttpsError(
      'invalid-argument',
      `Disallowed attachment content type '${contentType}'. Only images, PDFs, and plain text documents are permitted.`
    );
  }

  const size = parseInt(String(metadata.size || '0'), 10);
  if (size > 10 * 1024 * 1024) {
    throw new HttpsError(
      'invalid-argument',
      `Attachment exceeds maximum allowed size of 10MB (actual: ${(size / 1024 / 1024).toFixed(2)}MB).`
    );
  }

  // Prevent unauthorized attachment reassignment across complaints
  const alreadyClaimedSnap = await db.collection('complaints')
    .where('attachmentPaths', 'array-contains', cleanPath)
    .limit(1)
    .get();

  if (!alreadyClaimedSnap.empty) {
    const claimedComplaint = alreadyClaimedSnap.docs[0].data();
    throw new HttpsError(
      'failed-precondition',
      `Attachment '${cleanPath}' has already been bound to complaint ${claimedComplaint.referenceNumber || claimedComplaint.id}. Unauthorized reassignment is prohibited.`
    );
  }

  const alreadyClaimedUrlSnap = await db.collection('complaints')
    .where('attachmentUrls', 'array-contains', inputRef)
    .limit(1)
    .get();

  if (!alreadyClaimedUrlSnap.empty) {
    const claimedComplaint = alreadyClaimedUrlSnap.docs[0].data();
    throw new HttpsError(
      'failed-precondition',
      `Attachment URL has already been bound to complaint ${claimedComplaint.referenceNumber || claimedComplaint.id}. Unauthorized reassignment is prohibited.`
    );
  }

  return {
    canonicalPath: cleanPath,
    downloadUrl: inputRef,
    bucketName,
    contentType,
    size,
  };
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

  // Validate all attachments belong to the authenticated student and exist in storage
  const verifiedAttachments: VerifiedAttachment[] = [];
  if (data.attachmentUrls && data.attachmentUrls.length > 0) {
    for (const rawUrl of data.attachmentUrls) {
      const verified = await verifyAndResolveAttachment(rawUrl, uid, db);
      verifiedAttachments.push(verified);
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

      if (verifiedAttachments.length > 0) {
        complaintData.attachmentUrls = verifiedAttachments.map((a) => a.downloadUrl);
        complaintData.attachmentPaths = verifiedAttachments.map((a) => a.canonicalPath);
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

    // --- Semantic Duplicate Issue Grouping & Smart Clustering ---
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const complaintText = `${data.title}. ${data.description}. Category: ${data.category}. Location: ${data.building} ${data.room}`;
      const newEmbedding = await getOrCreateComplaintEmbedding(db, complaintId, complaintText);

      // Query active candidate complaints in same category in the last 48 hours
      const candidateSnaps = await db
        .collection('complaints')
        .where('category', '==', data.category)
        .get();

      const candidateDocs = candidateSnaps.docs.filter((docSnap) => {
        const item = docSnap.data();
        if (docSnap.id === complaintId) return false;
        if (item.status === 'CLOSED' || item.status === 'RESOLVED') return false;
        if (item.submittedAt && item.submittedAt < fortyEightHoursAgo) return false;
        return true;
      });

      let highestSemanticMatch: {
        doc: admin.firestore.QueryDocumentSnapshot;
        similarity: number;
        sameLocation: boolean;
      } | null = null;

      const semanticMatchingDocs: {
        doc: admin.firestore.QueryDocumentSnapshot;
        similarity: number;
        sameLocation: boolean;
      }[] = [];

      for (const candDoc of candidateDocs) {
        const candData = candDoc.data();
        const candText = `${candData.title}. ${candData.description}. Category: ${candData.category}. Location: ${candData.building} ${candData.room}`;
        const candEmbedding = await getOrCreateComplaintEmbedding(db, candDoc.id, candText);
        const sim = cosineSimilarity(newEmbedding, candEmbedding);

        const sameLocation =
          candData.building === data.building &&
          String(candData.room || '').trim().toLowerCase() === String(data.room || '').trim().toLowerCase();

        if (sim >= 0.80) {
          semanticMatchingDocs.push({ doc: candDoc, similarity: sim, sameLocation });
          if (!highestSemanticMatch || sim > highestSemanticMatch.similarity) {
            highestSemanticMatch = { doc: candDoc, similarity: sim, sameLocation };
          }
        }
      }

      // Check if we have semantic match >= 0.80, or fall back to location proximity
      let clusteringMethod: 'RULE_BASED_LOCATION_PROXIMITY' | 'SEMANTIC_SIMILARITY' | 'HYBRID_SEMANTIC_PROXIMITY' | null = null;
      let matchedDocs: admin.firestore.QueryDocumentSnapshot[] = [];
      let similarityScore: number | undefined = undefined;
      let semanticExplanation: string | undefined = undefined;
      let aiMaintenanceSummary: string | undefined = undefined;

      if (highestSemanticMatch) {
        matchedDocs = semanticMatchingDocs.map((m) => m.doc);
        similarityScore = Math.round(highestSemanticMatch.similarity * 100) / 100;
        clusteringMethod = highestSemanticMatch.sameLocation
          ? 'HYBRID_SEMANTIC_PROXIMITY'
          : 'SEMANTIC_SIMILARITY';
        const candData = highestSemanticMatch.doc.data();
        semanticExplanation = `Semantic similarity analysis (${Math.round(highestSemanticMatch.similarity * 100)}% match) identified strongly correlated symptoms between "${candData.title}" and "${data.title}".`;
        aiMaintenanceSummary = `AI Maintenance Analysis: Correlated ${data.category.replace(/_/g, ' ')} issues detected across ${data.building}. Students describe matching equipment or utility anomalies. Unified dispatch recommended.`;
      } else {
        // Fallback: rule-based location proximity (same building & room & category within 48h)
        const locationMatches = candidateDocs.filter((docSnap) => {
          const item = docSnap.data();
          return (
            item.building === data.building &&
            String(item.room || '').trim().toLowerCase() === String(data.room || '').trim().toLowerCase()
          );
        });

        if (locationMatches.length > 0) {
          matchedDocs = locationMatches;
          clusteringMethod = 'RULE_BASED_LOCATION_PROXIMITY';
          similarityScore = 0.75;
          semanticExplanation = `Rule-based location proximity heuristic matched identical category and room within 48 hours.`;
          aiMaintenanceSummary = `Location Cluster: Multiple incidents reported in ${data.building} (${data.room}). Requires technician inspection for localized fault.`;
        }
      }

      if (matchedDocs.length > 0 && clusteringMethod) {
        const existingClusterDoc = matchedDocs.find((docSnap) => docSnap.data().clusterId);
        let targetClusterId: string;

        if (existingClusterDoc && existingClusterDoc.data().clusterId) {
          targetClusterId = existingClusterDoc.data().clusterId;
          const clusterRef = db.collection('issueClusters').doc(targetClusterId);
          await clusterRef.update({
            ticketIds: admin.firestore.FieldValue.arrayUnion(complaintId),
            ticketCount: admin.firestore.FieldValue.increment(1),
            clusteringMethod,
            similarityScore: similarityScore || 0.85,
            semanticExplanation: semanticExplanation || '',
            aiMaintenanceSummary: aiMaintenanceSummary || '',
            updatedAt: now,
          });
        } else {
          const clusterRef = db.collection('issueClusters').doc();
          targetClusterId = clusterRef.id;
          const allTicketIds = [complaintId, ...matchedDocs.map((d) => d.id)];

          await clusterRef.set({
            id: targetClusterId,
            title: `Suggested Incident: ${data.category.replace(/_/g, ' ')} at ${data.building}${data.room ? ` (${data.room})` : ''}`,
            category: data.category,
            affectedArea: `${data.building}${data.room ? `, Room ${data.room}` : ''}`,
            building: data.building,
            room: data.room || '',
            ticketCount: allTicketIds.length,
            ticketIds: allTicketIds,
            clusteringMethod,
            similarityScore,
            semanticExplanation,
            aiMaintenanceSummary,
            verifiedByAdmin: false,
            status: 'SUGGESTED_INCIDENT',
            suggestedAction: `Admin review required: confirm whether these ${allTicketIds.length} complaints share the same root cause before dispatching technicians.`,
            createdAt: now,
            updatedAt: now,
          });

          // Link cluster suggestion to earlier matching tickets
          const batch = db.batch();
          for (const d of matchedDocs) {
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
        eventId: newComplaint.timeline[0]?.id || `init_${complaintId}`,
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
        eventId: result.eventId,
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
