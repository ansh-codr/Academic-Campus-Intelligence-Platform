import { GoogleGenAI } from '@google/genai';

/**
 * Resiliently generates content using Gemini, gracefully falling back across compatible flash models
 * if a specific model encounters temporary high demand (HTTP 503), deprecation (HTTP 404), or regional limits.
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
    'gemini-3.8-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
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
      const errMsg = String(err?.message || '');
      console.warn(`[Gemini] Model ${model} generation attempt failed: ${errMsg}`);
      if (
        errMsg.includes('404') ||
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('not found') ||
        errMsg.includes('no longer available') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('is not found')
      ) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed.');
}
