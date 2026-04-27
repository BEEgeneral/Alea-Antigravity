import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const pipeline = url.searchParams.get('pipeline_stage');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    let query = 'SELECT * FROM opportunities';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (priority && priority !== 'all') {
      conditions.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }
    if (pipeline && pipeline !== 'all') {
      conditions.push(`pipeline_stage = $${paramIndex++}`);
      params.push(pipeline);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY detected_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);

    const countResult = await pool.query('SELECT COUNT(*) as count FROM opportunities');

    return NextResponse.json({
      opportunities: result.rows || [],
      total: parseInt(countResult.rows[0]?.count || '0'),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      signal_id,
      property_id,
      investor_id,
      lead_id,
      priority,
      estimated_value,
    } = body;

    // Calculate alea_score from signal if provided
    let alea_score = 50;
    if (signal_id) {
      const signalResult = await pool.query('SELECT alea_score FROM signals WHERE id = $1', [signal_id]);
      if (signalResult.rows.length > 0) {
        alea_score = signalResult.rows[0].alea_score || 50;
      }
    }

    // Determine priority from score
    let finalPriority = priority || 'medium';
    if (!priority && alea_score >= 80) finalPriority = 'exceptional';
    else if (!priority && alea_score >= 65) finalPriority = 'high';
    else if (!priority && alea_score >= 45) finalPriority = 'medium';
    else if (!priority) finalPriority = 'low';

    const result = await pool.query(
      `INSERT INTO opportunities (signal_id, property_id, investor_id, lead_id, alea_score, priority, estimated_value, status, pipeline_stage, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 'prospect', $8)
       RETURNING *`,
      [signal_id, property_id, investor_id, lead_id, alea_score, finalPriority, estimated_value, 'system']
    );


    return NextResponse.json({ success: true, opportunity: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
