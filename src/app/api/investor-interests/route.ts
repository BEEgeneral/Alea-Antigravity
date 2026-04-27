import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function GET(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get('investorId');
    const status = searchParams.get('status') || 'new';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = client
      .database
      .from('investor_interests')
      .select(`
        *,
        investor:investors(id, full_name, company_name, email, max_ticket_eur),
        property:properties(id, title, address, asset_type, price, thumbnail_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (investorId) {
      query = query.eq('investor_id', investorId);
    }

    const { data: interests, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const byInvestor: Record<string, any[]> = {};
    (interests || []).forEach((interest: any) => {
      const invId = interest.investor_id;
      if (!byInvestor[invId]) {
        byInvestor[invId] = [];
      }
      byInvestor[invId].push(interest);
    });

    return NextResponse.json({
      interests: interests || [],
      byInvestor,
      total: interests?.length || 0,
      newCount: interests?.filter((i: any) => i.status === 'new').length || 0
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interestId, status, notes, role } = await req.json();

    if (!interestId) {
      return NextResponse.json({ error: 'Missing interest ID' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (role !== undefined) updateData.role = role; // 'buyer' | 'seller' | 'both'

    const { data, error } = await client
      .database
      .from('investor_interests')
      .update(updateData)
      .eq('id', interestId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

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
    const { investor_id, property_id, lead_id, signal_id, role, match_score, notes } = body;

    if (!investor_id) {
      return NextResponse.json({ error: 'investor_id es obligatorio' }, { status: 400 });
    }

    // Check for duplicate
    if (property_id) {
      const { data: existing } = await client.database
        .from('investor_interests')
        .select('id')
        .eq('investor_id', investor_id)
        .eq('property_id', property_id)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Ya existe un interés para este inversor y propiedad' }, { status: 409 });
      }
    }

    const { data, error } = await client.database
      .from('investor_interests')
      .insert({
        investor_id,
        property_id: property_id || null,
        lead_id: lead_id || null,
        signal_id: signal_id || null,
        role: role || 'buyer', // 'buyer' | 'seller' | 'both'
        match_score: match_score || null,
        notes: notes || null,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ interest: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
