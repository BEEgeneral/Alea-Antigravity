/**
 * @deprecated Use `alea-ai.ts` instead.
 * This file is kept for backward compatibility — all code migrated.
 *
 * DEPRECATED: ai-minimax.ts
 * Replaced by: src/lib/alea-ai.ts
 *
 * Token efficiency improvements:
 * - Centralized system prompt (ALEA_SYSTEM_PROMPT)
 * - History truncation at 50 messages
 * - Single OpenAI SDK (not Anthropic)
 * - Typed reasoning_split parameter
 *
 * Migration: change `import { generateText, analyzeWithAI } from './ai-minimax'`
 * to        `import { getAleaAIClient } from './alea-ai'`
 */

import { getAleaAIClient } from './alea-ai';

export async function generateText(
  prompt: string,
  options?: Parameters<ReturnType<typeof getAleaAIClient>['generateText']>[1]
): Promise<string> {
  console.warn('[DEPRECATED] ai-minimax.ts → use alea-ai.ts instead');
  const client = getAleaAIClient();
  return client.generateText(prompt, options);
}

export async function analyzeWithAI(
  prompt: string,
  systemPrompt?: string
): Promise<{ analysis: any; rawResponse: string }> {
  console.warn('[DEPRECATED] ai-minimax.ts → use alea-ai.ts instead');
  const client = getAleaAIClient();
  return client.analyze(prompt, { systemPrompt });
}

export function isMiniMaxConfigured(): boolean {
  return !!(process.env.MINIMAX_API_KEY);
}
