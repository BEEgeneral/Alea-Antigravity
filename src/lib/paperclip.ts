/**
 * Paperclip + OpenClaw Integration for Alea Signature
 * 
 * This library provides utilities to:
 * 1. Connect to Paperclip API
 * 2. Spawn OpenClaw agents
 * 3. Send tasks to agents
 * 4. Receive agent responses
 */

import { env } from '@/lib/env';

export interface PaperclipConfig {
  apiUrl: string;
  apiKey: string;
  companyId?: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'google';
  model: string;
  runtime: 'openclaw' | 'claude_code' | 'bash';
}

export interface Task {
  id?: string;
  agentId: string;
  prompt: string;
  context?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
}

export interface TaskResult {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  cost?: number;
  duration?: number;
}

const DEFAULT_CONFIG: PaperclipConfig = {
  apiUrl: process.env.PAPERCLIP_API_URL || 'http://localhost:3100',
  apiKey: process.env.PAPERCLIP_API_KEY || '',
};

class PaperclipClient {
  private config: PaperclipConfig;

  constructor(config: Partial<PaperclipConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Paperclip API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch {
      return false;
    }
  }

  async listAgents(): Promise<AgentConfig[]> {
    return this.request<AgentConfig[]>('/api/agents');
  }

  async getAgent(agentId: string): Promise<AgentConfig> {
    return this.request<AgentConfig>(`/api/agents/${agentId}`);
  }

  async createTask(task: Task): Promise<TaskResult> {
    return this.request<TaskResult>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async getTask(taskId: string): Promise<TaskResult> {
    return this.request<TaskResult>(`/api/tasks/${taskId}`);
  }

  async runAgentTask(
    agentId: string,
    prompt: string,
    context?: Record<string, any>,
    options: { timeout?: number; pollInterval?: number } = {}
  ): Promise<TaskResult> {
    const { timeout = 120000, pollInterval = 2000 } = options;

    const task = await this.createTask({
      agentId,
      prompt,
      context,
    });

    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await this.getTask(task.id!);
      
      if (result.status === 'completed' || result.status === 'failed') {
        return result;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return {
      id: task.id!,
      status: 'failed',
      error: 'Task timeout',
    };
  }

  async spawnAgent(
    agentId: string,
    config?: { heartbeat?: boolean; schedule?: string }
  ): Promise<{ success: boolean; instanceId?: string }> {
    return this.request(`/api/agents/${agentId}/spawn`, {
      method: 'POST',
      body: JSON.stringify(config || {}),
    });
  }
}

let _client: PaperclipClient | null = null;

export function getPaperclipClient(config?: Partial<PaperclipConfig>): PaperclipClient {
  if (!_client || config) {
    _client = new PaperclipClient(config);
  }
  return _client;
}

export async function runPelayoTask(
  prompt: string,
  context?: {
    investorId?: string;
    investorEmail?: string;
    propertyId?: string;
  }
): Promise<TaskResult> {
  const client = getPaperclipClient();
  
  return client.runAgentTask('pelayo', prompt, context, {
    timeout: 60000,
  });
}

export async function runCenturionTask(
  prompt: string,
  context?: {
    profileId?: string;
    sourceType?: string;
  }
): Promise<TaskResult> {
  const client = getPaperclipClient();
  
  return client.runAgentTask('centurion', prompt, context, {
    timeout: 90000,
  });
}

export { PaperclipClient };
export default getPaperclipClient;
