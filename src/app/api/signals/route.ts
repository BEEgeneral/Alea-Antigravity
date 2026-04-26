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
    const source = url.searchParams.get('source');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    let query = client.database
      .from('signals')
      .select('*', { count: 'exact' })
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    const { data: signals, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      signals: signals || [],
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
      source,
      source_url,
      source_reference,
      title,
      asset_type,
      location_hint,
      address,
      price,
      price_raw,
      meters,
      vendor_name,
      vendor_contact,
      description,
      raw_data,
      attachment_urls,
    } = body;

    if (!source || !title) {
      return NextResponse.json({ error: 'source y title son obligatorios' }, { status: 400 });
    }

    // Calculate Alea score (simplified)
    let alea_score = 50;
    if (source === 'network' || source === 'architect') alea_score += 20;
    if (source === 'boe') alea_score += 10;
    if (price && price < 2000000) alea_score += 10;
    if (meters && meters > 1000) alea_score += 10;
    alea_score = Math.min(100, alea_score);

    let score_classification = 'medium';
    if (alea_score >= 80) score_classification = 'exceptional';
    else if (alea_score >= 65) score_classification = 'high';
    else if (alea_score >= 45) score_classification = 'medium';
    else score_classification = 'low';

    const { data, error } = await client
      .database
      .from('signals')
      .insert({
        source,
        source_url,
        source_reference,
        title,
        asset_type,
        location_hint,
        address,
        price,
        price_raw,
        meters,
        vendor_name,
        vendor_contact,
        description,
        alea_score,
        score_classification,
        status: 'detected',
        raw_data,
        attachment_urls,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, signal: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
