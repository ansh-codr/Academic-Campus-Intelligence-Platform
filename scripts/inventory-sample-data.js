/**
 * SolveSphere AI — Firestore Sample Data Inventory & Dry-Run Audit Tool
 * 
 * Safety & Integrity Standards:
 * - Read-only / Dry-run by default.
 * - ZERO deletion of live Firestore documents unless explicitly authorized by
 *   the institution owner with multi-step parameter confirmation.
 * - Scans collections for documents containing `isSampleData: true` or fixture markers.
 * - Emits a structured JSON audit inventory of all detected sample records.
 * 
 * Usage:
 *   # Dry-run audit on emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/inventory-sample-data.js
 * 
 *   # Dry-run audit on staging/production project:
 *   GCLOUD_PROJECT=my-institution-project node scripts/inventory-sample-data.js
 * 
 *   # Authorized cleanup on target project (requires explicit multi-flag confirmation):
 *   GCLOUD_PROJECT=my-institution-project \
 *   CONFIRM_CLEANUP_PROJECT_ID=my-institution-project \
 *   EXECUTE_SAMPLE_CLEANUP=true \
 *   node scripts/inventory-sample-data.js
 */

import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

export const MONITORED_COLLECTIONS = [
  'subjects',
  'syllabusTopics',
  'resources',
  'quizzes',
  'departments',
  'campusClubs',
  'complaints',
  'issueClusters',
  'publicIncidents',
];

/**
 * Validates the execution mode and target project.
 */
export function validateInventoryConfig(env = process.env, argv = process.argv) {
  const isEmulator = Boolean(env.FIRESTORE_EMULATOR_HOST);
  const projectId = (env.GCLOUD_PROJECT || env.FIREBASE_PROJECT_ID || '').trim();
  const executeCleanup = env.EXECUTE_SAMPLE_CLEANUP === 'true' || argv.includes('--cleanup');

  if (executeCleanup) {
    if (isEmulator) {
      return { isEmulator: true, projectId: 'emulator', executeCleanup: true };
    }

    const confirmProject = (env.CONFIRM_CLEANUP_PROJECT_ID || '').trim();
    if (!confirmProject || confirmProject !== projectId || projectId.includes('<')) {
      throw new Error(
        `REFUSED: Live sample data cleanup requires CONFIRM_CLEANUP_PROJECT_ID matching active GCLOUD_PROJECT ("${projectId}").`
      );
    }

    return { isEmulator: false, projectId, executeCleanup: true };
  }

  return {
    isEmulator,
    projectId: projectId || (isEmulator ? 'solvesphere-ai-dev' : 'default'),
    executeCleanup: false,
  };
}

/**
 * Determines whether a Firestore document is flagged or recognizable as sample/demo data.
 */
export function isSampleDocument(docId, data = {}) {
  if (data.isSampleData === true) return true;
  if (data.isDemoFixture === true) return true;
  if (data.sampleRecord === true) return true;
  if (typeof data.title === 'string' && data.title.includes('[DEMO]')) return true;
  if (typeof data.name === 'string' && data.name.includes('[DEMO]')) return true;
  return false;
}

/**
 * Executes the inventory scan across all target collections.
 */
export async function scanFirestoreSampleData(db) {
  const inventory = {
    scannedAt: new Date().toISOString(),
    totalCollectionsScanned: MONITORED_COLLECTIONS.length,
    sampleDocumentsCount: 0,
    collections: {},
  };

  for (const colName of MONITORED_COLLECTIONS) {
    const snap = await db.collection(colName).get();
    const sampleDocs = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      if (isSampleDocument(doc.id, data)) {
        sampleDocs.push({
          id: doc.id,
          titleOrName: data.title || data.name || data.code || doc.id,
          isSampleData: Boolean(data.isSampleData),
          createdAt: data.createdAt || data.submittedAt || null,
        });
      }
    }

    inventory.collections[colName] = {
      totalDocuments: snap.size,
      sampleDocuments: sampleDocs,
      sampleCount: sampleDocs.length,
    };
    inventory.sampleDocumentsCount += sampleDocs.length;
  }

  return inventory;
}

/**
 * Main CLI runner
 */
async function main() {
  const config = validateInventoryConfig();

  if (!admin.apps.length) {
    if (config.isEmulator) {
      admin.initializeApp({ projectId: config.projectId });
    } else {
      admin.initializeApp();
    }
  }

  const db = admin.firestore();

  console.log('='.repeat(70));
  console.log(' SOLVESPHERE AI — FIRESTORE SAMPLE DATA INVENTORY TOOL');
  console.log('='.repeat(70));
  console.log(` Target Project : ${config.projectId}`);
  console.log(` Mode           : ${config.executeCleanup ? 'AUTHORIZED CLEANUP' : 'DRY-RUN INVENTORY (No Writes/Deletes)'}`);
  console.log(` Target Host    : ${config.isEmulator ? 'Local Firebase Emulator' : 'Cloud Firestore'}`);
  console.log('='.repeat(70));

  console.log('\n[1/2] Scanning collections for sample & demo records...');
  const inventory = await scanFirestoreSampleData(db);

  console.log('\nScan Results Summary:');
  console.log('-'.repeat(70));
  console.log(
    'Collection'.padEnd(25) +
    'Total Docs'.padEnd(15) +
    'Sample Docs'.padEnd(15) +
    'Production Docs'
  );
  console.log('-'.repeat(70));

  for (const [colName, stats] of Object.entries(inventory.collections)) {
    const prodCount = stats.totalDocuments - stats.sampleCount;
    console.log(
      colName.padEnd(25) +
      String(stats.totalDocuments).padEnd(15) +
      String(stats.sampleCount).padEnd(15) +
      String(prodCount)
    );
  }
  console.log('-'.repeat(70));
  console.log(`Total sample records identified: ${inventory.sampleDocumentsCount}\n`);

  // Write output report
  const reportPath = path.resolve(process.cwd(), 'sample-data-inventory-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(inventory, null, 2), 'utf-8');
  console.log(`[2/2] Detailed audit report written to:\n  -> ${reportPath}\n`);

  if (!config.executeCleanup) {
    console.log('Dry-run completed successfully. Zero documents were modified or deleted.');
    return;
  }

  // If cleanup was explicitly authorized:
  console.log('WARNING: Commencing owner-authorized cleanup of sample records...');
  let deletedCount = 0;
  for (const [colName, stats] of Object.entries(inventory.collections)) {
    for (const sDoc of stats.sampleDocuments) {
      await db.collection(colName).doc(sDoc.id).delete();
      deletedCount++;
    }
  }
  console.log(`Cleanup complete. Deleted ${deletedCount} verified sample documents.`);
}

// Execute when invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('\n[FATAL ERROR]', err.message);
    process.exit(1);
  });
}
