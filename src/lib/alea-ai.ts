/**
 * Alea AI — Unified MiniMax M2.7 Client
 * ======================================
 * Single client for all AI operations. Replaces:
 * - ai-minimax.ts (Anthropic SDK)
 * - minimax.ts (OpenAI SDK, basic)
 * - minimax-hermes.ts (OpenAI SDK + Hermes wrapper)
 *
 * Token efficiency:
 * - Centralized system prompts (ALEA_SYSTEM_PROMPT)
 * - History truncation at 50 messages
 * - Reasoner params typed correctly via `as any`
 * - Streaming with SSE support
 * - Function calling (tools) built-in
 */

import OpenAI from 'openai';
import type { Message, ToolCall, ToolResult } from './hermes-types';
import { HermesTools, type ToolDefinition } from './hermes-tools';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MINIMAX_BASE_URL = 'https://api.minimax.io/v1';
const DEFAULT_MODEL = 'MiniMax-M2.7';
const DEFAULT_MAX_TOKENS = 4096;
const MAX_HISTORY_MESSAGES = 50;

export const ALEA_SYSTEM_PROMPT = `Eres **Hermes**, el corazón de inteligencia artificial de Alea Signature.

PERSONALIDAD:
- Asistente patrimonial extremadamente útil y profesional
- Siempre respondes en español
- Usas markdown para formatear
- Eres conciso pero completo

REGLAS DE ORO:
1. CONFIDENCIALIDAD: Nunca reveles ubicación de propiedades off-market
2. NDA: Verifica estado NDA antes de mostrar activos
3. NO ELUSIÓN: Prohibido saltar a la empresa (penalización 2x)
4. COMISIÓN: 40% Alea, 60% pool de ejecución

CONTEXTO ALEA SIGNATURE:
- Plataforma de originación privada inmobiliaria de lujo
- Inversores cualificados con NDA vigente
- Pipeline: Lead → Cualificado → NDA → Blind Listing → Due Diligence → Cierre
- Estructura comision: 40/60 con distribución por hitos`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AleaAIOptions {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  tools?: ToolDefinition[];
}

export interface AleaAIStreamChunk {
  content: string;
  reasoning: string;
  toolCalls: ToolCall[];
  finishReason: string;
}

export interface AleaAIResponse {
  content: string;
  reasoning: string;
  toolCalls: ToolCall[];
  toolResults?: ToolResult[];
  finishReason: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class AleaAIClient {
  private client: OpenAI;
  private model: string;
  private systemPrompt: string;
  private maxTokens: number;
  private temperature: number;
  private tools: ToolDefinition[];
  private messageHistory: Message[] = [];

  constructor(options: AleaAIOptions = {}) {
    const apiKey = options.apiKey || process.env.MINIMAX_API_KEY || '';
    if (!apiKey) throw new Error('MINIMAX_API_KEY is required');

    this.client = new OpenAI({ apiKey, baseURL: MINIMAX_BASE_URL });
    this.model = options.model || DEFAULT_MODEL;
    this.systemPrompt = options.systemPrompt || ALEA_SYSTEM_PROMPT;
    this.maxTokens = options.maxTokens || DEFAULT_MAX_TOKENS;
    this.temperature = options.temperature ?? 0.7;
    this.tools = options.tools || HermesTools.getDefaultTools();
  }

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  setMemoryContext(context: string): void {
    if (context) {
      this.systemPrompt = `${ALEA_SYSTEM_PROMPT}\n\n## CONTEXTO DE MEMORIA\n${context}`;
    }
  }

  addMessage(role: 'user' | 'assistant', content: string): void {
    this.messageHistory.push({ role, content });
    this.trimHistory();
  }

  private trimHistory(): void {
    if (this.messageHistory.length > MAX_HISTORY_MESSAGES) {
      this.messageHistory = this.messageHistory.slice(-MAX_HISTORY_MESSAGES);
    }
  }

  clearHistory(): void {
    this.messageHistory = [];
  }

  // ---------------------------------------------------------------------------
  // Core chat (non-streaming)
  // ---------------------------------------------------------------------------

  async chat(
    userMessage: string,
    options: { executeTool?: (toolCall: ToolCall) => Promise<ToolResult> } = {}
  ): Promise<AleaAIResponse> {
    const { executeTool } = options;
    const messages = this.buildMessages(userMessage);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      ...this.toolParams(),
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      extra_body: { reasoning_split: true } as any,
    } as any);

    const assistantMessage = response.choices[0].message;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reasoningDetails: any[] = (assistantMessage as any).reasoning_details ?? [];
    const reasoningText = reasoningDetails.map((r) => r.text || '').join('\n');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolCalls: ToolCall[] = (assistantMessage.tool_calls || []).map((tc: any) => ({
      id: tc.id,
      type: 'function' as const,
      function: { name: tc.function.name, arguments: tc.function.arguments },
    }));

    if (toolCalls.length > 0 && executeTool) {
      const toolResults = await Promise.all(
        toolCalls.map(async (tc) => {
          try {
            const result = await executeTool(tc);
            return { toolCallId: tc.id, toolName: tc.function.name, result, success: true };
          } catch (err: any) {
            return { toolCallId: tc.id, toolName: tc.function.name, result: { error: err.message }, success: false };
          }
        })
      );
      const finalResponse = await this.continueConversation(messages, assistantMessage, toolResults);
      return { content: finalResponse.content, reasoning: finalResponse.reasoning, toolCalls, toolResults, finishReason: 'completed' };
    }

    this.addMessage('user', userMessage);
    this.addMessage('assistant', assistantMessage.content || '');

