/**
 * SolveSphere AI — Firestore Sample Data Inventory & Dry-Run Audit Tool
 * 
 * Safety & Integrity Standards:
 * - Strictly READ-ONLY. Zero writes and zero deletes under all conditions.
 * - Categorizes records by explicit provenance (`isSampleData: true`) vs. ambiguous title markers.
 * - Produces an audit inventory report (`sample-data-inventory-report.json`) for institution review.
 * - Live cleanup is NOT implemented in this tool; any future cleanup requires separate
 *   written owner authorization, full database backup, and explicit document ID targeting.
 * 
 * Usage:
 *   # Emulator scan:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/inventory-sample-data.js
 * 
 *   # Production / Staging dry-run audit:
 *   GCLOUD_PROJECT=my-institution-project node scripts/inventory-sample-data.js
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
 * Validates the inventory target environment.
 * Rejects any destructive command-line flags.
 */
export function validateInventoryConfig(env = process.env, argv = process.argv) {
  if (argv.includes('--cleanup') || argv.includes('--delete') || env.EXECUTE_SAMPLE_CLEANUP === 'true') {
    throw new Error(
      'REFUSED: inventory-sample-data.js is strictly read-only. Executable deletion capabilities have been removed. ' +
      'To manage live Firestore data, follow the verified owner-authorized procedure in docs/DATA_INVENTORY_AND_CLEANUP.md.'
    );
  }

  const isEmulator = Boolean(env.FIRESTORE_EMULATOR_HOST);
  const projectId = (env.GCLOUD_PROJECT || env.FIREBASE_PROJECT_ID || '').trim();

  return {
    isEmulator,
    projectId: projectId || (isEmulator ? 'solvesphere-ai-dev' : 'default'),
    readOnly: true,
  };
}

/**
 * Identifies documents with explicit, verified sample/demo provenance flags.
 */
export function isExplicitSampleDocument(data = {}) {
  if (data.isSampleData === true) return true;
  if (data.isDemoFixture === true) return true;
  if (data.sampleRecord === true) return true;
  return false;
}

/**
 * Identifies documents that have suspicious or ambiguous title/name markers
 * (e.g., contains "[DEMO]") but lack explicit provenance flags.
 * These are reported separately for manual administrative inspection.
 */
export function isAmbiguousDocument(data = {}) {
  if (isExplicitSampleDocument(data)) return false;
  if (typeof data.title === 'string' && /\[DEMO\]/i.test(data.title)) return true;
  if (typeof data.name === 'string' && /\[DEMO\]/i.test(data.name)) return true;
  return false;
}

/**
 * Scans collections in a strictly non-destructive manner.
 */
export async function scanFirestoreSampleData(db) {
  const inventory = {
    scannedAt: new Date().toISOString(),
    totalCollectionsScanned: MONITORED_COLLECTIONS.length,
    summary: {
      totalDocumentsCount: 0,
      explicitSampleCount: 0,
      ambiguousCount: 0,
      productionCount: 0,
    },
    collections: {},
  };

  for (const colName of MONITORED_COLLECTIONS) {
    const snap = await db.collection(colName).get();
    const explicitDocs = [];
    const ambiguousDocs = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const docSummary = {
        id: doc.id,
        titleOrName: data.title || data.name || data.code || doc.id,
        createdAt: data.createdAt || data.submittedAt || null,
      };

      if (isExplicitSampleDocument(data)) {
        explicitDocs.push({
          ...docSummary,
          provenance: 'EXPLICIT_SAMPLE_DATA',
          isSampleData: Boolean(data.isSampleData),
        });
      } else if (isAmbiguousDocument(data)) {
        ambiguousDocs.push({
          ...docSummary,
          provenance: 'AMBIGUOUS_NAME_CONTAINS_DEMO',
        });
      }
    }

    const prodCount = snap.size - explicitDocs.length - ambiguousDocs.length;

    inventory.collections[colName] = {
      totalDocuments: snap.size,
      explicitSampleDocuments: explicitDocs,
      explicitSampleCount: explicitDocs.length,
      ambiguousDocuments: ambiguousDocs,
      ambiguousCount: ambiguousDocs.length,
      productionCount: prodCount,
    };

    inventory.summary.totalDocumentsCount += snap.size;
    inventory.summary.explicitSampleCount += explicitDocs.length;
    inventory.summary.ambiguousCount += ambiguousDocs.length;
    inventory.summary.productionCount += prodCount;
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

  console.log('='.repeat(75));
  console.log(' SOLVESPHERE AI — FIRESTORE READ-ONLY DATA INVENTORY TOOL');
  console.log('='.repeat(75));
  console.log(` Target Project : ${config.projectId}`);
  console.log(` Mode           : STRICTLY READ-ONLY (No mutations, No deletes)`);
  console.log(` Target Host    : ${config.isEmulator ? 'Local Firebase Emulator' : 'Cloud Firestore'}`);
  console.log('='.repeat(75));

  console.log('\n[1/2] Scanning collections for explicit vs. ambiguous records...');
  const inventory = await scanFirestoreSampleData(db);

  console.log('\nScan Results Breakdown:');
  console.log('-'.repeat(75));
  console.log(
    'Collection'.padEnd(22) +
    'Total'.padEnd(12) +
    'Explicit Sample'.padEnd(18) +
    'Ambiguous'.padEnd(12) +
    'Production'
  );
  console.log('-'.repeat(75));

  for (const [colName, stats] of Object.entries(inventory.collections)) {
    console.log(
      colName.padEnd(22) +
      String(stats.totalDocuments).padEnd(12) +
      String(stats.explicitSampleCount).padEnd(18) +
      String(stats.ambiguousCount).padEnd(12) +
      String(stats.productionCount)
    );
  }
  console.log('-'.repeat(75));
  console.log(`Total Scanned         : ${inventory.summary.totalDocumentsCount}`);
  console.log(`Explicit Sample (Safe): ${inventory.summary.explicitSampleCount}`);
  console.log(`Ambiguous Provenance  : ${inventory.summary.ambiguousCount}`);
  console.log(`Genuine Production    : ${inventory.summary.productionCount}\n`);

  // Write output report
  const reportPath = path.resolve(process.cwd(), 'sample-data-inventory-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(inventory, null, 2), 'utf-8');
  console.log(`[2/2] Audit inventory report written to:\n  -> ${reportPath}\n`);
  console.log('Zero database writes or deletes were performed.');
}

// Execute when invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('\n[FATAL ERROR]', err.message);
    process.exit(1);
  });
}
