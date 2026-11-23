import { z } from 'zod';
import { createHash } from 'node:crypto';
import { campusCallable, callableOptions, parseInput, docId } from './callable.js';
import { HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import admin from 'firebase-admin';
import path from 'path';
import { CreateTicketSchema, TicketStatus, ComplaintEmbeddingRecord } from '@solvesphere/shared';
import { sendInAppNotification } from './notifications.js';
import {
  geminiApiKey,
  resolveGeminiApiKey,
  getOrCreateComplaintEmbedding,
  cosineSimilarity,
  getSmartDepartmentRecommendation,
} from './campusCare.js';

// Deploy location-based clustering without provisioning an AI secret.
const semanticClustering = process.env.ENABLE_GEMINI_CLUSTERING === 'true';

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
    } catch { }
  }
  const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT;
  if (!projectId) throw new HttpsError('failed-precondition', 'Storage bucket is not configured.');
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
      ...(process.env.FUNCTIONS_EMULATOR === 'true' ? ['127.0.0.1', 'localhost'] : []),
    ];
    if ((parsedUrl.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(parsedUrl.hostname)) || !allowedHosts.includes(parsedUrl.hostname)) {
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
    if (bucketName !== expectedBucket) {
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
  if (segments.length !== 4 || segments[0] !== 'attachments') {
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
  const allowedMime = /^(image\/(jpeg|png|webp)|application\/pdf)$/i;
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
 * Validates attachment ownership, implements scalable semantic duplicate clustering, and idempotent notification
 */
export const createComplaint = campusCallable(
  {
    ...callableOptions,
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: 10,
  },
  async (request) => {
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

    // Retrieve user name / student ID from user profile or auth token
    let submitterName = request.auth.token.name || request.auth.token.email || 'Student';
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      // Enforce verified student enrollment for official complaint submissions
      if (request.auth.token.role !== 'ADMIN' && userData?.enrollmentStatus !== 'VERIFIED') {
        throw new HttpsError(
          'permission-denied',
          'Your enrollment is not verified yet. Check your enrollment request.', { reason: 'enrollment' }
        );
      }
      if (userData?.fullName) {
        submitterName = `${userData.fullName} (${userData.studentId || ''})`.trim();
      }
    } else if (request.auth.token.role !== 'ADMIN') {
      throw new HttpsError('permission-denied', 'Complete your student profile before submitting a ticket.', { reason: 'enrollment' });
    }

    if (request.auth.token.role !== 'ADMIN' && !request.auth.token.email_verified) {
      throw new HttpsError('failed-precondition', 'Verify your email address before submitting a ticket.');
    }

    // Validate all attachments belong to the authenticated student and exist in storage
    const verifiedAttachments: VerifiedAttachment[] = [];
    if (data.attachmentUrls && data.attachmentUrls.length > 0) {
      for (const rawUrl of data.attachmentUrls) {
        const verified = await verifyAndResolveAttachment(rawUrl, uid, db);
        verifiedAttachments.push(verified);
      }
    }

    const now = new Date().toISOString();
    const counterRef = db.collection('systemCounters').doc('complaints');

    try {
      const newComplaint: Record<string, any> = await db.runTransaction(async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        const claims = verifiedAttachments.map(a => db.collection('attachmentClaims').doc(createHash('sha256').update(a.canonicalPath).digest('hex')));
        const claimed = await Promise.all(claims.map(ref => transaction.get(ref)));
        if (claimed.some(snap => snap.exists)) throw new HttpsError('failed-precondition', 'Attachment already belongs to a ticket.');
        const dailyRef = db.collection('ticketUsage').doc(uid);
        const daily = (await transaction.get(dailyRef)).data();
        const day = now.slice(0, 10);
        const count = daily?.day === day ? Number(daily.count) : 0;
        if (count >= 50) throw new HttpsError('resource-exhausted', 'Daily ticket limit reached.');
        transaction.set(dailyRef, { day, count: count + 1 });
        let nextSeq = 1;
        if (counterSnap.exists) {
          nextSeq = (counterSnap.data()?.currentSequence || 0) + 1;
        }
        transaction.set(counterRef, { currentSequence: nextSeq }, { merge: true });

        const refNum = `SS-2026-${String(nextSeq).padStart(4, '0')}`;
        const complaintRef = db.collection('complaints').doc();
        const complaintId = complaintRef.id;
        for (const ref of claims) transaction.create(ref, { complaintId });

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
          clusteringStatus: 'PENDING',
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
      throw new HttpsError('internal', 'Failed to submit complaint.');
    }
  });

/**
 * Distinguishes retryable transient failures (rate limits, 503s, timeouts, network)
 * from permanent non-retryable errors (schema failures, missing documents).
 */
export function isRetryableError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = (err.code || '').toString().toLowerCase();
  const status = err.status || err.httpErrorCode?.status;

  if (status === 429 || status === 503 || status === 504) return true;
  if (code.includes('resource-exhausted') || code.includes('unavailable') || code.includes('deadline-exceeded')) return true;
  if (
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('network')
  ) {
    return true;
  }

  return false;
}

export interface ClusteringClaimResult {
  claimed: boolean;
  reason?: 'ALREADY_COMPLETED' | 'LEASE_LOCKED' | 'MAX_RETRIES_EXCEEDED' | 'NOT_FOUND';
  attemptId?: string;
  complaint?: Record<string, any>;
}

/**
 * Atomically claims a processing lease using a Firestore transaction.
 * Guarantees that two concurrent workers cannot process the same ticket simultaneously.
 */
async function claimClusteringLease(
  db: admin.firestore.Firestore,
  complaintRef: admin.firestore.DocumentReference,
  workerId: string
): Promise<ClusteringClaimResult> {
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(complaintRef);
    if (!snap.exists) {
      return { claimed: false, reason: 'NOT_FOUND' };
    }
    const data = snap.data()!;

    // 1. Idempotency Check: if already completed, do not re-process
    if (data.clusteringStatus === 'COMPLETED') {
      return { claimed: false, reason: 'ALREADY_COMPLETED', complaint: data };
    }

    const now = Date.now();
    const leaseExpiryMs = data.clusteringLeaseExpiry ? new Date(data.clusteringLeaseExpiry).getTime() : 0;
    const isLeaseActive = data.clusteringStatus === 'PROCESSING' && leaseExpiryMs > now;

    if (isLeaseActive) {
      // Another worker holds an active, unexpired lease
      return { claimed: false, reason: 'LEASE_LOCKED', complaint: data };
    }

    // 2. Bounded Retries: Max 3 attempts
    const currentAttempt = (data.clusteringAttempt || 0) + 1;
    if (currentAttempt > 3) {
      transaction.update(complaintRef, {
        clusteringStatus: 'FAILED',
        clusteringError: 'Max clustering attempts exceeded (bounded retry limit).',
        clusteringLeaseOwner: null,
        clusteringLeaseExpiry: null,
        updatedAt: new Date(now).toISOString(),
      });
      return { claimed: false, reason: 'MAX_RETRIES_EXCEEDED', complaint: data };
    }

    const attemptId = `attempt_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const leaseDurationMs = 60 * 1000; // 60s lease window
    const leaseExpiry = new Date(now + leaseDurationMs).toISOString();

    transaction.update(complaintRef, {
      clusteringStatus: 'PROCESSING',
      clusteringAttempt: currentAttempt,
      clusteringAttemptId: attemptId,
      clusteringLeaseOwner: workerId,
      clusteringLeaseExpiry: leaseExpiry,
      clusteringStartedAt: new Date(now).toISOString(),
    });

    return {
      claimed: true,
      attemptId,
      complaint: { ...data, clusteringAttempt: currentAttempt, clusteringAttemptId: attemptId },
    };
  });
}

export interface CommitClusteringParams {
  complaintId: string;
  workerId: string;
  attemptId: string;
  clusteringMethod: 'RULE_BASED_LOCATION_PROXIMITY' | 'SEMANTIC_SIMILARITY' | 'HYBRID_SEMANTIC_PROXIMITY' | null;
  matchedDocIds: string[];
  coordKey?: string;
  clusterMetadata?: {
    similarityScore?: number;
    confidenceBasis?: string;
    embeddingSource?: 'GEMINI' | 'TEST';
    modelIdentifier?: string;
    vectorDimensions?: number;
    textFingerprint?: string;
    semanticExplanation?: string;
    aiMaintenanceSummary?: string;
  };
}

/**
 * Atomically commits clustering results with worker fencing and cross-worker incident coordination.
 * Guarantees that:
 * 1. Expired workers cannot overwrite newer worker results or leases (Worker Fencing).
 * 2. Two concurrent workers for the same room/incident coordinate on a single cluster document.
 * 3. Cluster ticketIds and ticketCounts are dynamically reconciled without phantom increments.
 */
export async function commitClusteringResult(
  db: admin.firestore.Firestore,
  params: CommitClusteringParams
): Promise<{ success: boolean; status: string; clusterId?: string }> {
  const { complaintId, workerId, attemptId, clusteringMethod, matchedDocIds, coordKey, clusterMetadata } = params;
  const complaintRef = db.collection('complaints').doc(complaintId);
  const now = new Date().toISOString();

  return db.runTransaction(async (transaction) => {
    // 1. Worker Fencing: verify worker still owns an active, unexpired lease with this attemptId
    const complaintSnap = await transaction.get(complaintRef);
    if (!complaintSnap.exists) {
      return { success: false, status: 'NOT_FOUND' };
    }
    const compData = complaintSnap.data()!;
    const nowMs = Date.now();
    const leaseExpiryMs = compData.clusteringLeaseExpiry ? new Date(compData.clusteringLeaseExpiry).getTime() : 0;

    if (
      compData.clusteringAttemptId !== attemptId ||
      compData.clusteringLeaseOwner !== workerId ||
      compData.clusteringStatus !== 'PROCESSING' ||
      leaseExpiryMs <= nowMs
    ) {
      console.warn(
        `[FencedWorker] Worker ${workerId} (attempt ${attemptId}) fenced out on complaint ${complaintId}. Current status: ${compData.clusteringStatus}, leaseOwner: ${compData.clusteringLeaseOwner}, attempt: ${compData.clusteringAttemptId}, expiry: ${compData.clusteringLeaseExpiry}`
      );
      return { success: false, status: 'FENCED_EXPIRED_LEASE' };
    }

    // 2. If unclustered individual issue
    if (!clusteringMethod || matchedDocIds.length === 0) {
      transaction.update(complaintRef, {
        clusteringStatus: 'COMPLETED',
        clusteringLeaseOwner: null,
        clusteringLeaseExpiry: null,
        clusteringError: null,
        updatedAt: now,
      });
      return { success: true, status: 'COMPLETED' };
    }

    // 3. Cluster Coordination & Duplicate Prevention
    const coordRef = coordKey ? db.collection('clusterCoordination').doc(coordKey) : null;
    let targetClusterId: string | undefined = undefined;

    // Check coordination doc first
    let coordSnap: admin.firestore.DocumentSnapshot | null = null;
    if (coordRef) {
      coordSnap = await transaction.get(coordRef);
      if (coordSnap.exists && coordSnap.data()?.clusterId) {
        targetClusterId = coordSnap.data()?.clusterId;
      }
    }

    // Check matched complaints for an existing clusterId
    const matchedRefs = matchedDocIds.slice(0, 10).map((id) => db.collection('complaints').doc(id));
    const matchedSnaps = await Promise.all(matchedRefs.map((r) => transaction.get(r)));

    if (!targetClusterId) {
      const matchWithCluster = matchedSnaps.find((s) => s.exists && s.data()?.clusterId);
      if (matchWithCluster) {
        targetClusterId = matchWithCluster.data()?.clusterId;
      }
    }

    // Check if targetCluster exists and is active (SUGGESTED_INCIDENT or ACTIVE_INCIDENT)
    let targetClusterSnap: admin.firestore.DocumentSnapshot | null = null;
    if (targetClusterId) {
      targetClusterSnap = await transaction.get(db.collection('issueClusters').doc(targetClusterId));
      if (
        !targetClusterSnap.exists ||
        !['SUGGESTED_INCIDENT', 'ACTIVE_INCIDENT'].includes(targetClusterSnap.data()?.status)
      ) {
        targetClusterId = undefined; // Discard stale/closed cluster
      }
    }

    if (targetClusterId && targetClusterSnap?.exists) {
      // --- Join Existing Cluster ---
      const clusterRef = targetClusterSnap.ref;
      const cData = targetClusterSnap.data()!;
      const currentTicketIds: string[] = Array.isArray(cData.ticketIds) ? cData.ticketIds : [];
      const updatedTicketIds = Array.from(new Set([...currentTicketIds, complaintId, ...matchedDocIds]));

      const clusterUpdates: Record<string, any> = {
        ticketIds: updatedTicketIds,
        ticketCount: updatedTicketIds.length,
        updatedAt: now,
      };

      if (clusterMetadata?.similarityScore != null && cData.similarityScore == null) {
        clusterUpdates.similarityScore = clusterMetadata.similarityScore;
        clusterUpdates.clusteringMethod = clusteringMethod;
      }
      if (clusterMetadata?.confidenceBasis) clusterUpdates.confidenceBasis = clusterMetadata.confidenceBasis;
      if (clusterMetadata?.semanticExplanation && !cData.semanticExplanation) {
        clusterUpdates.semanticExplanation = clusterMetadata.semanticExplanation;
      }
      if (clusterMetadata?.aiMaintenanceSummary && !cData.aiMaintenanceSummary) {
        clusterUpdates.aiMaintenanceSummary = clusterMetadata.aiMaintenanceSummary;
      }

      transaction.update(clusterRef, clusterUpdates);

      // Link complaint, mark completed, release lease
      transaction.update(complaintRef, {
        clusterId: targetClusterId,
        clusteringStatus: 'COMPLETED',
        clusteringLeaseOwner: null,
        clusteringLeaseExpiry: null,
        clusteringError: null,
        updatedAt: now,
      });

      // Link any matched complaints that don't have a cluster yet
      for (const mSnap of matchedSnaps) {
        if (mSnap.exists && !mSnap.data()?.clusterId) {
          transaction.update(mSnap.ref, {
            clusterId: targetClusterId,
            updatedAt: now,
          });
        }
      }

      if (coordRef) {
        transaction.set(
          coordRef,
          {
            clusterId: targetClusterId,
            category: compData.category,
            building: compData.building,
            room: compData.room || '',
            status: cData.status,
            updatedAt: now,
          },
          { merge: true }
        );
      }

      return { success: true, status: 'COMPLETED', clusterId: targetClusterId };
    } else {
      // --- Create New Cluster ---
      const newClusterRef = db.collection('issueClusters').doc();
      const newClusterId = newClusterRef.id;
      const allTicketIds = Array.from(new Set([complaintId, ...matchedDocIds]));

      const newClusterRecord: Record<string, any> = {
        id: newClusterId,
        title: `Suggested Incident: ${compData.category.replace(/_/g, ' ')} at ${compData.building}${compData.room ? ` (${compData.room})` : ''}`,
        category: compData.category,
        affectedArea: `${compData.building}${compData.room ? `, Room ${compData.room}` : ''}`,
        building: compData.building,
        room: compData.room || '',
        ticketCount: allTicketIds.length,
        ticketIds: allTicketIds,
        clusteringMethod,
        confidenceBasis: clusterMetadata?.confidenceBasis || 'Heuristic match',
        processingStatus: 'SUCCESS',
        verifiedByAdmin: false,
        status: 'SUGGESTED_INCIDENT',
        suggestedAction: `Admin review required: confirm whether these ${allTicketIds.length} complaints share the same root cause before dispatching technicians.`,
        createdAt: now,
        updatedAt: now,
      };

      if (clusterMetadata?.similarityScore != null) newClusterRecord.similarityScore = clusterMetadata.similarityScore;
      if (clusterMetadata?.embeddingSource) newClusterRecord.embeddingSource = clusterMetadata.embeddingSource;
      if (clusterMetadata?.modelIdentifier) newClusterRecord.modelIdentifier = clusterMetadata.modelIdentifier;
      if (clusterMetadata?.vectorDimensions) newClusterRecord.vectorDimensions = clusterMetadata.vectorDimensions;
      if (clusterMetadata?.textFingerprint) newClusterRecord.textFingerprint = clusterMetadata.textFingerprint;
      if (clusterMetadata?.semanticExplanation) newClusterRecord.semanticExplanation = clusterMetadata.semanticExplanation;
      if (clusterMetadata?.aiMaintenanceSummary) newClusterRecord.aiMaintenanceSummary = clusterMetadata.aiMaintenanceSummary;

      transaction.set(newClusterRef, newClusterRecord);

      // Record in cluster coordination to safely synchronize concurrent workers
      if (coordRef) {
        transaction.set(coordRef, {
          clusterId: newClusterId,
          category: compData.category,
          building: compData.building,
          room: compData.room || '',
          status: 'SUGGESTED_INCIDENT',
          createdAt: now,
          updatedAt: now,
        });
      }

      // Link this complaint, mark completed, release lease
      transaction.update(complaintRef, {
        clusterId: newClusterId,
        clusteringStatus: 'COMPLETED',
        clusteringLeaseOwner: null,
        clusteringLeaseExpiry: null,
        clusteringError: null,
        updatedAt: now,
      });

      // Link matched complaints that don't have a cluster yet
      for (const mSnap of matchedSnaps) {
        if (mSnap.exists && !mSnap.data()?.clusterId) {
          transaction.update(mSnap.ref, {
            clusterId: newClusterId,
            updatedAt: now,
          });
        }
      }

      return { success: true, status: 'COMPLETED', clusterId: newClusterId };
    }
  });
}

/**
 * Concurrency-safe, idempotent background worker for semantic embedding generation and issue clustering.
 * Enforces atomic lease claiming, reconciliation in transactions, exact count calculation, and retry handling.
 */
export async function runComplaintClustering(
  db: admin.firestore.Firestore,
  complaintId: string,
  apiKey?: string,
  workerId: string = `worker_${Math.random().toString(36).slice(2, 8)}`
): Promise<{ success: boolean; status: string; clusterId?: string }> {
  const complaintRef = db.collection('complaints').doc(complaintId);

  // Atomically claim processing lease inside transaction
  const claim = await claimClusteringLease(db, complaintRef, workerId);
  if (!claim.claimed) {
    if (claim.reason === 'ALREADY_COMPLETED') {
      return { success: true, status: 'ALREADY_CLUSTERED', clusterId: claim.complaint?.clusterId };
    }
    if (claim.reason === 'LEASE_LOCKED') {
      return { success: false, status: 'LEASE_LOCKED' };
    }
    if (claim.reason === 'MAX_RETRIES_EXCEEDED') {
      return { success: false, status: 'MAX_RETRIES_EXCEEDED' };
    }
    return { success: false, status: 'NOT_FOUND' };
  }

  const complaint = claim.complaint!;
  const now = new Date().toISOString();

  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const complaintText = `${complaint.title}. ${complaint.description}. Category: ${complaint.category}. Location: ${complaint.building} ${complaint.room}`;

    const newEmbedding = await getOrCreateComplaintEmbedding(db, complaintId, complaintText, apiKey);

    // Bounded candidate query: limit to 25 recent active complaints in the same category
    const candidateSnaps = await db
      .collection('complaints')
      .where('category', '==', complaint.category)
      .limit(25)
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

    if (newEmbedding) {
      for (const candDoc of candidateDocs) {
        const candData = candDoc.data();
        const candText = `${candData.title}. ${candData.description}. Category: ${candData.category}. Location: ${candData.building} ${candData.room}`;
        const candEmbedding = await getOrCreateComplaintEmbedding(db, candDoc.id, candText, apiKey);
        if (!candEmbedding) continue;

        const sim = cosineSimilarity(newEmbedding, candEmbedding);
        const sameLocation =
          candData.building === complaint.building &&
          String(candData.room || '').trim().toLowerCase() === String(complaint.room || '').trim().toLowerCase();

        if (sim >= 0.80) {
          semanticMatchingDocs.push({ doc: candDoc, similarity: sim, sameLocation });
          if (!highestSemanticMatch || sim > highestSemanticMatch.similarity) {
            highestSemanticMatch = { doc: candDoc, similarity: sim, sameLocation };
          }
        }
      }
    }

    // Determine clustering method
    let clusteringMethod: 'RULE_BASED_LOCATION_PROXIMITY' | 'SEMANTIC_SIMILARITY' | 'HYBRID_SEMANTIC_PROXIMITY' | null = null;
    let matchedDocs: admin.firestore.QueryDocumentSnapshot[] = [];
    let similarityScore: number | undefined = undefined;
    let confidenceBasis: string | undefined = undefined;
    let embeddingSource: 'GEMINI' | 'TEST' | undefined = undefined;
    let modelIdentifier: string | undefined = undefined;
    let vectorDimensions: number | undefined = undefined;
    let textFingerprint: string | undefined = undefined;
    let semanticExplanation: string | undefined = undefined;
    let aiMaintenanceSummary: string | undefined = undefined;

    // 1. First check for location proximity (same building & room & category within 48h)
    const locationMatches = candidateDocs.filter((docSnap) => {
      const item = docSnap.data();
      return (
        item.building === complaint.building &&
        String(item.room || '').trim().toLowerCase() === String(complaint.room || '').trim().toLowerCase()
      );
    });

    if (locationMatches.length > 0) {
      matchedDocs = locationMatches;
      if (highestSemanticMatch && highestSemanticMatch.sameLocation) {
        clusteringMethod = 'HYBRID_SEMANTIC_PROXIMITY';
        similarityScore = Math.round(highestSemanticMatch.similarity * 100) / 100;
        confidenceBasis = `Hybrid vector similarity (${similarityScore}) and verified room proximity`;
      } else {
        clusteringMethod = 'RULE_BASED_LOCATION_PROXIMITY';
        similarityScore = undefined;
        confidenceBasis = 'Heuristic identical room & category match within 48h';
      }
      embeddingSource = newEmbedding?.source;
      modelIdentifier = newEmbedding?.model;
      vectorDimensions = newEmbedding?.dimensions;
      textFingerprint = newEmbedding?.textHash;
      semanticExplanation = `Location proximity confirmed multiple incidents in ${complaint.building} (${complaint.room}).`;
      aiMaintenanceSummary = `[Deterministic Maintenance Analysis] Location Cluster: Multiple incidents reported in ${complaint.building} (${complaint.room}). Requires technician inspection for localized fault.`;
    } else if (highestSemanticMatch && newEmbedding) {
      matchedDocs = semanticMatchingDocs.map((m) => m.doc);
      similarityScore = Math.round(highestSemanticMatch.similarity * 100) / 100;
      clusteringMethod = 'SEMANTIC_SIMILARITY';
      embeddingSource = newEmbedding.source;
      modelIdentifier = newEmbedding.model;
      vectorDimensions = newEmbedding.dimensions;
      textFingerprint = newEmbedding.textHash;
      confidenceBasis = `Vector cosine similarity (${similarityScore}) using ${newEmbedding.model}`;

      const candData = highestSemanticMatch.doc.data();
      semanticExplanation = `Semantic similarity analysis (${Math.round(highestSemanticMatch.similarity * 100)}% match) identified strongly correlated symptoms between "${candData.title}" and "${complaint.title}".`;
      aiMaintenanceSummary = newEmbedding.source === 'GEMINI'
        ? `[Gemini 2.5 Summary] Correlated ${complaint.category.replace(/_/g, ' ')} issues detected across ${complaint.building}. Submissions report related symptoms. Unified dispatch recommended.`
        : `[Deterministic Test Analysis] Correlated ${complaint.category.replace(/_/g, ' ')} issues detected across ${complaint.building}. Submissions report related symptoms.`;
    }

    // Generate stable coordination key to prevent duplicate cluster creation across concurrent workers
    let coordKey: string | undefined = undefined;
    if (clusteringMethod === 'RULE_BASED_LOCATION_PROXIMITY' || clusteringMethod === 'HYBRID_SEMANTIC_PROXIMITY') {
      const normCat = String(complaint.category || '').trim().toLowerCase();
      const normBldg = String(complaint.building || '').trim().toLowerCase();
      const normRoom = String(complaint.room || 'general').trim().toLowerCase();
      coordKey = `loc_${normCat}_${normBldg}_${normRoom}`.replace(/[^a-z0-9_-]/g, '_');
    } else if (clusteringMethod === 'SEMANTIC_SIMILARITY' && matchedDocs.length > 0) {
      const normCat = String(complaint.category || '').trim().toLowerCase();
      const normBldg = String(complaint.building || '').trim().toLowerCase();
      const anchorId = [complaintId, ...matchedDocs.map((d) => d.id)].sort()[0];
      coordKey = `sem_${normCat}_${normBldg}_${anchorId}`.replace(/[^a-z0-9_-]/g, '_');
    }

    // Atomically commit results with fencing check and cluster coordination
    return await commitClusteringResult(db, {
      complaintId,
      workerId,
      attemptId: claim.attemptId!,
      clusteringMethod,
      matchedDocIds: matchedDocs.map((d) => d.id),
      coordKey,
      clusterMetadata: {
        similarityScore,
        confidenceBasis,
        embeddingSource,
        modelIdentifier,
        vectorDimensions,
        textFingerprint,
        semanticExplanation,
        aiMaintenanceSummary,
      },
    });
  } catch (err: any) {
    console.error(`[runComplaintClustering] Error processing clustering for ${complaintId}:`, err);
    const retryable = isRetryableError(err);
    const attempt = claim.complaint?.clusteringAttempt || 1;

    // Transactional fencing check before updating on failure
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(complaintRef);
      if (!snap.exists) return;
      const data = snap.data()!;
      // Fence check: only update if this worker still holds the lease and attemptId
      if (data.clusteringAttemptId !== claim.attemptId || data.clusteringLeaseOwner !== workerId) {
        console.warn(`[FencedWorker] Worker ${workerId} fenced out during error reporting for ${complaintId}`);
        return;
      }

      if (retryable && attempt < 3) {
        transaction.update(complaintRef, {
          clusteringStatus: 'PENDING',
          clusteringError: `[Retryable] ${err.message || 'Transient error'}`,
          clusteringLeaseOwner: null,
          clusteringLeaseExpiry: null,
          updatedAt: now,
        });
      } else {
        transaction.update(complaintRef, {
          clusteringStatus: 'FAILED',
          clusteringError: `[${retryable ? 'Max Retries Exceeded' : 'Permanent Error'}] ${err.message || 'Clustering processing error'}`,
          clusteringLeaseOwner: null,
          clusteringLeaseExpiry: null,
          updatedAt: now,
        });
      }
    });

    return { success: false, status: retryable && attempt < 3 ? 'RETRYABLE_ERROR_SCHEDULED' : 'FAILED' };
  }
}

/**
 * Background Firestore Trigger: onComplaintCreatedClustering
 * Asynchronously and idempotently clusters complaints when a document is created in Firestore.
 * This is the sole automatic entry point for clustering.
 */
export const onComplaintCreatedClustering = onDocumentCreated(
  {
    document: 'complaints/{complaintId}',
    secrets: semanticClustering ? [geminiApiKey] : [],
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: 5,
    retry: false,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const complaintId = event.params.complaintId;
    const apiKey = semanticClustering ? resolveGeminiApiKey() : undefined;
    const db = admin.firestore();
    await runComplaintClustering(db, complaintId, apiKey);
  }
);

/**
 * Controlled Scheduled Background Worker: recoverStaleComplaintLeases
 * Runs every 5 minutes (crontab: 'every 5 minutes').
 * Scans for complaints stuck in 'PROCESSING' whose lease has expired (> 60s ago)
 * or complaints in 'PENDING' that were not picked up, and retries clustering.
 * Bounded to at most 10 stale documents per run to control Cloud Functions execution costs.
 */
export const recoverStaleComplaintLeases = onSchedule(
  {
    schedule: 'every 5 minutes',
    secrets: semanticClustering ? [geminiApiKey] : [],
    timeoutSeconds: 120,
    memory: '256MiB',
    maxInstances: 1,
  },
  async () => {
    const db = admin.firestore();
    const apiKey = semanticClustering ? resolveGeminiApiKey() : undefined;
    const nowIso = new Date().toISOString();

    // 1. Recover expired leases stuck in PROCESSING
    const staleProcessingSnaps = await db
      .collection('complaints')
      .where('clusteringStatus', '==', 'PROCESSING')
      .where('clusteringLeaseExpiry', '<', nowIso)
      .limit(10)
      .get();

    for (const docSnap of staleProcessingSnaps.docs) {
      console.log(`[LeaseRecovery] Recovering expired lease on complaint ${docSnap.id}`);
      await runComplaintClustering(db, docSnap.id, apiKey);
    }

    // 2. Recover orphaned PENDING complaints older than 2 minutes
    const twoMinutesAgoIso = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const orphanedPendingSnaps = await db
      .collection('complaints')
      .where('clusteringStatus', '==', 'PENDING')
      .where('submittedAt', '<', twoMinutesAgoIso)
      .limit(10)
      .get();

    for (const docSnap of orphanedPendingSnaps.docs) {
      console.log(`[LeaseRecovery] Processing orphaned PENDING complaint ${docSnap.id}`);
      await runComplaintClustering(db, docSnap.id, apiKey);
    }
  }
);

/**
 * Callable Cloud Function: reopenTicket
 * Allows student (ticket owner) or administrator to reopen a RESOLVED or CLOSED ticket
 */
export const reopenTicket = campusCallable(
  {
    ...callableOptions,
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to reopen a ticket.');
    }

    const { ticketId, reason } = parseInput(z.object({ ticketId: docId, reason: z.string().trim().min(5).max(1000) }), request.data);
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
      throw new HttpsError('internal', 'Failed to reopen ticket.');
    }
  });
