import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function GET(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const pipeline = url.searchParams.get('pipeline_stage');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    let query = client.database
      .from('opportunities')
      .select('*', { count: 'exact' })
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }
    if (pipeline && pipeline !== 'all') {
      query = query.eq('pipeline_stage', pipeline);
    }

    const { data: opportunities, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      opportunities: opportunities || [],
      total: count || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      signal_id,
      property_id,
      investor_id,
      lead_id,
      priority,
      estimated_value,
    } = body;

    // Calculate alea_score from signal if provided
    let alea_score = 50;
    if (signal_id) {
      const { data: signal } = await client
        .database
        .from('signals')
        .select('alea_score')
        .eq('id', signal_id)
        .single();
      if (signal) alea_score = signal.alea_score || 50;
    }

    // Determine priority from score
    let finalPriority = priority || 'medium';
    if (!priority && alea_score >= 80) finalPriority = 'exceptional';
    else if (!priority && alea_score >= 65) finalPriority = 'high';
    else if (!priority && alea_score >= 45) finalPriority = 'medium';
    else if (!priority) finalPriority = 'low';

    const { data, error } = await client
      .database
      .from('opportunities')
      .insert({
        signal_id,
        property_id,
        investor_id,
        lead_id,
        alea_score,
        priority: finalPriority,
        estimated_value,
        status: 'active',
        pipeline_stage: 'prospect',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, opportunity: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
