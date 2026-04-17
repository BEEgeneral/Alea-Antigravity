/**
 * MiniMax AI Integration
 * Uses MiniMax-Text-01 for text generation
 */

import OpenAI from 'openai';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = 'https://api.minimax.chat/v1';

if (!MINIMAX_API_KEY) {
  console.warn('⚠️ MINIMAX_API_KEY not configured. AI features will not work.');
}

export const minimax = new OpenAI({
  apiKey: MINIMAX_API_KEY,
  baseURL: MINIMAX_BASE_URL,
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
    model = 'MiniMax-Text-01',
    temperature = 0.7,
    maxTokens = 1500,
    systemPrompt
  } = options;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await minimax.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0]?.message?.content || '';
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

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await minimax.chat.completions.create({
      model: 'MiniMax-Text-01',
      messages,
      temperature: 0.1,
      max_tokens: 2000,
    });

    const rawResponse = response.choices[0]?.message?.content || '';
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