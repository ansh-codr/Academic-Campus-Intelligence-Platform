/**
 * SolveSphere AI — Administrative Bootstrap Tool
 * 
 * Securely provisions or elevates an Administrator account in Firebase Auth.
 * Sets custom claim: { role: 'ADMIN' }
 * Updates the Firestore document in `users/{uid}`.
 * 
 * Safety & Security Guards:
 * - Rejects weak, known example, and placeholder passwords.
 * - Prevents unconfirmed provisioning against live Firebase projects.
 * - Requires explicit project identification in production.
 * 
 * Usage:
 *   # Local Emulator Mode (default when emulators are running):
 *   ADMIN_EMAIL="admin@campus.edu" ADMIN_PASSWORD="MySecureDevPassword123!" node scripts/bootstrap-admin.js
 * 
 *   # Live Production Mode (strictly requires deliberate authorization):
 *   CONFIRM_PROD_ADMIN_BOOTSTRAP=true \
 *   GCLOUD_PROJECT="my-prod-project" \
 *   ADMIN_EMAIL="admin@institution.edu" \
 *   ADMIN_PASSWORD="MyHighEntropyProductionPassword987!" \
 *   node scripts/bootstrap-admin.js
 */

import admin from 'firebase-admin';

const BANNED_EXAMPLE_PASSWORDS = [
  'solvesphereadmin@2026',
  'password123',
  'password',
  'admin123',
  'admin',
  'solvesphere',
  'campusadmin',
  'letmein',
  'qwerty',
  '12345678',
  'change_me',
];

/**
 * Validates bootstrap configuration and enforces security policies.
 * Exported for deterministic unit testing.
 */
export function validateAdminBootstrapConfig(env = process.env) {
  const isEmulator = Boolean(env.FIREBASE_AUTH_EMULATOR_HOST || env.FIRESTORE_EMULATOR_HOST);
  const email = (env.ADMIN_EMAIL || '').trim();
  const password = (env.ADMIN_PASSWORD || '').trim();
  const projectId = (env.GCLOUD_PROJECT || env.FIREBASE_PROJECT_ID || '').trim();

  if (!isEmulator) {
    // 1. Enforce explicit authorization for live project execution
    if (env.CONFIRM_PROD_ADMIN_BOOTSTRAP !== 'true') {
      throw new Error(
        'AUTHORIZATION REQUIRED: Live administrator account bootstrap requires explicit confirmation. ' +
        'Set CONFIRM_PROD_ADMIN_BOOTSTRAP="true" along with real target project credentials.'
      );
    }

    // 2. Enforce real project ID
    if (!projectId || projectId.includes('<') || projectId === 'solvesphere-ai-dev') {
      throw new Error(
        `INVALID PROJECT ID: Live bootstrap requires an explicitly configured production or staging project ID, got: "${projectId}"`
      );
    }

    // 3. Enforce explicit email
    if (!email || !email.includes('@') || email.includes('<')) {
      throw new Error('INVALID EMAIL: A valid ADMIN_EMAIL is required for live administrator bootstrap.');
    }

    // 4. Enforce high-entropy password policy in live environments
    if (!password) {
      throw new Error('PASSWORD REQUIRED: ADMIN_PASSWORD must be provided for live administrator bootstrap.');
    }

    if (password.includes('<') || password.includes('REPLACE_WITH')) {
      throw new Error('REJECTED: ADMIN_PASSWORD contains an unreplaced placeholder value.');
    }

    const lowerPw = password.toLowerCase();
    for (const banned of BANNED_EXAMPLE_PASSWORDS) {
      if (lowerPw.includes(banned)) {
        throw new Error(`INSECURE PASSWORD: "${password}" contains a known example or weak password pattern.`);
      }
    }

    if (password.length < 12) {
      throw new Error(`INSUFFICIENT COMPLEXITY: Administrator password must be at least 12 characters (length: ${password.length}).`);
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasDigit || !hasSymbol) {
      throw new Error('INSUFFICIENT COMPLEXITY: Administrator password must contain uppercase, lowercase, numbers, and symbols.');
    }
  } else {
    // Emulator mode checks
    if (password && (password.includes('<') || password.includes('REPLACE_WITH'))) {
      throw new Error('REJECTED: ADMIN_PASSWORD contains an unreplaced placeholder value.');
    }
  }

  return {
    isEmulator,
    email: email || 'admin@campus.edu',
    password: password || 'DevAdminTestPassword@2026',
    fullName: env.ADMIN_NAME || 'Dr. Vikram Malhotra',
    projectId: projectId || 'solvesphere-ai-dev',
  };
}

