/**
 * Alea Token Budget Controller
 * =============================
 * Per-user, per-day token budgeting for MiniMax API.
 * Prevents runaway AI spending and ensures fair resource allocation.
 *
 * Budgets:
 * - admin: 500K tokens/day
 * - agent: 200K tokens/day
 * - investor: 50K tokens/day
 * - anonymous: 10K tokens/day
 *
 * Also tracks total spend and provides automatic throttling.
 */

import { createServerClient } from './insforge-server';

export interface TokenBudget {
  userId: string;
  role: 'admin' | 'agent' | 'investor' | 'anonymous';
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  resetsAt: string; // ISO timestamp
}

export interface TokenUsage {
  id?: string;
  user_id: string;
  tokens_used: number;
  prompt_tokens: number;
  completion_tokens: number;
  model: string;
  endpoint: string;
  cost_usd: number;
  created_at?: string;
}

// Cost per 1K tokens (approximate MiniMax M2.7 pricing)
const COST_PER_1K_PROMPT = 0.0007;
const COST_PER_1K_COMPLETION = 0.002;

const DAILY_LIMITS: Record<string, number> = {
  admin: 500_000,
  agent: 200_000,
  investor: 50_000,
  anonymous: 10_000,
};

const LIMIT_BEFORE_WARNING = 0.8; // Warn at 80% usage
const LIMIT_BEFORE_REJECT = 0.95; // Reject at 95% usage

function getStartOfDay(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function getEndOfDay(): Date {
  const start = getStartOfDay();
  start.setDate(start.getDate() + 1);
  return start;
}

/**
 * Get or create a token budget record for a user.
 */
export async function getUserBudget(userId: string, role: string = 'agent'): Promise<TokenBudget> {
  const client = createServerClient();
  const startOfDay = getStartOfDay().toISOString();
  const endOfDayDate = getEndOfDay();
  const endOfDay = endOfDayDate.toISOString();
  const dailyLimit = DAILY_LIMITS[role] || DAILY_LIMITS.anonymous;

  // Get today's usage
  const { data: usage } = await client
    .database
    .from('token_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  const usedToday = usage?.reduce((acc: number, r: any) => acc + (r.tokens_used || 0), 0) || 0;

  return {
    userId,
    role: role as any,
    dailyLimit,
    usedToday,
    remainingToday: Math.max(0, dailyLimit - usedToday),
    resetsAt: endOfDayDate.toISOString(),
  };
}

/**
 * Check if a user can make a request of estimatedTokens.
 * Returns { allowed: true } or { allowed: false, reason: string, budget: TokenBudget }
 */
export async function checkBudget(
  userId: string,
  role: string,
  estimatedTokens: number
): Promise<{ allowed: boolean; reason?: string; budget: TokenBudget; warning?: string }> {
  const budget = await getUserBudget(userId, role);
  const usageRatio = budget.usedToday / budget.dailyLimit;

  if (usageRatio >= LIMIT_BEFORE_REJECT) {
    return {
      allowed: false,
      reason: `Budget exhausted. Resets at ${new Date(budget.resetsAt).toLocaleTimeString('es-ES')}`,
      budget,
    };
  }

  if (usageRatio >= LIMIT_BEFORE_WARNING) {
    const warning = `⚠️ Usando ${Math.round(usageRatio * 100)}% del presupuesto diario`;
    // Still allowed but warned
    return { allowed: true, warning, budget };
  }

  if (budget.remainingToday < estimatedTokens) {
    return {
      allowed: false,
      reason: `Request needs ~${estimatedTokens} tokens, only ${budget.remainingToday} remaining. Resets at ${new Date(budget.resetsAt).toLocaleTimeString('es-ES')}`,
      budget,
    };
  }

  return { allowed: true, budget };
}

/**
 * Record actual token usage after an AI call.
 */
export async function recordUsage(params: {
  userId: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
  endpoint: string;
}): Promise<void> {
  try {
    const client = createServerClient();
    const totalTokens = params.promptTokens + params.completionTokens;
    const costUsd =
      (params.promptTokens / 1000) * COST_PER_1K_PROMPT +
      (params.completionTokens / 1000) * COST_PER_1K_COMPLETION;

    await client.database.from('token_usage').insert({
      user_id: params.userId,
      tokens_used: totalTokens,
      prompt_tokens: params.promptTokens,
      completion_tokens: params.completionTokens,
      model: params.model,
      endpoint: params.endpoint,
      cost_usd: costUsd,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Never let usage tracking break the app
    console.error('[token-budget] Failed to record usage:', err);
  }
}

/**
 * Get aggregated spend for a date range.
 */
export async function getSpendReport(
  userId: string,
  days: number = 30
): Promise<{ totalTokens: number; totalCostUsd: number; days: { date: string; tokens: number; cost: number }[] }> {
  const client = createServerClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .database
    .from('token_usage')
    .select('tokens_used, cost_usd, created_at')
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return { totalTokens: 0, totalCostUsd: 0, days: [] };
  }

  // Group by day
  const byDay: Record<string, { tokens: number; cost: number }> = {};
  for (const row of data) {
    const day = row.created_at!.split('T')[0];
    if (!byDay[day]) byDay[day] = { tokens: 0, cost: 0 };
    byDay[day].tokens += row.tokens_used || 0;
    byDay[day].cost += row.cost_usd || 0;
  }

  const daysList = Object.entries(byDay).map(([date, stats]) => ({
    date,
    tokens: stats.tokens,
    cost: parseFloat(stats.cost.toFixed(4)),
  }));

  return {
    totalTokens: data.reduce((acc: number, r: any) => acc + (r.tokens_used || 0), 0),
    totalCostUsd: parseFloat(data.reduce((acc: number, r: any) => acc + (r.cost_usd || 0), 0).toFixed(4)),
    days: daysList,
  };
}

/**
 * Estimate tokens from a message string (rough approximation).
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for Spanish/English mix
  return Math.ceil(text.length / 4);
}
