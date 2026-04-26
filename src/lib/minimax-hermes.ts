/**
 * MiniMax Hermes Core
 * Powered by MiniMax M2.7 with native function calling
 * 
 * Features:
 * - Interleaved Thinking (reasoning_split=True)
 * - Native function calling
 * - Tool execution loop
 * - Memory integration
 */

import OpenAI from 'openai';
import type { Message, ToolCall, ToolResult, HermesConfig } from './hermes-types';
import { HermesTools, type ToolDefinition } from './hermes-tools';

const MINIMAX_BASE_URL = 'https://api.minimax.io/v1';
const DEFAULT_MODEL = 'MiniMax-M2.7';

export interface HermesOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  memoryContext?: string;
}

export class HermesClient {
  private client: OpenAI;
  private model: string;
  private systemPrompt: string;
  private maxTokens: number;
  private temperature: number;
  private tools: ToolDefinition[];
  private messageHistory: Message[] = [];

  constructor(options: HermesOptions = {}) {
    const apiKey = options.apiKey || process.env.MINIMAX_API_KEY || '';
    
    if (!apiKey) {
      throw new Error('MINIMAX_API_KEY is required');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: options.baseUrl || MINIMAX_BASE_URL,
    });

    this.model = options.model || DEFAULT_MODEL;
    this.systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt();
    this.maxTokens = options.maxTokens || 4096;
    this.temperature = options.temperature || 0.7;
    this.tools = options.tools || HermesTools.getDefaultTools();
    this.messageHistory = [];
  }

  private getDefaultSystemPrompt(): string {
    return `Eres **Hermes**, el corazón de inteligencia artificial de Alea Signature.

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
  }

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  setMemoryContext(context: string): void {
    if (context) {
      this.systemPrompt = `${this.getDefaultSystemPrompt()}\n\n## CONTEXTO DE MEMORIA\n${context}`;
    }
  }

  addMessage(role: 'user' | 'assistant', content: string | MessageContent[]): void {
    if (typeof content === 'string') {
      this.messageHistory.push({ role, content });
    } else {
      this.messageHistory.push({ role, content } as any);
    }
  }

  clearHistory(): void {
    this.messageHistory = [];
  }

  async chat(
    userMessage: string,
    options: {
      stream?: boolean;
      onToolCall?: (tool: ToolCall) => void;
      executeTool?: (toolCall: ToolCall) => Promise<ToolResult>;
    } = {}
  ): Promise<HermesResponse> {
    const { stream = false, executeTool } = options;

    const messages: any[] = [
      { role: 'system', content: this.systemPrompt },
      ...this.messageHistory,
      { role: 'user', content: userMessage },
    ];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: this.tools.map(t => ({
          type: 'function' as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        // @ts-ignore - MiniMax specific parameter
        // @ts-ignore - MiniMax specific parameter
        extra_body: { reasoning_split: true },
      });

      const assistantMessage = response.choices[0].message;
      const reasoningDetails = (assistantMessage as any).reasoning_details;
      const toolCalls = assistantMessage.tool_calls || [];

      if (stream) {
        return {
          content: assistantMessage.content || '',
          reasoning: reasoningDetails?.[0]?.text || '',
          toolCalls,
          finishReason: response.choices[0].finish_reason,
        };
      }

      if (toolCalls.length > 0 && executeTool) {
        const toolResults = await this.executeToolCalls(toolCalls, executeTool);
        
        const finalResponse = await this.continueConversation(
          messages,
          assistantMessage,
          toolResults
        );

        return {
          content: finalResponse.content,
          reasoning: finalResponse.reasoning,
          toolCalls,
          toolResults,
          finishReason: 'completed',
        };
      }

      this.messageHistory.push({
        role: 'user',
        content: userMessage,
      });
      this.messageHistory.push({
        role: 'assistant',
        content: assistantMessage.content || '',
      });

      return {
        content: assistantMessage.content || '',
        reasoning: reasoningDetails?.[0]?.text || '',
        toolCalls: [],
        finishReason: response.choices[0].finish_reason || 'stop',
      };
    } catch (error: any) {
      console.error('Hermes chat error:', error);
      throw new HermesError(error.message || 'Hermes chat failed', error);
    }
  }

  private async executeToolCalls(
    toolCalls: any[],
    executeTool: (toolCall: ToolCall) => Promise<ToolResult>
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      try {
        const result = await executeTool(toolCall);
        results.push({
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          result,
          success: true,
        });
      } catch (error: any) {
        results.push({
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          result: { error: error.message },
          success: false,
        });
      }
    }

    return results;
  }

  private async continueConversation(
    messages: any[],
    assistantMessage: any,
    toolResults: ToolResult[]
  ): Promise<{ content: string; reasoning: string }> {
    messages.push({
      role: 'assistant',
      content: assistantMessage.content || '',
      tool_calls: assistantMessage.tool_calls,
    });

    for (const result of toolResults) {
      messages.push({
        role: 'tool',
        tool_call_id: result.toolCallId,
        content: typeof result.result === 'string' 
          ? result.result 
          : JSON.stringify(result.result),
      });
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: this.tools.map(t => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      // @ts-ignore - MiniMax specific parameter
        extra_body: { reasoning_split: true },
    });

    const finalMessage = response.choices[0].message;
    const reasoningDetails = (finalMessage as any).reasoning_details;

    this.messageHistory.push({ role: 'user', content: messages[messages.length - toolResults.length - 1].content });
    this.messageHistory.push({
      role: 'assistant',
      content: finalMessage.content || '',
    });

    return {
      content: finalMessage.content || '',
      reasoning: reasoningDetails?.[0]?.text || '',
    };
  }

  async chatStream(
    userMessage: string,
    onChunk: (chunk: string) => void,
    onToolCall?: (tool: ToolCall) => void
  ): Promise<void> {
    const messages: any[] = [
      { role: 'system', content: this.systemPrompt },
      ...this.messageHistory,
      { role: 'user', content: userMessage },
    ];

    const streamParams = {
      model: this.model,
      messages,
      tools: this.tools.map(t => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      stream: true as const,
      extra_body: { reasoning_split: true },
    };

    const streamResponse: any = await this.client.chat.completions.create(streamParams);
    const stream = streamResponse as AsyncIterable<any>;

    let fullContent = '';
    let reasoningContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      
      if (delta?.content) {
        fullContent += delta.content;
        onChunk(delta.content);
      }
      
      if ((delta as any).reasoning_details?.[0]?.text) {
        reasoningContent += (delta as any).reasoning_details[0].text;
      }

      if (delta?.tool_calls && onToolCall) {
        for (const toolCall of delta.tool_calls) {
          onToolCall(toolCall as ToolCall);
        }
      }
    }

    if (reasoningContent) {
      console.log('💭 Reasoning:', reasoningContent.substring(0, 200) + '...');
    }

    this.messageHistory.push({ role: 'user', content: userMessage });
    this.messageHistory.push({ role: 'assistant', content: fullContent });
  }
}

export interface HermesResponse {
  content: string;
  reasoning: string;
  toolCalls: any[];
  toolResults?: ToolResult[];
  finishReason: string;
}

export interface MessageContent {
  type: 'text';
  text: string;
}

export class HermesError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'HermesError';
  }
}

export function createHermes(options?: HermesOptions): HermesClient {
  return new HermesClient(options);
}

export function isMiniMaxConfigured(): boolean {
  return !!(
    process.env.MINIMAX_API_KEY ||
    (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_MINIMAX_API_KEY)
  );
}
