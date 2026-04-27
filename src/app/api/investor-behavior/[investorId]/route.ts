import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ investorId: string }> }
) {
  try {
    const { investorId } = await params;
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('eventType');
    const days = parseInt(searchParams.get('days') || '90');
    const limit = parseInt(searchParams.get('limit') || '100');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let query = 'SELECT * FROM investor_behavior WHERE investor_id = $1 AND created_at >= $2';
    const paramsArr: any[] = [investorId, cutoffDate.toISOString()];
    let paramIndex = 3;

    if (eventType) {
      query += ` AND event_type = $${paramIndex++}`;
      paramsArr.push(eventType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    paramsArr.push(limit);

    const result = await pool.query(query, paramsArr);
    const events = result.rows;

    // Aggregate statistics
    const stats = {
      total: events.length || 0,
      byType: {} as Record<string, number>,
      uniqueProperties: new Set(events.filter((e: any) => e.target_type === 'property').map((e: any) => e.target_id)).size,
      lastActivity: events[0]?.created_at || null
    };

    events.forEach((e: any) => {
      stats.byType[e.event_type] = (stats.byType[e.event_type] || 0) + 1;
    });

    return NextResponse.json({ 
      events: events || [], 
      stats,
      investorId 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
