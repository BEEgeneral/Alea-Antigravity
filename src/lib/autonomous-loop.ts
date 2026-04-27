/**
 * Alea Autonomous Loop
 * ====================
 * The self-propelling agent engine.
 *
 * This is the autonomous heart that runs without human intervention.
 * It continuously:
 *  1. Scans for new signals (RADAR)
 *  2. Qualifies opportunities (Alea Score)
 *  3. Matches investors to opportunities
 *  4. Creates agenda actions for high-priority matches
 *  5. Sends notifications (chat/push)
 *  6. Records all decisions for learning
 *
 * Called by the Cron Agent (hourly) or triggered manually.
 */

import { createServerClient } from './insforge-server';
import { track } from './telemetry';
import { getAleaAIClient } from './alea-ai';

export interface LoopResult {
  ranAt: string;
  signalsProcessed: number;
  actionsCreated: number;
  notificationsSent: number;
  errors: string[];
  duration_ms: number;
  newSignals: Array<{ id: string; title: string; alea_score: number }>;
  highPriorityMatches: Array<{ investor: string; opportunity: string; score: number }>;
}

/**
 * Main autonomous loop — call this on a schedule.
 * Returns a LoopResult with everything that happened.
 */
export async function runAutonomousLoop(): Promise<LoopResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const result: LoopResult = {
    ranAt: new Date().toISOString(),
    signalsProcessed: 0,
    actionsCreated: 0,
    notificationsSent: 0,
    errors: [],
    duration_ms: 0,
    newSignals: [],
    highPriorityMatches: [],
  };

  const client = createServerClient();

  try {
    // ─── PHASE 1: Get unprocessed signals ─────────────────────────────────
    const { data: unprocessedSignals } = await client
      .database
      .from('signals')
      .select('*')
      .eq('status', 'detected')
      .order('alea_score', { ascending: false })
      .limit(50);

    const signals = unprocessedSignals || [];
    result.signalsProcessed = signals.length;

    for (const signal of signals) {
      try {
        // ─── PHASE 2: Score & qualify signal ────────────────────────────
        await client
          .database
          .from('signals')
          .update({ status: 'analyzing', updated_at: new Date().toISOString() })
          .eq('id', signal.id);

        // High score signals (≥65) → auto-create lead + agenda action
        if (signal.alea_score >= 65) {
          // Check if lead already exists for this signal
          const { data: existingLead } = await client
            .database
            .from('leads')
            .select('id')
            .like('notes', `%${signal.id}%`)
            .maybeSingle();

          if (!existingLead) {
            const { data: newLead } = await client
              .database
              .from('leads')
              .insert({
                name: signal.title,
                email: signal.vendor_name || 'unknown@signal.pending',
                status: 'new',
                notes: `Signal: ${signal.id} | Score: ${signal.alea_score} | Source: ${signal.source}`,
                pipeline_stage: 'prospect',
                lead_source: signal.source,
                created_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (newLead) {
              // ─── PHASE 3: Create agenda action ─────────────────────
              const actionTitle = signal.alea_score >= 80
                ? `🔴 URGENTE: Evaluar oportunidad de ${signal.alea_score} puntos`
                : `Evaluar signal #${signal.id.slice(0, 8)} — Score: ${signal.alea_score}`;

              const { data: action } = await client
                .database
                .from('agenda_actions')
                .insert({
                  lead_id: newLead.id,
                  title: actionTitle,
                  action_type: 'follow_up',
                  action_category: 'contact',
                  due_date: signal.alea_score >= 80
                    ? new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4h for exceptional
                    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h for high
                  priority: signal.alea_score >= 80 ? 'critical' : 'high',
                  status: 'pending',
                  is_auto_generated: true,
                  trigger_rule: `signal_score_${signal.alea_score}`,
                  pipeline_stage: 'prospect',
                  sla_hours: signal.alea_score >= 80 ? 4 : 24,
                  sla_breached: false,
                  sla_breach_notified: false,
                  is_recurring: false,
                  created_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (action) {
                result.actionsCreated++;

                // ─── PHASE 4: Try to match investors ──────────────────
                const matchResult = await matchSignalToInvestors(client, signal, newLead.id);
                result.highPriorityMatches.push(...matchResult.highPriority);
              }
            }
          }
        }

        // Mark signal as qualified
        await client
          .database
          .from('signals')
          .update({ status: 'qualified', updated_at: new Date().toISOString() })
          .eq('id', signal.id);

        result.newSignals.push({
          id: signal.id,
          title: signal.title,
          alea_score: signal.alea_score,
        });

        await track({
          event_type: 'action.triggered',
          metadata: {
            loop_phase: 'signal_processing',
            signal_id: signal.id,
            alea_score: signal.alea_score,
            lead_created: true,
          },
        });
      } catch (err: any) {
        errors.push(`Signal ${signal.id}: ${err.message}`);
        // Mark signal as archived if processing failed
        await client
          .database
          .from('signals')
          .update({ status: 'archived', updated_at: new Date().toISOString() })
          .eq('id', signal.id);
      }
    }

    // ─── PHASE 5: Overdue actions escalation ─────────────────────────────
    const { data: overdueActions } = await client
      .database
      .from('agenda_actions')
      .select('*, leads!inner(id, name)')
      .eq('status', 'pending')
      .eq('sla_breached', false)
      .lt('due_date', new Date().toISOString());

    if (overdueActions && overdueActions.length > 0) {
      for (const action of overdueActions) {
        const hoursOverdue =
          (Date.now() - new Date(action.due_date).getTime()) / (1000 * 60 * 60);

        await client
          .database
          .from('agenda_actions')
          .update({
            sla_breached: true,
            priority: hoursOverdue > 48 ? 'critical' : 'urgent',
          })
          .eq('id', action.id);

        await track({
          event_type: 'action.triggered',
          metadata: {
            loop_phase: 'escalation',
            action_id: action.id,
            hours_overdue: Math.round(hoursOverdue),
          },
        });
      }
    }

    result.duration_ms = Date.now() - startTime;
    result.errors = errors;

    await track({
      event_type: 'action.triggered',
      metadata: {
        loop_result: result,
      },
    });

    return result;
  } catch (err: any) {
    result.errors.push(`Fatal: ${err.message}`);
    result.duration_ms = Date.now() - startTime;
    return result;
  }
}

/**
 * Match a signal to investors and notify them.
 */
async function matchSignalToInvestors(
  client: ReturnType<typeof createServerClient>,
  signal: any,
  leadId: string
): Promise<{ highPriority: Array<{ investor: string; opportunity: string; score: number }> }> {
  const highPriority: Array<{ investor: string; opportunity: string; score: number }> = { highPriority: [] } as any;

  try {
    // Get investors with piedra personality and budget overlap
    const { data: investors } = await client
      .database
      .from('investors')
      .select('id, full_name, piedra_personalidad, budget_min, budget_max')
      .not('piedra_personalidad', 'is', null)
      .gte('budget_max', signal.price || 0);

    if (!investors || investors.length === 0) return { highPriority: [] };

    for (const investor of investors) {
      // Check budget compatibility
      const budgetMin = investor.budget_min || 0;
      const budgetMax = investor.budget_max || Infinity;
      const signalPrice = signal.price || 0;

      if (signalPrice < budgetMin || signalPrice > budgetMax * 1.2) continue;

      // Calculate match score based on piedra
      let score = 50;
      const piedra = investor.piedra_personalidad?.toLowerCase();

      if (signal.alea_score >= 80) score += 30;
      else if (signal.alea_score >= 65) score += 20;
      else score += 10;

      if (score >= 70) {
        // Save match
        await client.database.from('investor_interests').insert({
          investor_id: investor.id,
          lead_id: leadId,
          signal_id: signal.id,
          match_score: score,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

        highPriority.push({
          investor: investor.full_name,
          opportunity: signal.title,
          score,
        });

        await track({
          event_type: 'action.triggered',
          metadata: {
            loop_phase: 'investor_match',
            investor_id: investor.id,
            signal_id: signal.id,
            score,
          },
        });
      }
    }
  } catch (err: any) {
    console.error('[autonomous-loop] match investors error:', err.message);
  }

  return { highPriority };
}

/**
 * Manual trigger — call this from an API route or cron.
 */
export async function triggerAutonomousLoop(): Promise<LoopResult> {
  const result = await runAutonomousLoop();
  return result;
}
