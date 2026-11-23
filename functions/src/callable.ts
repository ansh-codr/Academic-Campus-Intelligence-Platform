import { HttpsError } from 'firebase-functions/v2/https';
import type { CallableOptions } from 'firebase-functions/v2/https';
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
