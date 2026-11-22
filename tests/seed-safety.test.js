/**
 * SolveSphere AI — Database Seed Safety Verification Suite
 * 
 * Verifies that database seeding is strictly prevented from executing
 * against live Firestore or production projects without explicit, deliberate migration authorization.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSeedTarget } from '../scripts/seed-firebase.js';

test('validateSeedTarget allows execution when FIRESTORE_EMULATOR_HOST is set', () => {
  const env = {
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
    GCLOUD_PROJECT: 'solvesphere-ai-dev',
  };

  const result = validateSeedTarget(env);
  assert.equal(result.isEmulator, true);
  assert.equal(result.firestoreHost, '127.0.0.1:8080');
});

test('validateSeedTarget REFUSES execution when FIRESTORE_EMULATOR_HOST is unset', () => {
  const env = {
    GCLOUD_PROJECT: 'solvesphere-production',
  };

  assert.throws(
    () => validateSeedTarget(env),
    /REFUSED: seed-firebase\.js is strictly restricted to the Firebase Emulator Suite/
  );
});

test('validateSeedTarget REFUSES execution when GOOGLE_APPLICATION_CREDENTIALS is set without emulator', () => {
  const env = {
    GOOGLE_APPLICATION_CREDENTIALS: '/path/to/prod-service-account.json',
    GCLOUD_PROJECT: 'solvesphere-production',
  };

  assert.throws(
    () => validateSeedTarget(env),
    /NEVER inferred from GOOGLE_APPLICATION_CREDENTIALS/
  );
});

test('validateSeedTarget REFUSES live execution if ALLOW_LIVE_DATABASE_MIGRATION is not true', () => {
  const env = {
    CONFIRM_MIGRATION_PROJECT_ID: 'solvesphere-staging',
    GCLOUD_PROJECT: 'solvesphere-staging',
  };

  assert.throws(
    () => validateSeedTarget(env),
    /REFUSED: seed-firebase\.js is strictly restricted to the Firebase Emulator Suite/
  );
});

test('validateSeedTarget REFUSES live execution if CONFIRM_MIGRATION_PROJECT_ID contains placeholder', () => {
  const env = {
    ALLOW_LIVE_DATABASE_MIGRATION: 'true',
    CONFIRM_MIGRATION_PROJECT_ID: '<YOUR_PROJECT_ID>',
    GCLOUD_PROJECT: '<YOUR_PROJECT_ID>',
  };

  assert.throws(
    () => validateSeedTarget(env),
    /REFUSED: seed-firebase\.js is strictly restricted to the Firebase Emulator Suite/
  );
});

test('validateSeedTarget REFUSES live execution if CONFIRM_MIGRATION_PROJECT_ID mismatches GCLOUD_PROJECT', () => {
  const env = {
    ALLOW_LIVE_DATABASE_MIGRATION: 'true',
    CONFIRM_MIGRATION_PROJECT_ID: 'prod-project-a',
    GCLOUD_PROJECT: 'prod-project-b',
  };

  assert.throws(
    () => validateSeedTarget(env),
    /does not match active project/
  );
});

test('validateSeedTarget permits live migration ONLY with deliberate, matching authorization', () => {
  const env = {
    ALLOW_LIVE_DATABASE_MIGRATION: 'true',
    CONFIRM_MIGRATION_PROJECT_ID: 'solvesphere-staging-real',
    GCLOUD_PROJECT: 'solvesphere-staging-real',
  };

  const result = validateSeedTarget(env);
  assert.equal(result.isEmulator, false);
  assert.equal(result.projectId, 'solvesphere-staging-real');
});