async function bootstrapAdmin() {
  const config = validateAdminBootstrapConfig(process.env);

  if (config.isEmulator) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    console.log(`[Bootstrap] Running against Firebase Emulators:`);
    console.log(`  Auth:      ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
    console.log(`  Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else {
    console.log(`[Bootstrap] Targeting LIVE project: ${config.projectId}`);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: config.projectId,
    });
  }

  const auth = admin.auth();
  const db = admin.firestore();

  console.log(`\n======================================================`);
  console.log(`  SolveSphere AI — Admin Account Bootstrap`);
  console.log(`  Target Email: ${config.email}`);
  console.log(`  Environment:  ${config.isEmulator ? 'EMULATOR' : 'LIVE CLOUD'}`);
  console.log(`======================================================\n`);

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(config.email);
    console.log(`✓ Existing Firebase Auth user found: ${userRecord.uid}`);
    if (config.password) {
      if (config.isEmulator || process.env.OVERWRITE_EXISTING_ADMIN_PASSWORD === 'true') {
        await auth.updateUser(userRecord.uid, { password: config.password });
        console.log(`✓ Password updated for existing account.`);
      } else {
        console.log(`ℹ Preserving existing account password in live environment (set OVERWRITE_EXISTING_ADMIN_PASSWORD="true" to update).`);
      }
    }
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`Creating new Firebase Auth user for ${config.email}...`);
      userRecord = await auth.createUser({
        email: config.email,
        password: config.password,
        displayName: config.fullName,
      });
      console.log(`✓ User created with UID: ${userRecord.uid}`);
    } else {
      throw error;
    }
  }

  // Set Custom Claims for Admin Role (preserving any unrelated existing custom claims)
  console.log(`Setting custom claim { role: 'ADMIN' } on UID: ${userRecord.uid}...`);
  const existingClaims = userRecord.customClaims || {};
  await auth.setCustomUserClaims(userRecord.uid, { ...existingClaims, role: 'ADMIN' });
  console.log(`✓ Custom claims set successfully.`);

  // Write/Update Firestore profile in `users/{uid}`
  console.log(`Updating Firestore document users/${userRecord.uid}...`);
  await db.collection('users').doc(userRecord.uid).set(
    {
      id: userRecord.uid,
      email: config.email,
      fullName: config.fullName,
      role: 'ADMIN',
      department: 'Central Administration',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`✓ Firestore user profile updated.`);

  // Write privacy-safe audit record
  await db.collection('adminAuditLogs').add({
    action: 'ADMIN_PROVISIONED',
    targetUid: userRecord.uid,
    targetEmail: config.email,
    timestamp: new Date().toISOString(),
    environment: config.isEmulator ? 'EMULATOR' : 'LIVE',
  });

  console.log(`\n======================================================`);
  console.log(`  Admin account provisioned successfully!`);
  console.log(`  UID:   ${userRecord.uid}`);
  console.log(`  Email: ${config.email}`);
  console.log(`  Role:  ADMIN`);
  console.log(`======================================================\n`);
  process.exit(0);
}

// Only auto-run if directly invoked as main script
const isMainScript = process.argv[1] && process.argv[1].endsWith('bootstrap-admin.js');
if (isMainScript) {
  bootstrapAdmin().catch((err) => {
    console.error('\n✖ Fatal error in bootstrap-admin:', err.message || err);
    process.exit(1);
  });
}
