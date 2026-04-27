import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get('investorId');
    const status = searchParams.get('status') || 'new';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = 'SELECT * FROM investor_interests';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (investorId) {
      conditions.push(`investor_id = $${paramIndex++}`);
      params.push(investorId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);

    const interests = result.rows || [];

    const byInvestor: Record<string, any[]> = {};
    interests.forEach((interest: any) => {
      const invId = interest.investor_id;
      if (!byInvestor[invId]) {
        byInvestor[invId] = [];
      }
      byInvestor[invId].push(interest);
    });

    return NextResponse.json({
      interests,
      byInvestor,
      total: interests.length,
      newCount: interests.filter((i: any) => i.status === 'new').length || 0
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { interestId, status, notes, role } = await req.json();

    if (!interestId) {
      return NextResponse.json({ error: 'Missing interest ID' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) { updates.push(`status = $${paramIndex++}`); params.push(status); }
    if (notes !== undefined) { updates.push(`notes = $${paramIndex++}`); params.push(notes); }
    if (role !== undefined) { updates.push(`role = $${paramIndex++}`); params.push(role); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

      params.push(interestId);
    const result = await pool.query(
      `UPDATE investor_interests SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return NextResponse.json({ success: true, data: result.rows[0] });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { investor_id, property_id, lead_id, signal_id, role, match_score, notes } = body;

    if (!investor_id) {
      return NextResponse.json({ error: 'investor_id es obligatorio' }, { status: 400 });
    }

    // Check for duplicate
    if (property_id) {
      const existing = await pool.query(
        'SELECT id FROM investor_interests WHERE investor_id = $1 AND property_id = $2',
        [investor_id, property_id]
      );

      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Ya existe un interés para este inversor y propiedad' }, { status: 409 });
      }
    }

    const result = await pool.query(
      `INSERT INTO investor_interests (investor_id, property_id, lead_id, signal_id, role, match_score, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'new')
       RETURNING *`,
      [investor_id, property_id || null, lead_id || null, signal_id || null, role || 'buyer', match_score || null, notes || null]
    );

    return NextResponse.json({ interest: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
