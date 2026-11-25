import type { IncomingMessage, ServerResponse } from 'node:http';
import admin from 'firebase-admin';
import * as functionsBundle from './functions.bundle.js';

interface VercelApiRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  body: any;
}

interface VercelApiResponse extends ServerResponse {
  status: (statusCode: number) => VercelApiResponse;
  json: (data: any) => void;
  send: (data: any) => void;
}

// Singleton initialization for Firebase Admin SDK
function initFirebaseAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'solvesphere-ai-dev-2026';

  let certObject: any = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      const jsonStr = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      certObject = JSON.parse(jsonStr);
    } catch (err: any) {
      console.error('[Vercel API] Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', err.message);
    }
  } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    certObject = {
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  // If already initialized with valid credentials, preserve it
  if (admin.apps.length > 0) {
    const existing = admin.app();
    if (existing.options && existing.options.credential && (existing.options.credential as any).certificate) {
      return;
    }
    // Delete uncredentialed app
    try {
      existing.delete();
    } catch {}
  }

  if (certObject && certObject.private_key) {
    admin.initializeApp({
      credential: admin.credential.cert(certObject),
      projectId: certObject.project_id || projectId,
    });
    return;
  }

  if (!admin.apps.length) {
    admin.initializeApp({ projectId });
  }
}

initFirebaseAdmin();

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  let fnName = Array.isArray(req.query?.fn) ? req.query.fn[0] : req.query?.fn;
  if (!fnName && req.url) {
    const cleanPath = req.url.split('?')[0];
    const parts = cleanPath.split('/').filter(Boolean);
    fnName = parts[parts.length - 1];
  }

  if (!fnName) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: { message: 'Missing function name in request route.', status: 'INVALID_ARGUMENT' }
    }));
    return;
  }

  const targetFn = (functionsBundle as Record<string, any>)[fnName];
  if (!targetFn || typeof targetFn.run !== 'function') {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: { message: `Function "${fnName}" not found on server.`, status: 'NOT_FOUND' }
    }));
    return;
  }

  // Verify Firebase ID Token if Authorization header is present
  let authContext: { uid: string; token: admin.auth.DecodedIdToken } | undefined = undefined;
  const rawAuthHeader = req.headers.authorization || (req.headers as any)['Authorization'];
  if (typeof rawAuthHeader === 'string' && rawAuthHeader.startsWith('Bearer ')) {
    const token = rawAuthHeader.slice(7).trim();
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      authContext = {
        uid: decoded.uid,
        token: decoded,
      };
    } catch (authErr: any) {
      console.error(`[Vercel API] Token verification failed for "${fnName}":`, authErr.message);
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: {
          message: `Authentication verification failed: ${authErr.message}. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is configured in Vercel.`,
          status: 'unauthenticated',
        }
      }));
      return;
    }
  }

  // Parse payload data matching Firebase callable format: { data: ... }
  const data = req.body && typeof req.body === 'object' && 'data' in req.body
    ? req.body.data
    : req.body;

  const rawBodyBuffer = Buffer.from(
    typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body || {})
  );

  const callableRequest = {
    auth: authContext,
    data,
    rawRequest: {
      rawBody: rawBodyBuffer,
      headers: req.headers,
    },
  };

  try {
    const result = await targetFn.run(callableRequest);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ result }));
  } catch (error: any) {
    console.error(`[Vercel API] Error executing "${fnName}":`, error);

    const rawCode = String(error.code || 'internal').toLowerCase();
    const STATUS_MAP: Record<string, { http: number; canonical: string }> = {
      'ok': { http: 200, canonical: 'OK' },
      'cancelled': { http: 499, canonical: 'CANCELLED' },
      'unknown': { http: 500, canonical: 'UNKNOWN' },
      'invalid-argument': { http: 400, canonical: 'INVALID_ARGUMENT' },
      'deadline-exceeded': { http: 504, canonical: 'DEADLINE_EXCEEDED' },
      'not-found': { http: 404, canonical: 'NOT_FOUND' },
      'already-exists': { http: 409, canonical: 'ALREADY_EXISTS' },
      'permission-denied': { http: 403, canonical: 'PERMISSION_DENIED' },
      'resource-exhausted': { http: 429, canonical: 'RESOURCE_EXHAUSTED' },
      'failed-precondition': { http: 400, canonical: 'FAILED_PRECONDITION' },
      'aborted': { http: 409, canonical: 'ABORTED' },
      'out-of-range': { http: 400, canonical: 'OUT_OF_RANGE' },
      'unimplemented': { http: 501, canonical: 'UNIMPLEMENTED' },
      'internal': { http: 500, canonical: 'INTERNAL' },
      'unavailable': { http: 503, canonical: 'UNAVAILABLE' },
      'data-loss': { http: 500, canonical: 'DATA_LOSS' },
      'unauthenticated': { http: 401, canonical: 'UNAUTHENTICATED' },
    };

    const mapped = STATUS_MAP[rawCode] || {
      http: typeof error.httpErrorCode?.status === 'number' ? error.httpErrorCode.status : 500,
      canonical: rawCode.toUpperCase().replace(/-/g, '_'),
    };

    res.statusCode = mapped.http;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: {
        message: error.message || 'Internal server error occurred.',
        status: mapped.canonical,
        details: error.details,
      }
    }));
  }
}
