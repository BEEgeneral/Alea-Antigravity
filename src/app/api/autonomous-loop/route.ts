/**
 * API: /api/autonomous-loop
 * POST — Trigger the autonomous loop manually (or from cron)
 * GET  — Get last loop results
 */

import { NextRequest, NextResponse } from 'next/server';
import { triggerAutonomousLoop } from '@/lib/autonomous-loop';
import pool from '@/lib/vps-pg';

export async function POST(req: NextRequest) {
  try {
    // Optional: CRON_SECRET for external triggers
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await triggerAutonomousLoop();

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get last 5 loop executions from telemetry
    const executionsResult = await pool.query(
      `SELECT metadata, created_at FROM telemetry_events 
       WHERE event_type = 'action.triggered' AND metadata->>'loop_phase' = 'signal_processing'
       ORDER BY created_at DESC LIMIT 5`
    );
    const executions = executionsResult.rows;

    // Get pending signals count
    const pendingSignalsResult = await pool.query(
      "SELECT COUNT(*) as count FROM signals WHERE status = 'detected'"
    );
    const pendingSignals = parseInt(pendingSignalsResult.rows[0]?.count || '0');

    // Get pending actions count
    const pendingActionsResult = await pool.query(
      "SELECT COUNT(*) as count FROM agenda_actions WHERE status = 'pending'"
    );
    const pendingActions = parseInt(pendingActionsResult.rows[0]?.count || '0');

    return NextResponse.json({
      lastExecutions: executions || [],
      pendingSignals,
      pendingActions,
      loopStatus: 'operational',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
