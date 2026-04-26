/**
 * MiniMax AI Integration
 * Uses Anthropic-compatible API for MiniMax Plus plans
 */

import Anthropic from '@anthropic-ai/sdk';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';

if (!MINIMAX_API_KEY) {
  console.warn('⚠️ MINIMAX_API_KEY not configured. AI features will not work.');
}

const anthropic = new Anthropic({
  apiKey: MINIMAX_API_KEY,
  baseURL: 'https://api.minimax.io/v1',
});

export async function generateText(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}
): Promise<string> {
  if (!MINIMAX_API_KEY) {
    throw new Error('MINIMAX_API_KEY not configured');
  }

  const {
    model = 'MiniMax-M2.7',
    temperature = 0.7,
    maxTokens = 1500,
    systemPrompt
  } = options;

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt || 'You are a helpful assistant.',
      messages: [
        { role: 'user', content: [{ type: 'text', text: prompt }] }
      ],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (error: any) {
    console.error('MiniMax error:', error);
    throw error;
  }
}

export async function analyzeWithAI(
  prompt: string,
  systemPrompt?: string
): Promise<{ analysis: any; rawResponse: string }> {
  if (!MINIMAX_API_KEY) {
    throw new Error('MINIMAX_API_KEY not configured');
  }

  try {
    const message = await anthropic.messages.create({
      model: 'MiniMax-M2.7',
      max_tokens: 2000,
      temperature: 0.1,
      system: systemPrompt || 'You are a helpful assistant.',
      messages: [
        { role: 'user', content: [{ type: 'text', text: prompt }] }
      ],
    });

    const rawResponse = message.content[0].type === 'text' ? message.content[0].text : '';
    let analysis = {};

    try {
      analysis = JSON.parse(rawResponse);
    } catch {
      analysis = { raw: rawResponse };
    }

    return { analysis, rawResponse };
  } catch (error: any) {
    console.error('MiniMax analysis error:', error);
    throw error;
  }
}

export function isMiniMaxConfigured(): boolean {
  return !!MINIMAX_API_KEY && MINIMAX_API_KEY.length > 0;
}