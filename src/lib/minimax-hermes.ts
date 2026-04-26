/**
 * @deprecated Use `alea-ai.ts` instead.
 * This file is kept for backward compatibility.
 *
 * DEPRECATED: minimax-hermes.ts
 * Replaced by: src/lib/alea-ai.ts
 *
 * Migration:
 *   OLD: import { HermesClient, createHermes } from './minimax-hermes'
 *   NEW: import { AleaAIClient, getAleaAIClient } from './alea-ai'
 */

import { AleaAIClient, getAleaAIClient } from './alea-ai';
import { HermesTools } from './hermes-tools';
import type { HermesConfig, HermesResponse } from './hermes-types';
import type { ToolDefinition } from './hermes-tools';

export { HermesTools };
export type { HermesConfig, HermesResponse };

// Legacy alias
export class HermesClient extends AleaAIClient {
  constructor(config?: HermesConfig) {
    super({
      apiKey: config?.apiKey,
      model: config?.model,
      maxTokens: config?.maxTokens,
      temperature: config?.temperature,
      systemPrompt: config?.systemPrompt,
      tools: HermesTools.getDefaultTools(),
    });
  }
}

export function createHermes(config?: HermesConfig): AleaAIClient {
  console.warn('[DEPRECATED] createHermes() → use getAleaAIClient() instead');
  return new HermesClient(config);
}

export function isMiniMaxConfigured(): boolean {
  return !!(process.env.MINIMAX_API_KEY);
}
