/**
 * API: /api/telemetry
 * POST — log a telemetry event
 * GET — get telemetry summary dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { track, getTelemetrySummary, recordFeedback, getExperimentResults } from '@/lib/telemetry';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    await track(event);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'summary';
    const period = parseInt(searchParams.get('period') || '7');

    if (action === 'summary') {
      const summary = await getTelemetrySummary(period);
      return NextResponse.json(summary);
    }

    if (action === 'experiments') {
      const experimentId = searchParams.get('experimentId');
      if (!experimentId) {
        return NextResponse.json({ error: 'Missing experimentId' }, { status: 400 });
      }
      const results = await getExperimentResults(experimentId);
      return NextResponse.json({ results });
    }

    if (action === 'feedback') {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const client = await createAuthenticatedClient();
      const { data, error } = await client
        .database
        .from('ai_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ feedback: data || [] });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
