import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: signal, error } = await client
      .database
      .from('signals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!signal) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }

    return NextResponse.json({ signal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const allowedFields = [
      'status', 'title', 'asset_type', 'location_hint', 'address',
      'price', 'meters', 'vendor_name', 'vendor_contact', 'description',
      'linked_property_id', 'linked_investor_id', 'analyst_notes',
      'rejection_reason', 'raw_data', 'attachment_urls'
    ];

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Auto-set timestamps based on status transition
    if (body.status === 'analyzing' && !body.analyzed_at) {
      updateData.analyzed_at = new Date().toISOString();
    }
    if (body.status === 'qualified' && !body.qualified_at) {
      updateData.qualified_at = new Date().toISOString();
    }
    if (body.status === 'closed' && !body.closed_at) {
      updateData.closed_at = new Date().toISOString();
    }

    const { data, error } = await client
      .database
      .from('signals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, signal: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await client
      .database
      .from('signals')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
