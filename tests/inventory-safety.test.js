import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInventoryConfig, isSampleDocument } from '../scripts/inventory-sample-data.js';

test('Inventory Tool: defaults to dry-run read-only mode on emulator', () => {
  const config = validateInventoryConfig({
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  }, []);

  assert.equal(config.executeCleanup, false);
  assert.equal(config.isEmulator, true);
});

test('Inventory Tool: defaults to dry-run read-only mode in production', () => {
  const config = validateInventoryConfig({
    GCLOUD_PROJECT: 'campus-production-proj',
  }, []);

  assert.equal(config.executeCleanup, false);
  assert.equal(config.isEmulator, false);
  assert.equal(config.projectId, 'campus-production-proj');
});

test('Inventory Tool: rejects cleanup if CONFIRM_CLEANUP_PROJECT_ID is missing or mismatched', () => {
  assert.throws(
    () => {
      validateInventoryConfig({
        GCLOUD_PROJECT: 'campus-production-proj',
        EXECUTE_SAMPLE_CLEANUP: 'true',
      }, []);
    },
    /REFUSED: Live sample data cleanup requires CONFIRM_CLEANUP_PROJECT_ID/
  );

  assert.throws(
    () => {
      validateInventoryConfig({
        GCLOUD_PROJECT: 'campus-production-proj',
        CONFIRM_CLEANUP_PROJECT_ID: 'wrong-project',
        EXECUTE_SAMPLE_CLEANUP: 'true',
      }, []);
    },
    /REFUSED: Live sample data cleanup requires CONFIRM_CLEANUP_PROJECT_ID/
  );
});

test('Inventory Tool: correctly identifies sample documents', () => {
  assert.equal(isSampleDocument('doc-1', { isSampleData: true }), true);
  assert.equal(isSampleDocument('doc-2', { isDemoFixture: true }), true);
  assert.equal(isSampleDocument('doc-3', { title: 'CS101 [DEMO] Slides' }), true);
  assert.equal(isSampleDocument('doc-4', { name: 'Robotics [DEMO] Club' }), true);

  // Production records must be false
  assert.equal(isSampleDocument('doc-real', { title: 'Advanced Algorithms', credits: 4 }), false);
  assert.equal(isSampleDocument('doc-real-2', { name: 'Department of Electrical Engineering' }), false);
});
