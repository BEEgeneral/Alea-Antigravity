import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ investorId: string }> }
) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { investorId } = await params;
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('eventType');
    const days = parseInt(searchParams.get('days') || '90');
    const limit = parseInt(searchParams.get('limit') || '100');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let query = client
      .database
      .from('investor_behavior')
      .select('*')
      .eq('investor_id', investorId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data: events, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate statistics
    const stats = {
      total: events?.length || 0,
      byType: {} as Record<string, number>,
      uniqueProperties: new Set(events?.filter(e => e.target_type === 'property').map(e => e.target_id)).size,
      lastActivity: events?.[0]?.created_at || null
    };

    (events || []).forEach((e: any) => {
      stats.byType[e.event_type] = (stats.byType[e.event_type] || 0) + 1;
    });

    return NextResponse.json({ 
      events: events || [], 
      stats,
      investorId 
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
