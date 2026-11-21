import admin from 'firebase-admin';
import { NotificationType } from '@solvesphere/shared';

export interface CreateNotificationParams {
  userId: string;
  ticketId: string;
  referenceNumber: string;
  type: NotificationType;
  title: string;
  message: string;
  eventId?: string;
  idempotencyKey?: string;
}

/**
 * Dispatches an in-app notification with atomic idempotency protection.
 * Uses a unique, stable event ID corresponding to a real ticket lifecycle transition.
 * Uses Firestore document atomic create() to guarantee that retrying the same event
 * or concurrent executions will never generate duplicate notifications.
 * Two distinct lifecycle events on the same ticket produce separate notifications.
 */
export async function sendInAppNotification(
  db: admin.firestore.Firestore,
  params: CreateNotificationParams
): Promise<string> {
  const notifId = params.eventId
    ? `notif_${params.ticketId}_${params.eventId}`
    : params.idempotencyKey || `notif_${params.ticketId}_${params.type}_${Date.now()}`;

  const notifRef = db.collection('notifications').doc(notifId);
  const now = new Date().toISOString();

  try {
    // Atomic create guarantees only one notification per event even under high concurrency
    await notifRef.create({
      id: notifId,
      userId: params.userId,
      ticketId: params.ticketId,
      referenceNumber: params.referenceNumber,
      type: params.type,
      title: params.title,
      message: params.message,
      eventId: params.eventId || null,
      read: false,
      createdAt: now,
    });
  } catch (err: any) {
    // If the notification for this unique event already exists (code 6: ALREADY_EXISTS in gRPC),
    // safely ignore and return the existing notification ID without duplicating
    if (err.code === 6 || err.code === 'already-exists' || /already exists/i.test(err.message)) {
      return notifId;
    }
    throw err;
  }

  return notifId;
}

