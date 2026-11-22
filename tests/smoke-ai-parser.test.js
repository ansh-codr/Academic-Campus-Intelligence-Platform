/**
 * SolveSphere AI — Gemini AI Response Parser Unit Tests
 * 
 * Verifies embedding and generative response structure parsing with controlled fixtures.
 * Does NOT make any live network requests.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEmbeddingResponse, parseGenerativeResponse } from '../scripts/smoke-test-live-ai.js';

test('parseEmbeddingResponse parses standard @google/genai embedding object', () => {
  const fixture = {
    embedding: {
      values: Array(768).fill(0.0123),
    },
  };

  const values = parseEmbeddingResponse(fixture, 768);
  assert.equal(values.length, 768);
  assert.equal(values[0], 0.0123);
});

test('parseEmbeddingResponse parses batch embeddings array format', () => {
  const fixture = {
    embeddings: [
      {
        values: Array(768).fill(0.0456),
      },
    ],
  };

  const values = parseEmbeddingResponse(fixture, 768);
  assert.equal(values.length, 768);
  assert.equal(values[0], 0.0456);
});

test('parseEmbeddingResponse parses direct values array format', () => {
  const fixture = {
    values: Array(768).fill(0.0789),
  };

  const values = parseEmbeddingResponse(fixture, 768);
  assert.equal(values.length, 768);
  assert.equal(values[0], 0.0789);
});

test('parseEmbeddingResponse rejects empty or non-object response', () => {
  assert.throws(() => parseEmbeddingResponse(null, 768), /Invalid embedding response/);
  assert.throws(() => parseEmbeddingResponse(undefined, 768), /Invalid embedding response/);
  assert.throws(() => parseEmbeddingResponse({}, 768), /missing or empty embedding values array/);
  assert.throws(() => parseEmbeddingResponse({ embedding: { values: [] } }, 768), /missing or empty embedding values array/);
});

test('parseEmbeddingResponse rejects non-finite numerical elements (NaN, Infinity)', () => {
  const badVector = Array(768).fill(0.01);
  badVector[10] = NaN;
  assert.throws(
    () => parseEmbeddingResponse({ embedding: { values: badVector } }, 768),
    /is not a finite number/
  );

  badVector[10] = Infinity;
  assert.throws(
    () => parseEmbeddingResponse({ embedding: { values: badVector } }, 768),
    /is not a finite number/
  );
});

test('parseEmbeddingResponse rejects dimension mismatch', () => {
  const shortVector = Array(512).fill(0.01);
  assert.throws(
    () => parseEmbeddingResponse({ embedding: { values: shortVector } }, 768),
    /Embedding dimension mismatch: expected 768, received 512/
  );
});

test('parseGenerativeResponse parses string text property', () => {
  const fixture = {
    text: '  SolveSphere AI empowers campus intelligence.  ',
  };
  const result = parseGenerativeResponse(fixture);
  assert.equal(result, 'SolveSphere AI empowers campus intelligence.');
});

test('parseGenerativeResponse parses candidates parts structure', () => {
  const fixture = {
    candidates: [
      {
        content: {
          parts: [
            { text: 'Unified student and facility management platform.' },
          ],
        },
      },
    ],
  };
  const result = parseGenerativeResponse(fixture);
  assert.equal(result, 'Unified student and facility management platform.');
});

test('parseGenerativeResponse rejects empty or whitespace-only response', () => {
  assert.throws(() => parseGenerativeResponse(null), /Invalid generative response/);
  assert.throws(() => parseGenerativeResponse({ text: '   ' }), /returned text content is empty/);
  assert.throws(() => parseGenerativeResponse({ candidates: [] }), /returned text content is empty/);
});
