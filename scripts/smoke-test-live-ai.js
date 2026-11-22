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
 * explicitly marking live inference as NOT VERIFIED.
 * 
 * Usage:
 *   # Skip live tests (default, safe for CI without cloud credentials):
 *   node scripts/smoke-test-live-ai.js
 * 
 *   # Run live verification:
 *   RUN_LIVE_AI_TESTS=true GEMINI_API_KEY="AIzaSy..." node scripts/smoke-test-live-ai.js
 */

import { GoogleGenAI } from '@google/genai';

/**
 * Robustly parses and validates an embedding response from @google/genai.
 * Verifies:
 * - Proper SDK response structure (embedding.values or embeddings[0].values)
 * - Non-empty array
 * - Finite numerical elements (rejects NaN, Infinity, null, undefined)
 * - Expected vector dimension (e.g., 768 for gemini-embedding-2)
 * 
 * Exported for deterministic unit testing with controlled fixtures.
 */
export function parseEmbeddingResponse(embedResult, expectedDim = 768) {
  if (!embedResult || typeof embedResult !== 'object') {
    throw new Error('Invalid embedding response: response is empty or not an object.');
  }

  let values = null;

  if (embedResult.embedding && Array.isArray(embedResult.embedding.values)) {
    values = embedResult.embedding.values;
  } else if (Array.isArray(embedResult.embeddings) && embedResult.embeddings.length > 0 && Array.isArray(embedResult.embeddings[0].values)) {
    values = embedResult.embeddings[0].values;
  } else if (Array.isArray(embedResult.values)) {
    values = embedResult.values;
  }

  if (!values || !Array.isArray(values) || values.length === 0) {
    throw new Error('Invalid embedding response: missing or empty embedding values array.');
  }

  // Verify all elements are finite numbers
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new Error(`Invalid embedding vector: element at index ${i} is not a finite number (${val}).`);
    }
  }

  if (expectedDim && values.length !== expectedDim) {
    throw new Error(`Embedding dimension mismatch: expected ${expectedDim}, received ${values.length}.`);
  }

  return values;
}

/**
 * Robustly parses and validates a generative chat completion response from @google/genai.
 * Exported for deterministic unit testing with controlled fixtures.
 */
export function parseGenerativeResponse(response) {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid generative response: response is empty or not an object.');
  }

  let text = '';
  if (typeof response.text === 'string') {
    text = response.text.trim();
  } else if (typeof response.text === 'function') {
    text = (response.text() || '').trim();
  } else if (
    Array.isArray(response.candidates) &&
    response.candidates.length > 0 &&
    response.candidates[0].content &&
    Array.isArray(response.candidates[0].content.parts) &&
    response.candidates[0].content.parts.length > 0 &&
    typeof response.candidates[0].content.parts[0].text === 'string'
  ) {
    text = response.candidates[0].content.parts[0].text.trim();
  }

  if (!text || text.length === 0) {
    throw new Error('Invalid generative response: returned text content is empty.');
  }

  return text;
}

async function runSmokeTest() {
  console.log('\n======================================================');
  console.log('  SolveSphere AI — Live Gemini AI Smoke Test');
  console.log('======================================================');

  const shouldRun = process.env.RUN_LIVE_AI_TESTS === 'true';
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!shouldRun || !apiKey) {
    console.log('\n[STATUS] Live AI Smoke Test: NOT VERIFIED (SKIPPED BY DEFAULT)');
    console.log('Reason: RUN_LIVE_AI_TESTS is not "true" or GEMINI_API_KEY is unset.');
    console.log('Live cloud API quota is protected. System logic is verified offline via deterministic test doubles.\n');
    process.exit(0);
  }

  console.log('\n[START] Verifying live Google Gemini API connectivity with explicit operator authorization...');
  const ai = new GoogleGenAI({ apiKey });

  // 1. Verify Embedding Model (gemini-embedding-2)
  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
  console.log(`[TEST 1/2] Testing embedding generation with model: ${embeddingModel}...`);
  const t0 = Date.now();
  try {
    const rawEmbedResult = await ai.models.embedContent({
      model: embeddingModel,
      contents: 'Water leak observed in Mechanical Engineering Lab 204 near main electrical distribution panel.',
      config: {
        outputDimensionality: 768,
      },
    });

    const values = parseEmbeddingResponse(rawEmbedResult, 768);
    const duration1 = Date.now() - t0;
    console.log(`  ✔ Embedding generated & validated successfully in ${duration1}ms`);
    console.log(`  ✔ Vector dimension: ${values.length} (768 finite numeric values verified)`);
  } catch (err) {
    console.error(`  ✖ Live embedding verification failed:`, err.message || err);
    process.exit(1);
  }

  // 2. Verify Generative Chat Model (gemini-2.5-flash)
  const generativeModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  console.log(`\n[TEST 2/2] Testing generative completion with model: ${generativeModel}...`);
  const t1 = Date.now();
  try {
    const rawGenResponse = await ai.models.generateContent({
      model: generativeModel,
      contents: 'State in one concise sentence the mission of the SolveSphere AI platform.',
    });

    const text = parseGenerativeResponse(rawGenResponse);
    const duration2 = Date.now() - t1;
    console.log(`  ✔ Generative response received & validated in ${duration2}ms`);
    console.log(`  ✔ Response Text: "${text}"`);
  } catch (err) {
    console.error(`  ✖ Live generative verification failed:`, err.message || err);
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('  ✔ All Live Gemini AI Smoke Tests PASSED & VERIFIED');
  console.log('======================================================\n');
}

// Only auto-run if directly invoked as main script
const isMain = process.argv[1] && process.argv[1].endsWith('smoke-test-live-ai.js');
if (isMain) {
  runSmokeTest().catch((err) => {
    console.error('\n✖ Fatal error during live AI smoke test:', err.message || err);
    process.exit(1);
  });
}
