import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const rawAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Fail fast in production if required Firebase configuration is missing or placeholder
if (import.meta.env.PROD && import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'true') {
  if (!rawApiKey || rawApiKey === 'demo-placeholder' || rawApiKey.includes('<')) {
    throw new Error('CRITICAL: VITE_FIREBASE_API_KEY is missing or contains placeholder in production build. Application startup halted.');
  }
  if (!rawProjectId || rawProjectId === 'solvesphere-ai-dev' || rawProjectId.includes('<')) {
    throw new Error('CRITICAL: VITE_FIREBASE_PROJECT_ID is missing or targeting placeholder project in production build. Application startup halted.');
  }
}

/** Only public Firebase web configuration belongs in VITE_* environment variables. */
const config = {
  apiKey: rawApiKey || 'demo-placeholder',
  authDomain: rawAuthDomain || 'solvesphere-ai-dev.firebaseapp.com',
  projectId: rawProjectId || 'solvesphere-ai-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'solvesphere-ai-dev.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'solvesphere-demo-placeholder',
};

export const app = getApps().length ? getApp() : initializeApp(config);
const siteKey = import.meta.env.VITE_APP_CHECK_SITE_KEY;
if (siteKey && import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'true') {
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true });
}
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  // Hot module replacement must not reconnect already-configured emulators.
  const globalKey = '__solvesphereEmulatorsConnected';
  const state = globalThis as typeof globalThis & { [key: string]: unknown };
  if (!state[globalKey]) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    state[globalKey] = true;
  }
}
