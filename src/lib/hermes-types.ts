/**
 * Hermes Types - TypeScript definitions for MiniMax Hermes
 */

export interface HermesConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

export interface MessageContent {
  type: 'text';
  text: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: any;
  success: boolean;
  error?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface HermesResponse {
  content: string;
  reasoning: string;
  toolCalls: ToolCall[];
  toolResults?: ToolResult[];
  finishReason: string;
}

export interface HermesStreamChunk {
  content: string;
  reasoning?: string;
  toolCall?: ToolCall;
  finishReason?: string;
}

export interface CRMQueryResult {
  table: string;
  data: any[];
  count: number;
  error?: string;
}

export interface MemoryResult {
  success: boolean;
  memory_id?: string;
  error?: string;
}

export interface AgendaAction {
  id: string;
  title: string;
  description?: string;
  action_type: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'cancelled' | 'overdue';
  due_date: string;
  completed_at?: string;
  outcome?: string;
  lead_id?: string;
  assigned_agent_id?: string;
}

export interface InvestorClassification {
  piedra_primaria: 'ZAFIRO' | 'PERLA' | 'ESMERALDA' | 'RUBI';
  piedra_secundaria?: 'ZAFIRO' | 'PERLA' | 'ESMERALDA' | 'RUBI';
  disc_profile: 'D' | 'I' | 'S' | 'C';
  investor_type: string;
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  communication_preference?: string;
  closing_strategy?: string[];
  confidence_score?: number;
}

export interface CommissionCalculation {
  property_price: number;
  total_commission: number;
  alea_share: number;
  execution_pool: number;
  agent_share: number;
  finder_share?: number;
  breakdown: {
    opening: number;
    management: number;
    closing: number;
  };
}
