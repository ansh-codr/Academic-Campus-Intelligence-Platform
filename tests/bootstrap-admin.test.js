/**
 * SolveSphere AI — Administrative Bootstrap Safety Unit Tests
 * 
 * Verifies that the administrator bootstrapping tool rejects insecure example
 * passwords, placeholder tokens, and unconfirmed live executions.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAdminBootstrapConfig } from '../scripts/bootstrap-admin.js';

test('validateAdminBootstrapConfig allows local emulator with default dev credentials', () => {
  const env = {
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    GCLOUD_PROJECT: 'solvesphere-ai-dev',
  };

  const config = validateAdminBootstrapConfig(env);
  assert.equal(config.isEmulator, true);
  assert.equal(config.email, 'admin@campus.edu');
});

test('validateAdminBootstrapConfig rejects placeholder passwords in emulator mode', () => {
  const env = {
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    ADMIN_PASSWORD: '<GENERATE_DEV_ADMIN_PASSWORD_MIN_12_CHARS>',
  };

  assert.throws(
    () => validateAdminBootstrapConfig(env),
    /contains an unreplaced placeholder value/
  );
});

test('validateAdminBootstrapConfig REFUSES live execution without CONFIRM_PROD_ADMIN_BOOTSTRAP=true', () => {
  const env = {
    GCLOUD_PROJECT: 'solvesphere-prod-real',
    ADMIN_EMAIL: 'admin@campus.edu',
    ADMIN_PASSWORD: 'ValidPassword123!@#',
  };

  assert.throws(
    () => validateAdminBootstrapConfig(env),
    /Live administrator account bootstrap requires explicit confirmation/
  );
});

test('validateAdminBootstrapConfig REFUSES live execution with placeholder or dev project ID', () => {
  const env = {
    CONFIRM_PROD_ADMIN_BOOTSTRAP: 'true',
    GCLOUD_PROJECT: 'solvesphere-ai-dev',
    ADMIN_EMAIL: 'admin@campus.edu',
    ADMIN_PASSWORD: 'ValidPassword123!@#',
  };

  assert.throws(
    () => validateAdminBootstrapConfig(env),
    /Live bootstrap requires an explicitly configured production or staging project ID/
  );
});

test('validateAdminBootstrapConfig REJECTS known example passwords in live execution', () => {
  const weakPasswords = [
    'SolveSphereAdmin@2026',
    'password123',
    'admin123',
    'solvesphere',
  ];

  for (const pw of weakPasswords) {
    const env = {
      CONFIRM_PROD_ADMIN_BOOTSTRAP: 'true',
      GCLOUD_PROJECT: 'solvesphere-prod-real',
      ADMIN_EMAIL: 'admin@campus.edu',
      ADMIN_PASSWORD: pw,
    };

    assert.throws(
      () => validateAdminBootstrapConfig(env),
      /contains a known example or weak password pattern/
    );
  }
});

test('validateAdminBootstrapConfig REJECTS short or low-complexity passwords in live execution', () => {
  const lowComplexity = [
    'short1!',             // < 12 chars
    'alllowercase123!',    // missing uppercase
    'ALLUPPERCASE123!',    // missing lowercase
    'NoDigitsHere!@#ABC',  // missing digits
    'NoSymbols12345Abc',   // missing symbols
  ];

  for (const pw of lowComplexity) {
    const env = {
      CONFIRM_PROD_ADMIN_BOOTSTRAP: 'true',
      GCLOUD_PROJECT: 'solvesphere-prod-real',
      ADMIN_EMAIL: 'admin@campus.edu',
      ADMIN_PASSWORD: pw,
    };

    assert.throws(
      () => validateAdminBootstrapConfig(env),
      /INSUFFICIENT COMPLEXITY/
    );
  }
});

test('validateAdminBootstrapConfig ACCEPTS high-entropy credentials when deliberately confirmed', () => {
  const env = {
    CONFIRM_PROD_ADMIN_BOOTSTRAP: 'true',
    GCLOUD_PROJECT: 'solvesphere-production-001',
    ADMIN_EMAIL: 'chief-admin@campus.edu',
    ADMIN_PASSWORD: 'Str0ng!P@ssw0rd#2026CampusSecure',
    ADMIN_NAME: 'Chancellor Williams',
  };

  const config = validateAdminBootstrapConfig(env);
  assert.equal(config.isEmulator, false);
  assert.equal(config.projectId, 'solvesphere-production-001');
  assert.equal(config.email, 'chief-admin@campus.edu');
  assert.equal(config.password, 'Str0ng!P@ssw0rd#2026CampusSecure');
});
