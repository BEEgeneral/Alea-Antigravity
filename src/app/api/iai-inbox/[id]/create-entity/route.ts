import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { entity_type, override_data } = body;

    if (!entity_type || !['investor', 'property', 'lead'].includes(entity_type)) {
      return NextResponse.json({ error: 'entity_type debe ser: investor, property o lead' }, { status: 400 });
    }

    // 1. Get the suggestion
    const suggestionResult = await pool.query(
      'SELECT * FROM iai_inbox_suggestions WHERE id = $1',
      [id]
    );
    const suggestion = suggestionResult.rows[0];

    if (!suggestion) {
      return NextResponse.json({ error: 'Sugerencia no encontrada' }, { status: 404 });
    }

    const extracted = suggestion.extracted_data || {};
    const data = { ...extracted, ...(override_data || {}) };

    let createdEntity = null;

    // 2. Create the appropriate entity
    if (entity_type === 'property') {
      // Check if property already exists (by title)
      let existingProperty = null;
      if (data.title) {
        const found = await pool.query(
          'SELECT id FROM properties WHERE title = $1',
          [data.title]
        );
        existingProperty = found.rows[0];
      }

      if (existingProperty) {
        return NextResponse.json({ 
          error: 'Propiedad ya existe', 
          existing_id: existingProperty.id,
          action: 'already_exists'
        }, { status: 409 });
      }

      const propertyResult = await pool.query(
        `INSERT INTO properties (title, description, asset_type, address, price, meters, vendor_name, is_off_market, is_published, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, false, $8)
         RETURNING *`,
        [
          data.title || suggestion.original_email_subject,
          data.description || '',
          normalizeAssetType(data.type),
          data.address || '',
          data.price || null,
          data.meters || null,
          data.vendor_name || data.contact_name || suggestion.sender_email,
          'system'
        ]
      );

      createdEntity = { type: 'property', data: propertyResult.rows[0] };

    } else if (entity_type === 'investor') {
      // Check if investor already exists (by email)
      let existingInvestor = null;
      if (data.contact_email) {
        const found = await pool.query(
          'SELECT id FROM investors WHERE email = $1',
          [data.contact_email]
        );
        existingInvestor = found.rows[0];
      }

      if (existingInvestor) {
        return NextResponse.json({ 
          error: 'Investidor ya existe', 
          existing_id: existingInvestor.id,
          action: 'already_exists'
        }, { status: 409 });
      }

      const investorResult = await pool.query(
        `INSERT INTO investors (full_name, email, phone, company_name, investor_type, budget_min, budget_max, kyc_status, source_of_funds)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
         RETURNING *`,
        [
          data.contact_name || data.title || suggestion.sender_email.split('@')[0],
          data.contact_email || suggestion.sender_email,
          data.contact_phone || '',
          data.company_name || '',
          normalizeInvestorType(data.investor_type),
          data.budget_min || data.min_ticket || null,
          data.budget_max || data.max_ticket || null,
          data.source_of_funds || 'email_inbox'
        ]
      );

      createdEntity = { type: 'investor', data: investorResult.rows[0] };

    } else if (entity_type === 'lead') {
      const leadResult = await pool.query(
        `INSERT INTO leads (name, email, phone, source, status, investor)
         VALUES ($1, $2, $3, 'email_inbox', 'new', $4)
         RETURNING *`,
        [
          data.contact_name || data.title || suggestion.sender_email.split('@')[0],
          data.contact_email || suggestion.sender_email,
          data.contact_phone || '',
          data.title
        ]
      );

      createdEntity = { type: 'lead', data: leadResult.rows[0] };
    }

    // 3. Update suggestion status
    await pool.query(
      `UPDATE iai_inbox_suggestions 
       SET status = 'approved', approved_at = NOW(), approved_by = $1, linked_entity_id = $2, linked_entity_type = $3
       WHERE id = $4`,
      ['system', createdEntity?.data?.id, entity_type, id]
    );

    return NextResponse.json({ 
      success: true, 
      created: createdEntity,
      suggestion_id: id 
    });

  } catch (error: any) {
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
