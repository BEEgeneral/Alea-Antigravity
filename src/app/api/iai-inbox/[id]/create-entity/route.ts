import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { entity_type, override_data } = body;

    if (!entity_type || !['investor', 'property', 'lead'].includes(entity_type)) {
      return NextResponse.json({ error: 'entity_type debe ser: investor, property o lead' }, { status: 400 });
    }

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

    const extracted = suggestion.extracted_data || {};
    const data = { ...extracted, ...(override_data || {}) };

    let createdEntity = null;

    // 2. Create the appropriate entity
    if (entity_type === 'property') {
      // Check if property already exists (by title + vendor_name or address)
      let existingProperty = null;
      if (data.title) {
        const { data: found } = await client
          .database
          .from('properties')
          .select('id')
          .eq('title', data.title)
          .maybeSingle();
        existingProperty = found;
      }

      if (existingProperty) {
        return NextResponse.json({ 
          error: 'Propiedad ya existe', 
          existing_id: existingProperty.id,
          action: 'already_exists'
        }, { status: 409 });
      }

      const { data: property, error: propertyError } = await client
        .database
        .from('properties')
        .insert({
          title: data.title || suggestion.original_email_subject,
          description: data.description || '',
          asset_type: normalizeAssetType(data.type),
          address: data.address || '',
          price: data.price || null,
          meters: data.meters || null,
          vendor_name: data.vendor_name || data.contact_name || suggestion.sender_email,
          is_off_market: true,
          is_published: false,
          owner_id: user.id,
        })
        .select()
        .single();

      if (propertyError) throw propertyError;
      createdEntity = { type: 'property', data: property };

    } else if (entity_type === 'investor') {
      // Check if investor already exists (by email or name)
      let existingInvestor = null;
      if (data.contact_email) {
        const { data: found } = await client
          .database
          .from('investors')
          .select('id')
          .eq('email', data.contact_email)
          .maybeSingle();
        existingInvestor = found;
      }

      if (existingInvestor) {
        return NextResponse.json({ 
          error: 'Investidor ya existe', 
          existing_id: existingInvestor.id,
          action: 'already_exists'
        }, { status: 409 });
      }

      const { data: investor, error: investorError } = await client
        .database
        .from('investors')
        .insert({
          full_name: data.contact_name || data.title || suggestion.sender_email.split('@')[0],
          email: data.contact_email || suggestion.sender_email,
          phone: data.contact_phone || '',
          company_name: data.company_name || '',
          investor_type: normalizeInvestorType(data.investor_type),
          budget_min: data.budget_min || data.min_ticket || null,
          budget_max: data.budget_max || data.max_ticket || null,
          kyc_status: 'pending',
          source_of_funds: data.source_of_funds || 'email_inbox',
        })
        .select()
        .single();

      if (investorError) throw investorError;
      createdEntity = { type: 'investor', data: investor };

    } else if (entity_type === 'lead') {
      const { data: lead, error: leadError } = await client
        .database
        .from('leads')
        .insert({
          name: data.contact_name || data.title || suggestion.sender_email.split('@')[0],
          email: data.contact_email || suggestion.sender_email,
          phone: data.contact_phone || '',
          source: 'email_inbox',
          status: 'new',
          investor: data.title,
        })
        .select()
        .single();

      if (leadError) throw leadError;
      createdEntity = { type: 'lead', data: lead };
    }

    // 3. Update suggestion status
    await client
      .database
      .from('iai_inbox_suggestions')
      .update({ 
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        linked_entity_id: createdEntity?.data?.id,
        linked_entity_type: entity_type,
      })
      .eq('id', id);

    return NextResponse.json({ 
      success: true, 
      created: createdEntity,
      suggestion_id: id 
    });

  } catch (error: any) {
    console.error('Create entity error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function normalizeAssetType(type: string): string {
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
  if (t.includes('FAMILY') || t.includes('FAMILIA')) return 'FAMILY_OFFICE';
  if (t.includes('INSTITUTIONAL') || t.includes('INSTITUCIONAL')) return 'INSTITUTIONAL';
  if (t.includes('FUND') || t.includes('FONDO')) return 'REAL_ESTATE_FUND';
  if (t.includes('REGIONAL')) return 'REGIONAL_INVESTOR';
  if (t.includes('INTERNATIONAL') || t.includes('INTERNACIONAL')) return 'INTERNATIONAL_BUYER';
  return 'HNW_INDIVIDUAL';
}
