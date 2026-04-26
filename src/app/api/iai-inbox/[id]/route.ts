import { NextResponse } from 'next/server';
import { createAuthenticatedClient, createServerClient } from '@/lib/insforge-server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: suggestion, error } = await client
      .database
      .from('iai_inbox_suggestions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!suggestion) {
      return NextResponse.json({ error: 'Sugerencia no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ suggestion });
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

    const { status, override_data } = body;

    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (override_data) updateData.extracted_data = override_data;

    const { data, error } = await client
      .database
      .from('iai_inbox_suggestions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, suggestion: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/iai-inbox/[id]
 * Crea un registro CRM (Lead, Property, Investor) desde una sugerencia aprobada.
 * Body: { action: 'create_lead' | 'create_property' | 'create_investor' }
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, override_data } = body;

    // 1. Get the suggestion
    const { data: suggestion, error: suggestionError } = await client
      .database
      .from('iai_inbox_suggestions')
      .select('*')
      .eq('id', id)
      .single();

    if (suggestionError || !suggestion) {
      return NextResponse.json({ error: 'Sugerencia no encontrada' }, { status: 404 });
    }

    const extracted = override_data || suggestion.extracted_data || {};
    const adminClient = createServerClient();
    let result: Record<string, any> = {};

    if (action === 'create_lead' || action === 'create') {
      // Create Lead from suggestion
      const { data: lead, error: leadError } = await adminClient
        .database
        .from('leads')
        .insert({
          name: extracted.name || suggestion.sender_email?.split('@')[0] || 'Lead desde IAI',
          email: extracted.email || suggestion.sender_email || '',
          phone: extracted.phone || '',
          source: 'iai_inbox',
          status: 'new',
          type: suggestion.suggestion_type === 'property' ? 'buyer' : 'seller',
          investor: extracted.company_name || '',
          property: extracted.property_title || extracted.title || '',
          ticket: extracted.ticket_size || '',
          created_by: user.id,
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // Link opportunity if property/investor detected
      if (suggestion.suggestion_type === 'property' && lead.id) {
        await adminClient
          .database
          .from('opportunities')
          .insert({
            lead_id: lead.id,
            alea_score: 50,
            priority: 'medium',
            status: 'active',
            pipeline_stage: 'prospect',
            created_by: user.id,
          });
      }

      result = { lead };
    } else if (action === 'create_property') {
      const { data: property, error: propertyError } = await adminClient
        .database
        .from('properties')
        .insert({
          title: extracted.title || suggestion.original_email_subject || 'Propiedad desde IAI',
          description: extracted.description || '',
          type: normalizePropertyType(extracted.asset_type),
          price: parseFloat(extracted.price) || 0,
          meters: parseFloat(extracted.meters) || 0,
          address: extracted.address || '',
          vendor_name: extracted.vendor_name || suggestion.sender_email || '',
          status: 'available',
          is_off_market: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (propertyError) throw propertyError;
      result = { property };
    } else if (action === 'create_investor') {
      const { data: investor, error: investorError } = await adminClient
        .database
        .from('investors')
        .insert({
          full_name: extracted.name || suggestion.sender_email?.split('@')[0] || 'Investor desde IAI',
          email: extracted.email || suggestion.sender_email || '',
          phone: extracted.phone || '',
          company_name: extracted.company_name || '',
          investor_type: normalizeInvestorType(extracted.investor_type),
          ticket_size: extracted.ticket_size || 'MEDIUM',
          budget_min: parseFloat(extracted.budget_min) || 0,
          budget_max: parseFloat(extracted.budget_max) || 0,
          status: 'active',
          created_by: user.id,
        })
        .select()
        .single();

      if (investorError) throw investorError;
      result = { investor };
    } else {
      return NextResponse.json({ error: 'acción desconocida. Use: create_lead, create_property, create_investor' }, { status: 400 });
    }

    // Mark suggestion as processed
    await client
      .database
      .from('iai_inbox_suggestions')
      .update({ 
        status: 'approved',
        extracted_data: { ...extracted, crm_result: result }
      })
      .eq('id', id);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('IAI Inbox POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function normalizePropertyType(type: string): string {
  if (!type) return 'RESIDENTIAL';
  const t = type.toUpperCase();
  if (t.includes('HOTEL')) return 'HOTEL';
  if (t.includes('RETAIL') || t.includes('COMERCIAL')) return 'RETAIL';
  if (t.includes('OFFICE') || t.includes('OFICINA')) return 'OFFICE';
  if (t.includes('LOGIST') || t.includes('INDUST')) return 'INDUSTRIAL';
  if (t.includes('SUELO') || t.includes('LAND')) return 'LAND';
  if (t.includes('MIXED') || t.includes('MIXTO')) return 'MIXED_USE';
  return 'RESIDENTIAL';
}

function normalizeInvestorType(type: string): string {
  if (!type) return 'HNW_INDIVIDUAL';
  const t = type.toUpperCase();
  if (t.includes('FAMILY_OFFICE')) return 'FAMILY_OFFICE';
  if (t.includes('INSTITUTIONAL')) return 'INSTITUTIONAL';
  if (t.includes('FUND')) return 'REAL_ESTATE_FUND';
  if (t.includes('REGIONAL')) return 'REGIONAL_INVESTOR';
  if (t.includes('INTERNATIONAL')) return 'INTERNATIONAL_BUYER';
  return 'HNW_INDIVIDUAL';
}
