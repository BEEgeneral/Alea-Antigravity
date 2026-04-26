import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function POST(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { investor_id, event_type, target_type, target_id, metadata, source } = await req.json();

    if (!investor_id || !event_type || !target_type) {
      return NextResponse.json({ error: 'Missing required fields: investor_id, event_type, target_type' }, { status: 400 });
    }

    const validEventTypes = ['view', 'inquiry', 'visit', 'message', 'document_open', 'favorite', 'share', 'match_shown', 'alert_sent'];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json({ error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` }, { status: 400 });
    }

    const { data, error } = await client
      .database
      .from('investor_behavior')
      .insert({
        investor_id,
        event_type,
        target_type,
        target_id,
        metadata: metadata || {},
        source: source || 'direct',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, behavior: data }, { status: 201 });

  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
