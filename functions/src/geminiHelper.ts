import { GoogleGenAI } from '@google/genai';

/**
 * Resiliently generates content using Gemini, prioritizing ultra-fast gemini-3.5-flash-lite
 * with seamless fallback to gemini-3.8-flash if needed.
 */
export async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any[];
    systemInstruction?: string;
    maxOutputTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const candidateModels = [
    process.env.GEMINI_MODEL,
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ].filter(Boolean) as string[];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          maxOutputTokens: params.maxOutputTokens || 1024,
          temperature: params.temperature ?? 0.35,
        },
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err);
      console.warn(`[Gemini] Model ${model} generation attempt failed: ${errMsg}`);
      // Continue to next model if 404/503/high demand
      continue;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed.');
}
