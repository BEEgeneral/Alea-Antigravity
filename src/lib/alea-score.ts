/**
 * Alea Score utilities — centralized scoring logic
 */

export type AleaScoreClassification = 'exceptional' | 'high' | 'medium' | 'low';

/**
 * Classify an Alea Score (0-100) into a human-readable tier.
 */
export function classifyAleaScore(score: number): AleaScoreClassification {
  if (score >= 80) return 'exceptional';
  if (score >= 65) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

/**
 * Map a classification to a display label and priority.
 */
export const CLASSIFICATION_META: Record<AleaScoreClassification, { label: string; priority: 'critical' | 'high' | 'medium' | 'low'; sla_hours: number }> = {
  exceptional: { label: '🔴 Excepcional', priority: 'critical', sla_hours: 4 },
  high:        { label: '🟠 Alto',        priority: 'high',      sla_hours: 24 },
  medium:      { label: '🟡 Medio',       priority: 'medium',    sla_hours: 48 },
  low:         { label: '🟢 Bajo',        priority: 'low',      sla_hours: 72 },
};
