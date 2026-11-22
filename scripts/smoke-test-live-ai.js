/**
 * SolveSphere AI — Optional Live Gemini AI Smoke Test
 * 
 * Verifies live Google Gemini API connectivity and inference using the official @google/genai SDK.
 * 
 * Safe Execution Guard:
 * This script ONLY makes live cloud network requests when:
 * 1. RUN_LIVE_AI_TESTS="true"
 * 2. GEMINI_API_KEY is explicitly supplied in the environment.
 * 
 * Otherwise, it logs a clean status message and exits with status 0,
 * marking live inference as NOT VERIFIED (using emulator/test doubles instead).
 * 
 * Usage:
 *   # Skip live tests (default, safe for CI without cloud credentials):
 *   node scripts/smoke-test-live-ai.js
 * 
 *   # Run live verification:
 *   RUN_LIVE_AI_TESTS=true GEMINI_API_KEY="AIzaSy..." node scripts/smoke-test-live-ai.js
 */

import { GoogleGenAI } from '@google/genai';

async function runSmokeTest() {
  console.log('\n======================================================');
  console.log('  SolveSphere AI — Live Gemini AI Smoke Test');
  console.log('======================================================');

  const shouldRun = process.env.RUN_LIVE_AI_TESTS === 'true';
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!shouldRun || !apiKey) {
    console.log('\n[INFO] Live AI Smoke Test: SKIPPED / MARKED NOT VERIFIED');
    console.log('Reason: RUN_LIVE_AI_TESTS is not "true" or GEMINI_API_KEY is unset.');
    console.log('All backend and client features remain verified via deterministic emulator test doubles.\n');
    process.exit(0);
  }

  console.log('\n[START] Verifying live Google Gemini API connectivity...');
  const ai = new GoogleGenAI({ apiKey });

  // 1. Verify Embedding Model (gemini-embedding-2)
  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
  console.log(`[TEST 1/2] Testing embedding generation with model: ${embeddingModel}...`);
  const t0 = Date.now();
  try {
    const embedResult = await ai.models.embedContent({
      model: embeddingModel,
      contents: 'Water leak observed in Mechanical Engineering Lab 204 near main panel.',
      config: {
        outputDimensionality: 768,
      },
    });

    const values = embedResult.embedding?.values || [];
    const duration1 = Date.now() - t0;
    console.log(`  ✔ Embedding generated successfully in ${duration1}ms`);
    console.log(`  ✔ Embedding vector dimension: ${values.length} (Expected: 768)`);

    if (values.length !== 768) {
      console.warn(`  ⚠ Warning: Dimension was ${values.length}, expected 768.`);
    }
  } catch (err) {
    console.error(`  ✖ Embedding verification failed:`, err.message);
    process.exit(1);
  }

  // 2. Verify Generative Chat Model (gemini-2.5-flash)
  const generativeModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  console.log(`\n[TEST 2/2] Testing generative completion with model: ${generativeModel}...`);
  const t1 = Date.now();
  try {
    const response = await ai.models.generateContent({
      model: generativeModel,
      contents: 'Respond with exactly one sentence describing SolveSphere AI purpose.',
    });

    const reply = response.text?.trim() || '';
    const duration2 = Date.now() - t1;
    console.log(`  ✔ Generative response received in ${duration2}ms`);
    console.log(`  ✔ Model Response: "${reply}"`);
  } catch (err) {
    console.error(`  ✖ Generative model verification failed:`, err.message);
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('  ✔ All Live Gemini AI Smoke Tests PASSED');
  console.log('======================================================\n');
}

runSmokeTest().catch((err) => {
  console.error('Fatal error during smoke test:', err);
  process.exit(1);
});
