import admin from 'firebase-admin';
import { NotificationType } from '@solvesphere/shared';

interface CreateNotificationParams {
  userId: string;
  ticketId: string;
  referenceNumber: string;
  type: NotificationType;
  title: string;
  message: string;
  idempotencyKey?: string;
}

/**
 * Dispatches an in-app notification with idempotency protection.
 * If a notification with the deterministic key already exists (e.g. upon function retries),
 * the operation is safely skipped without generating duplicate alerts.
 */
export async function sendInAppNotification(
  db: admin.firestore.Firestore,
  params: CreateNotificationParams
): Promise<string> {
  const notifId = params.idempotencyKey || `${params.ticketId}_${params.type}`;
  const notifRef = db.collection('notifications').doc(notifId);
  const now = new Date().toISOString();

  const existing = await notifRef.get();
  if (existing.exists) {
    return notifId;
  }

  await notifRef.set({
    id: notifId,
    userId: params.userId,
    ticketId: params.ticketId,
    referenceNumber: params.referenceNumber,
    type: params.type,
    title: params.title,
    message: params.message,
    read: false,
    createdAt: now,
  });

  return notifId;
}
