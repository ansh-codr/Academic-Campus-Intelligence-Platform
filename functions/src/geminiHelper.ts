import { GoogleGenAI } from '@google/genai';

/**
 * Resiliently generates content using Gemini, gracefully falling back across compatible models
 * and retrying if a model encounters temporary high demand (HTTP 503).
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
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ].filter(Boolean) as string[];

  const errorLog: string[] = [];

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
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
        const errMsg = String(err?.message || err);
        console.warn(`[Gemini] Model ${model} attempt ${attempt} failed: ${errMsg}`);
        errorLog.push(`${model} (attempt ${attempt}): ${errMsg}`);

        if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
          if (attempt === 1) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            continue;
          }
        }
        break;
      }
    }
  }

  throw new Error(`Gemini Provider Generation Failed: ${errorLog.join(' | ')}`);
}