    return {
      content: assistantMessage.content || '',
      reasoning: reasoningText,
      toolCalls: [],
      finishReason: response.choices[0].finish_reason || 'stop',
    };
  }

  // ---------------------------------------------------------------------------
  // Streaming
  // ---------------------------------------------------------------------------

  async *chatStream(userMessage: string): AsyncGenerator<AleaAIStreamChunk, void, unknown> {
    const messages = this.buildMessages(userMessage);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      ...this.toolParams(),
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      stream: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      extra_body: { reasoning_split: true } as any,
    } as any);

    let fullContent = '';
    let fullReasoning = '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const chunk of stream as any) {
      const delta = chunk.choices[0]?.delta;
      const reasoningDelta = delta?.reasoning_details?.[0]?.text || '';

      if (delta?.content) {
        fullContent += delta.content;
        yield { content: delta.content, reasoning: '', toolCalls: [], finishReason: '' };
      }

      if (reasoningDelta) fullReasoning += reasoningDelta;

      if (delta?.tool_calls) {
        const toolCalls: ToolCall[] = delta.tool_calls.map((tc: any) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        }));
        yield { content: '', reasoning: '', toolCalls, finishReason: '' };
      }
    }

    this.addMessage('user', userMessage);
    this.addMessage('assistant', fullContent);

    yield { content: '', reasoning: fullReasoning, toolCalls: [], finishReason: 'stop' };
  }

  // ---------------------------------------------------------------------------
  // Lightweight text generation (no history)
  // ---------------------------------------------------------------------------

  async generateText(
    prompt: string,
    options: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      responseFormat?: 'text' | 'json_object';
    } = {}
  ): Promise<string> {
    const { systemPrompt = ALEA_SYSTEM_PROMPT, temperature = 0.7, maxTokens = 1500, responseFormat } = options;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = { model: this.model, messages, temperature, max_tokens: maxTokens };
    if (responseFormat === 'json_object') params.response_format = { type: 'json_object' };

    const response = await this.client.chat.completions.create(params as any);
    return response.choices[0]?.message?.content || '';
  }

  // ---------------------------------------------------------------------------
  // Structured analysis
  // ---------------------------------------------------------------------------

  async analyze(
    prompt: string,
    options: { systemPrompt?: string; maxTokens?: number } = {}
  ): Promise<{ analysis: any; rawResponse: string }> {
    const { systemPrompt = ALEA_SYSTEM_PROMPT, maxTokens = 2000 } = options;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.1,
      max_tokens: maxTokens,
    } as any);

    const raw = response.choices[0]?.message?.content || '';
    let analysis: any = {};
    try { analysis = JSON.parse(raw); } catch { analysis = { raw }; }
    return { analysis, rawResponse: raw };
  }

  // ---------------------------------------------------------------------------
  // Image analysis — token efficiency: 2 images max, 1500 char text
  // ---------------------------------------------------------------------------

  async analyzeImages(
    images: Array<{ base64: string; page?: number }>,
    text: string,
    prompt: string,
    options: { detail?: 'low' | 'high' | 'auto' } = {}
  ): Promise<{ analysis: any; rawResponse: string }> {
    const { detail = 'high' } = options;
    const cappedImages = images.slice(0, 2);       // 2 images max
    const cappedText = text.substring(0, 1500);    // 1500 chars max

    const content: OpenAI.Chat.ChatCompletionContentPart[] = [
      ...cappedImages.map((img) => ({
        type: 'image_url' as const,
        image_url: { url: `data:image/jpeg;base64,${img.base64}`, detail },
      })),
      { type: 'text' as const, text: `${prompt}\n\nTexto del documento:\n${cappedText}` },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.client.chat.completions.create({
      model: 'MiniMax-VL01',
      messages: [{ role: 'user', content }],
      temperature: 0.1,
      max_tokens: 2000,
    } as any);

    const raw = response.choices[0]?.message?.content || '';
    let analysis: any = {};
    try { analysis = JSON.parse(raw); } catch { analysis = { raw }; }
    return { analysis, rawResponse: raw };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildMessages(userMessage: string): OpenAI.Chat.ChatCompletionMessageParam[] {
    return [
      { role: 'system', content: this.systemPrompt },
      ...this.messageHistory.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: typeof m.content === 'string' ? m.content : (m.content as any).text,
      })),
      { role: 'user', content: userMessage },
    ];
  }

  private toolParams(): { tools?: any } {
    if (!this.tools.length) return {};
    return {
      tools: this.tools.map((t) => ({
        type: 'function' as const,
        function: { name: t.name, description: t.description, parameters: t.parameters },
      })),
    };
  }

  private async continueConversation(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    assistantMessage: OpenAI.Chat.ChatCompletionMessage,
    toolResults: ToolResult[]
  ): Promise<{ content: string; reasoning: string }> {
    messages.push({ role: 'assistant', content: assistantMessage.content || '', tool_calls: assistantMessage.tool_calls });
    for (const result of toolResults) {
      messages.push({
        role: 'tool',
        tool_call_id: result.toolCallId,
        content: typeof result.result === 'string' ? result.result : JSON.stringify(result.result),
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      ...this.toolParams(),
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      extra_body: { reasoning_split: true } as any,
    } as any);

    const finalMessage = response.choices[0].message;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reasoningDetails: any[] = (finalMessage as any).reasoning_details ?? [];
    const reasoningText = reasoningDetails.map((r) => r.text || '').join('\n');

    return { content: finalMessage.content || '', reasoning: reasoningText };
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let _client: AleaAIClient | null = null;

export function getAleaAIClient(options?: AleaAIOptions): AleaAIClient {
  if (!_client || options) _client = new AleaAIClient(options);
  return _client;
}

export function isAleaAIConfigured(): boolean {
  return !!process.env.MINIMAX_API_KEY;
}

/** @deprecated alias — use isAleaAIConfigured */
export const isMiniMaxConfigured = isAleaAIConfigured;
