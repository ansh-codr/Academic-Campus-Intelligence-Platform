import admin from 'firebase-admin';
import { NotificationType } from '@solvesphere/shared';

interface CreateNotificationParams {
  userId: string;
  ticketId: string;
  referenceNumber: string;
  type: NotificationType;
  title: string;
  message: string;
}

export async function sendInAppNotification(
  db: admin.firestore.Firestore,
  params: CreateNotificationParams
): Promise<string> {
  const notifRef = db.collection('notifications').doc();
  const now = new Date().toISOString();

  await notifRef.set({
    id: notifRef.id,
    userId: params.userId,
    ticketId: params.ticketId,
    referenceNumber: params.referenceNumber,
    type: params.type,
    title: params.title,
    message: params.message,
    read: false,
    createdAt: now,
  });

  return notifRef.id;
}
