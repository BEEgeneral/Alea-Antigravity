import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { investor_id, event_type, target_type, target_id, metadata, source } = await req.json();

    if (!investor_id || !event_type || !target_type) {
      return NextResponse.json({ error: 'Missing required fields: investor_id, event_type, target_type' }, { status: 400 });
    }

    const validEventTypes = ['view', 'inquiry', 'visit', 'message', 'document_open', 'favorite', 'share', 'match_shown', 'alert_sent'];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json({ error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO investor_behavior (investor_id, event_type, target_type, target_id, metadata, source, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [investor_id, event_type, target_type, target_id, metadata || {}, source || 'direct']
    );

    return NextResponse.json({ success: true, behavior: result.rows[0] }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
