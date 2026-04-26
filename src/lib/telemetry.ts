/**
 * Alea Telemetry — Observabilidad para mejora continua
 * ====================================================
 * Every AI interaction is logged, scored, and tracked.
 * This is the foundation for data-driven optimization.
 *
 * Metrics captured:
 * - AI request latency, token usage, model version
 * - Tool execution success/failure rates
 * - User feedback (thumbs up/down, corrections)
 * - Error rates by endpoint and model
 *
 * Usage:
 *   import { track } from '@/lib/telemetry';
 *   await track('hermes.chat', { latencyMs: 1200, tokens: 890, ... });
 */

import { createServerClient } from './insforge-server';

// ─────────────────────────────────────────────────────────
// Event Types
// ─────────────────────────────────────────────────────────

export type TelemetryEventType =
  | 'ai.request'
  | 'ai.response'
  | 'ai.error'
  | 'tool.execution'
  | 'user.feedback'
  | 'experiment.impression'
  | 'experiment.conversion'
  | 'page.view'
  | 'action.triggered';

export interface TelemetryEvent {
  id?: string;
  event_type: TelemetryEventType;
  user_id?: string;
  session_id?: string;
  // AI context
  model?: string;
  latency_ms?: number;
  tokens_used?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  // Request context
  endpoint?: string;
  method?: string;
  status_code?: number;
  // Tool context
  tool_name?: string;
  tool_success?: boolean;
  tool_latency_ms?: number;
  // Feedback
  rating?: 'thumbs_up' | 'thumbs_down' | 'corrected';
  feedback_text?: string;
  // Experiment context
  experiment_id?: string;
  variant?: string;
  // Quality
  quality_score?: number; // 0-100, computed
  error_message?: string;
  // Metadata
  metadata?: Record<string, any>;
  created_at?: string;
}

// ─────────────────────────────────────────────────────────
// Quality Scoring Engine
// ─────────────────────────────────────────────────────────

/**
 * Compute quality score from telemetry event.
 * Higher = better. 0-100 scale.
 */
export function computeQualityScore(event: Partial<TelemetryEvent>): number {
  let score = 100;

  // Latency penalty: >3s = -20, >1s = -10, >500ms = -5
  if (event.latency_ms) {
    if (event.latency_ms > 3000) score -= 20;
    else if (event.latency_ms > 1000) score -= 10;
    else if (event.latency_ms > 500) score -= 5;
  }

  // Error penalty
  if (event.status_code && event.status_code >= 400) {
    score -= 30;
  }
  if (event.error_message) {
    score -= 20;
  }

  // Tool failure penalty
  if (event.tool_name && event.tool_success === false) {
    score -= 15;
  }

  // User negative feedback
  if (event.rating === 'thumbs_down') score -= 25;
  if (event.rating === 'corrected') score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Get quality tier label from score.
 */
export function qualityTier(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

// ─────────────────────────────────────────────────────────
// Track Function
// ─────────────────────────────────────────────────────────

let _client: ReturnType<typeof createServerClient> | null = null;

function getClient() {
  if (!_client) {
    _client = createServerClient();
  }
  return _client;
}

export async function track(event: TelemetryEvent): Promise<void> {
  try {
    const enriched: TelemetryEvent = {
      ...event,
      quality_score: computeQualityScore(event),
      created_at: new Date().toISOString(),
    };

    const client = getClient();
    await client.database.from('telemetry_events').insert(enriched);
  } catch (err) {
    // Never let telemetry failures break the app
    console.error('[telemetry] Failed to track event:', err);
  }
}

// ─────────────────────────────────────────────────────────
// Aggregation Queries (for dashboards)
// ─────────────────────────────────────────────────────────

export interface TelemetrySummary {
  period: string;
  total_requests: number;
  avg_latency_ms: number;
  avg_quality_score: number;
  error_rate: number;
  top_errors: Array<{ error_message: string; count: number }>;
  tool_success_rate: number;
  tokens_used: number;
  cost_estimate_usd: number;
}

const TOKEN_COST_PER_1K = 0.001; // MiniMax M2.7 approximate cost

export async function getTelemetrySummary(
  periodDays: number = 7
): Promise<TelemetrySummary> {
  const client = getClient();
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  // Fetch raw events
  const { data: events, error } = await client
    .database
    .from('telemetry_events')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error || !events || events.length === 0) {
    return {
      period: `last_${periodDays}_days`,
      total_requests: 0,
      avg_latency_ms: 0,
      avg_quality_score: 0,
      error_rate: 0,
      top_errors: [],
      tool_success_rate: 1,
      tokens_used: 0,
      cost_estimate_usd: 0,
    };
  }

  const aiRequests = events.filter(e => e.event_type === 'ai.request' || e.event_type === 'ai.response');
  const errors = events.filter(e => e.status_code && e.status_code >= 400 || e.error_message);
  const toolExecutions = events.filter(e => e.event_type === 'tool.execution');
  const successfulTools = toolExecutions.filter(e => e.tool_success !== false);

  // Latency stats
  const latencies = aiRequests.map(e => e.latency_ms).filter(Boolean) as number[];
  const avgLatency = latencies.length > 0
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;

  // Quality scores
  const scores = events.map(e => e.quality_score).filter(Boolean) as number[];
  const avgQuality = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  // Token usage
  const totalTokens = events.reduce((acc, e) => acc + (e.tokens_used || 0), 0);

  // Error grouping
  const errorCounts: Record<string, number> = {};
  for (const e of errors) {
    const key = (e.error_message || 'unknown').substring(0, 100);
    errorCounts[key] = (errorCounts[key] || 0) + 1;
  }
  const topErrors = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([error_message, count]) => ({ error_message, count }));

  return {
    period: `last_${periodDays}_days`,
    total_requests: aiRequests.length,
    avg_latency_ms: Math.round(avgLatency),
    avg_quality_score: Math.round(avgQuality),
    error_rate: parseFloat((errors.length / events.length * 100).toFixed(2)),
    top_errors: topErrors,
    tool_success_rate: parseFloat(
      (successfulTools.length / Math.max(toolExecutions.length, 1) * 100).toFixed(2)
    ),
    tokens_used: totalTokens,
    cost_estimate_usd: parseFloat((totalTokens / 1000 * TOKEN_COST_PER_1K).toFixed(2)),
  };
}

