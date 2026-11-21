/**
 * SolveSphere AI — Administrative Bootstrap Tool
 * 
 * Securely provisions or elevates an Administrator account in Firebase Auth.
 * Sets custom claim: { role: 'ADMIN' }
 * Updates the Firestore document in `users/{uid}`.
 * 
 * Usage:
 *   ADMIN_EMAIL="admin@campus.edu" ADMIN_PASSWORD="Password123" node scripts/bootstrap-admin.js
 */

import admin from 'firebase-admin';

// Check if running against emulator
if (process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  console.log(`[Bootstrap] Running against Firebase Emulators:`);
  console.log(`  Auth:      ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
  console.log(`  Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'solvesphere-ai-dev',
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@campus.edu';
  const password = process.env.ADMIN_PASSWORD || 'SolveSphereAdmin@2026';
  const fullName = process.env.ADMIN_NAME || 'Dr. Vikram Malhotra';
  const studentId = 'ADM-8802';

  console.log(`\n======================================================`);
  console.log(`  SolveSphere AI — Admin Account Bootstrap`);
  console.log(`  Target Email: ${email}`);
  console.log(`======================================================\n`);

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`✓ Existing Firebase Auth user found: ${userRecord.uid}`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`Creating new Firebase Auth user for ${email}...`);
      userRecord = await auth.createUser({
        email,
        password,
        displayName: fullName,
      });
      console.log(`✓ User created with UID: ${userRecord.uid}`);
    } else {
      throw error;
    }
  }

  // Set Custom Claims for Admin Role
  console.log(`Setting custom claim { role: 'ADMIN' } on UID: ${userRecord.uid}...`);
  await auth.setCustomUserClaims(userRecord.uid, { role: 'ADMIN' });
  console.log(`✓ Custom claims set successfully.`);

  // Write/Update Firestore profile in `users/{uid}`
  console.log(`Updating Firestore document users/${userRecord.uid}...`);
  await db.collection('users').doc(userRecord.uid).set(
    {
      id: userRecord.uid,
      email,
      fullName,
      studentId,
      role: 'ADMIN',
      department: 'Academic Affairs & Campus Operations',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`✓ Firestore user profile updated.`);

  console.log(`\n======================================================`);
  console.log(`  Admin account provisioned successfully!`);
  console.log(`  UID:   ${userRecord.uid}`);
  console.log(`  Email: ${email}`);
  console.log(`  Role:  ADMIN`);
  console.log(`======================================================\n`);
  process.exit(0);
}

bootstrapAdmin().catch((err) => {
  console.error('Fatal error in bootstrap-admin:', err);
  process.exit(1);
});
