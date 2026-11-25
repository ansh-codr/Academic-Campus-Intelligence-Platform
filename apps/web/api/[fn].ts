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
  if (admin.apps.length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'solvesphere-ai-dev-2026';

  // 1. Raw Service Account JSON key
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
        projectId: parsed.project_id || projectId,
      });
      return;
    } catch (err: any) {
      console.error('[Vercel API] Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', err.message);
    }
  }

  // 2. Individual Service Account Environment Variables
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId,
    });
    return;
  }

  // 3. Fallback to default ADC / project configuration
  admin.initializeApp({ projectId });
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
      console.warn(`[Vercel API] Token verification failed for "${fnName}":`, authErr.message);
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

    const httpCode = error.httpErrorCode?.status || (error.code === 'unauthenticated' ? 401 : error.code === 'permission-denied' ? 403 : 500);
    res.statusCode = typeof httpCode === 'number' && httpCode >= 400 && httpCode < 600 ? httpCode : 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: {
        message: error.message || 'Internal server error occurred.',
        status: error.code || 'INTERNAL',
      }
    }));
  }
}
