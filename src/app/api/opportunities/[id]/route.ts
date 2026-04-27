import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const result = await pool.query(
      'SELECT * FROM opportunities WHERE id = $1',
      [id]
    );
    const opp = result.rows[0];

    if (!opp) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json({ opportunity: opp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const allowedFields = [
      'status', 'priority', 'pipeline_stage', 'investor_id', 'property_id',
      'signal_id', 'first_contact_at', 'nda_signed_at', 'visit_scheduled_at',
      'offer_made_at', 'closing_expected_at', 'closed_at', 'estimated_value',
      'offered_price', 'final_price', 'summary', 'closing_notes', 'loss_reason',
      'metadata'
    ];

    const updateParts: string[] = ['updated_at = NOW()', 'last_update_at = NOW()', 'sla_breached = false', 'sla_breach_notified = false'];
    const paramsArr: any[] = [];
    let paramIndex = 1;
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateParts.push(`${field} = $${paramIndex++}`);
        paramsArr.push(body[field]);
      }
    }

    paramsArr.push(id);
    const result = await pool.query(
      `UPDATE opportunities SET ${updateParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      paramsArr
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, opportunity: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const result = await pool.query('DELETE FROM opportunities WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
