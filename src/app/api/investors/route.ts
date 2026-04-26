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
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const piedra = searchParams.get('piedra');
    const investorType = searchParams.get('type');
    const search = searchParams.get('search');

    let query = client
      .database
      .from('investors')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (piedra) {
      query = query.eq('piedra_personalidad', piedra);
    }

    if (investorType) {
      query = query.eq('investor_type', investorType);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: investors, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get classification counts by piedra
    const { data: piedraStats } = await client
      .database
      .from('investors')
      .select('piedra_personalidad')
      .not('piedra_personalidad', 'is', null);

    const stats = {
      total: investors?.length || 0,
      byPiedra: {
        ZAFIRO: investors?.filter(i => i.piedra_personalidad === 'ZAFIRO').length || 0,
        PERLA: investors?.filter(i => i.piedra_personalidad === 'PERLA').length || 0,
        ESMERALDA: investors?.filter(i => i.piedra_personalidad === 'ESMERALDA').length || 0,
        RUBI: investors?.filter(i => i.piedra_personalidad === 'RUBI').length || 0,
      },
      classified: investors?.filter(i => i.piedra_personalidad).length || 0,
      unclassified: investors?.filter(i => !i.piedra_personalidad).length || 0
    };

    return NextResponse.json({ 
      investors: investors || [], 
      stats,
      pagination: { limit, offset, total: investors?.length || 0 }
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

    const { 
      full_name, 
      email, 
      phone, 
      company_name, 
      job_title,
      investor_type,
      budget_min,
      budget_max,
      notes,
      source
    } = await req.json();

    if (!full_name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: investor, error } = await client
      .database
      .from('investors')
      .insert({
        full_name,
        email,
        phone,
        company_name,
        job_title,
        investor_type: investor_type || 'UNKNOWN',
        budget_min,
        budget_max,
        notes,
        source: source || 'manual',
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ investor }, { status: 201 });

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

    const { id, ...updates } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Investor ID is required' }, { status: 400 });
    }

    const { data: investor, error } = await client
      .database
      .from('investors')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ investor });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