// ─────────────────────────────────────────────────────────
// Feedback Collection
// ─────────────────────────────────────────────────────────

export async function recordFeedback(params: {
  userId: string;
  sessionId: string;
  messageId?: string;
  rating: 'thumbs_up' | 'thumbs_down' | 'corrected';
  feedbackText?: string;
  originalResponse?: string;
  correctedResponse?: string;
  context?: Record<string, any>;
}): Promise<void> {
  const client = getClient();

  await client.database.from('ai_feedback').insert({
    user_id: params.userId,
    session_id: params.sessionId,
    message_id: params.messageId,
    rating: params.rating,
    feedback_text: params.feedbackText,
    original_response: params.originalResponse,
    corrected_response: params.correctedResponse,
    context: params.context,
    created_at: new Date().toISOString(),
  });

  // Also track as telemetry event
  await track({
    event_type: 'user.feedback',
    user_id: params.userId,
    session_id: params.sessionId,
    rating: params.rating,
    feedback_text: params.feedbackText,
  });
}

// ─────────────────────────────────────────────────────────
// Experiment Tracking (for prompt A/B testing)
// ─────────────────────────────────────────────────────────

export async function trackExperiment(params: {
  experimentId: string;
  variant: 'A' | 'B' | 'C' | 'D';
  userId?: string;
  sessionId?: string;
  event: 'impression' | 'conversion';
  metadata?: Record<string, any>;
}): Promise<void> {
  await track({
    event_type: params.event === 'impression' ? 'experiment.impression' : 'experiment.conversion',
    experiment_id: params.experimentId,
    variant: params.variant,
    user_id: params.userId,
    session_id: params.sessionId,
    metadata: params.metadata,
  });
}

export async function getExperimentResults(experimentId: string): Promise<{
  variant: string;
  impressions: number;
  conversions: number;
  conversion_rate: number;
  avg_quality: number;
}[]> {
  const client = getClient();
  const { data, error } = await client
    .database
    .from('telemetry_events')
    .select('variant, quality_score, event_type')
    .eq('experiment_id', experimentId);

  if (error || !data) return [];

  const results: Record<string, { impressions: number; conversions: number; quality_sum: number }> = {};

  for (const row of data) {
    if (!results[row.variant]) {
      results[row.variant] = { impressions: 0, conversions: 0, quality_sum: 0 };
    }
    if (row.event_type === 'experiment.impression') {
      results[row.variant].impressions++;
    } else if (row.event_type === 'experiment.conversion') {
      results[row.variant].conversions++;
    }
    if (row.quality_score) {
      results[row.variant].quality_sum += row.quality_score;
    }
  }

  return Object.entries(results).map(([variant, stats]) => ({
    variant,
    impressions: stats.impressions,
    conversions: stats.conversions,
    conversion_rate: parseFloat(
      (stats.impressions > 0 ? stats.conversions / stats.impressions : 0).toFixed(4)
    ),
    avg_quality: stats.impressions > 0
      ? Math.round(stats.quality_sum / stats.impressions)
      : 0,
  }));
}
