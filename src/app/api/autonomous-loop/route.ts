/**
 * API: /api/autonomous-loop
 * POST — Trigger the autonomous loop manually (or from cron)
 * GET  — Get last loop results
 */

import { NextRequest, NextResponse } from 'next/server';
import { triggerAutonomousLoop } from '@/lib/autonomous-loop';
import { createServerClient } from '@/lib/insforge-server';

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
    const client = createServerClient();

    // Get last 10 loop executions from telemetry
    const { data: executions } = await client
      .database
      .from('telemetry_events')
      .select('metadata, created_at')
      .eq('event_type', 'action.triggered')
      .eq('metadata->>loop_phase', 'signal_processing')
      .order('created_at', { ascending: false })
      .limit(5);

    // Get pending signals count
    const { count: pendingSignals } = await client
      .database
      .from('signals')
      .select('id', { count: 'exact' })
      .eq('status', 'detected');

    // Get pending actions count
    const { count: pendingActions } = await client
      .database
      .from('agenda_actions')
      .select('id', { count: 'exact' })
      .eq('status', 'pending');

    return NextResponse.json({
      lastExecutions: executions || [],
      pendingSignals: pendingSignals || 0,
      pendingActions: pendingActions || 0,
      loopStatus: 'operational',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
