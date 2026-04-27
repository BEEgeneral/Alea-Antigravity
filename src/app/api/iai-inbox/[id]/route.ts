import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      'SELECT * FROM iai_inbox_suggestions WHERE id = $1',
      [id]
    );
    const suggestion = result.rows[0];

    if (!suggestion) {
      return NextResponse.json({ error: "Sugerencia no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, override_data } = body;

    const updates: string[] = [];
    const paramsArr: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      paramsArr.push(status);
    }
    if (override_data) {
      updates.push(`extracted_data = $${paramIndex++}`);
      paramsArr.push(override_data);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    paramsArr.push(id);
    const result = await pool.query(
      `UPDATE iai_inbox_suggestions SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      paramsArr
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Sugerencia no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, suggestion: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, override_data } = body;

    // 1. Get the suggestion
    const suggestionResult = await pool.query(
      'SELECT * FROM iai_inbox_suggestions WHERE id = $1',
      [id]
    );
    const suggestion = suggestionResult.rows[0];

    if (!suggestion) {
      return NextResponse.json({ error: "Sugerencia no encontrada" }, { status: 404 });
    }

    const extracted = override_data || suggestion.extracted_data || {};
    let result: Record<string, any> = {};

    if (action === 'create_lead' || action === 'create') {
      // Create Lead from suggestion
      const leadResult = await pool.query(
        `INSERT INTO leads (name, email, phone, source, status, type, investor, property, ticket, created_by)
         VALUES ($1, $2, $3, 'iai_inbox', 'new', $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          extracted.name || suggestion.sender_email?.split('@')[0] || 'Lead desde IAI',
          extracted.email || suggestion.sender_email || '',
          extracted.phone || '',
          suggestion.suggestion_type === 'property' ? 'buyer' : 'seller',
          extracted.company_name || '',
          extracted.property_title || extracted.title || '',
          extracted.ticket_size || '',
          'system'
        ]
      );

      const lead = leadResult.rows[0];

      // Link opportunity if property/investor detected
      if (suggestion.suggestion_type === 'property' && lead.id) {
        await pool.query(
          `INSERT INTO opportunities (lead_id, alea_score, priority, status, pipeline_stage, created_by)
           VALUES ($1, 50, 'medium', 'active', 'prospect', $2)`,
          [lead.id, 'system']
        );
      }

      result = { lead };
    } else if (action === 'create_property') {
      const propertyResult = await pool.query(
        `INSERT INTO properties (title, description, type, price, meters, address, vendor_name, status, is_off_market, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'available', true, $8)
         RETURNING *`,
        [
          extracted.title || suggestion.original_email_subject || 'Propiedad desde IAI',
          extracted.description || '',
          normalizePropertyType(extracted.asset_type),
          parseFloat(extracted.price) || 0,
          parseFloat(extracted.meters) || 0,
          extracted.address || '',
          extracted.vendor_name || suggestion.sender_email || '',
          'system'
        ]
      );

      result = { property: propertyResult.rows[0] };
    } else if (action === 'create_investor') {
      const investorResult = await pool.query(
        `INSERT INTO investors (full_name, email, phone, company_name, investor_type, ticket_size, budget_min, budget_max, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9)
         RETURNING *`,
        [
          extracted.name || suggestion.sender_email?.split('@')[0] || 'Investor desde IAI',
          extracted.email || suggestion.sender_email || '',
          extracted.phone || '',
          extracted.company_name || '',
          normalizeInvestorType(extracted.investor_type),
          extracted.ticket_size || 'MEDIUM',
          parseFloat(extracted.budget_min) || 0,
          parseFloat(extracted.budget_max) || 0,
          'system'
        ]
      );

      result = { investor: investorResult.rows[0] };
    } else {
      return NextResponse.json({ error: 'acción desconocida. Use: create_lead, create_property, create_investor' }, { status: 400 });
    }

    // Mark suggestion as processed
    await pool.query(
      `UPDATE iai_inbox_suggestions SET status = 'approved', extracted_data = $1 WHERE id = $2`,
      [{ ...extracted, crm_result: result }, id]
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
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
