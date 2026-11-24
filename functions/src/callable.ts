import admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { CallableOptions, CallableRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';

// GCLOUD_PROJECT is available at runtime. FIREBASE_CONFIG is also supplied during discovery.
const project = process.env.GCLOUD_PROJECT || JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
const cors: (string | RegExp)[] = project
  ? [`https://${project}.web.app`, `https://${project}.firebaseapp.com`]
  : [];
if (process.env.FUNCTIONS_EMULATOR === 'true') cors.push(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);
export const callableOptions: CallableOptions = {
  cors,
  enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true',
};

export const docId = z.string().min(1).max(128).regex(/^[^/]+$/);
export function parseInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new HttpsError('invalid-argument', result.error.issues[0].message);
  return result.data;
}

// Apply one shared per-user budget across endpoints, including reads and admin writes.
export function campusCallable<T>(options: CallableOptions, handle: (request: CallableRequest) => Promise<T>) {
  return onCall(options, async request => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to continue.');
    if (request.rawRequest.rawBody.length > 256 * 1024) throw new HttpsError('invalid-argument', 'Request is too large.');
    const ref = admin.firestore().collection('callableUsage').doc(request.auth.uid);
    const minute = Math.floor(Date.now() / 60000);
    await admin.firestore().runTransaction(async transaction => {
      const usage = (await transaction.get(ref)).data();
      const count = usage?.minute === minute ? usage.count : 0;
      if (count >= 120) throw new HttpsError('resource-exhausted', 'Too many requests. Try again in a minute.');
      transaction.set(ref, { minute, count: count + 1 });
    });
    return handle(request);
  });
}
