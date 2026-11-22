import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateInventoryConfig,
  isExplicitSampleDocument,
  isAmbiguousDocument,
} from '../scripts/inventory-sample-data.js';

test('Inventory Tool: strictly read-only on emulator', () => {
  const config = validateInventoryConfig({
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  }, []);

  assert.equal(config.readOnly, true);
  assert.equal(config.isEmulator, true);
});

test('Inventory Tool: strictly read-only in production', () => {
  const config = validateInventoryConfig({
    GCLOUD_PROJECT: 'campus-production-proj',
  }, []);

  assert.equal(config.readOnly, true);
  assert.equal(config.isEmulator, false);
  assert.equal(config.projectId, 'campus-production-proj');
});

test('Inventory Tool: rejects any destructive command-line flags or environment variables', () => {
  assert.throws(
    () => {
      validateInventoryConfig({ GCLOUD_PROJECT: 'proj' }, ['--cleanup']);
    },
    /REFUSED: inventory-sample-data\.js is strictly read-only/
  );

  assert.throws(
    () => {
      validateInventoryConfig({ GCLOUD_PROJECT: 'proj' }, ['--delete']);
    },
    /REFUSED: inventory-sample-data\.js is strictly read-only/
  );

  assert.throws(
    () => {
      validateInventoryConfig({ GCLOUD_PROJECT: 'proj', EXECUTE_SAMPLE_CLEANUP: 'true' }, []);
    },
    /REFUSED: inventory-sample-data\.js is strictly read-only/
  );
});

test('Inventory Tool: source code contains zero database deletion statements', () => {
  const scriptContent = fs.readFileSync(path.resolve('scripts/inventory-sample-data.js'), 'utf-8');
  assert.ok(!scriptContent.includes('.delete()'), 'Must not call .delete()');
  assert.ok(!scriptContent.includes('recursiveDelete'), 'Must not use recursive delete');
});

test('Inventory Tool: correctly distinguishes explicit sample provenance from ambiguous titles', () => {
  // Explicit sample documents
  assert.equal(isExplicitSampleDocument({ isSampleData: true }), true);
  assert.equal(isExplicitSampleDocument({ isDemoFixture: true }), true);
  assert.equal(isExplicitSampleDocument({ sampleRecord: true }), true);
  assert.equal(isExplicitSampleDocument({ title: 'Robotics [DEMO] Club' }), false);

  // Ambiguous documents (contains [DEMO] without explicit provenance)
  assert.equal(isAmbiguousDocument({ title: 'CS101 [DEMO] Slides' }), true);
  assert.equal(isAmbiguousDocument({ name: 'Robotics [DEMO] Club' }), true);
  assert.equal(isAmbiguousDocument({ isSampleData: true, title: 'CS101 [DEMO] Slides' }), false); // Already classified as explicit

  // Genuine production records
  assert.equal(isExplicitSampleDocument({ title: 'Advanced Algorithms', credits: 4 }), false);
  assert.equal(isAmbiguousDocument({ title: 'Advanced Algorithms', credits: 4 }), false);
  assert.equal(isExplicitSampleDocument({ name: 'Department of Electrical Engineering' }), false);
  assert.equal(isAmbiguousDocument({ name: 'Department of Electrical Engineering' }), false);
});
