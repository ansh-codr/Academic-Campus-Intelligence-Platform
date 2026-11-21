import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

/** Only public Firebase web configuration belongs in VITE_* environment variables. */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-placeholder',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'solvesphere-ai-dev.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'solvesphere-ai-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'solvesphere-ai-dev.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'solvesphere-demo-placeholder',
};
export const app = getApps().length ? getApp() : initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
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
