import pool from "@/lib/vps-pg";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agent_id");
  const actionId = searchParams.get("action_id");
  const status = searchParams.get("status") || "pending";
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (agentId) {
      conditions.push(`assigned_agent_id = $${paramIndex++}`);
      params.push(agentId);
    }
    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (actionId) {
      conditions.push(`action_id = $${paramIndex++}`);
      params.push(actionId);
    }

    let query = 'SELECT * FROM agenda_reminders';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ` ORDER BY scheduled_for ASC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action_id,
      lead_id,
      reminder_type = "notification",
      title,
      message,
      scheduled_for,
      channel = "in_app",
      priority = "medium",
      assigned_agent_id,
    } = body;

    const result = await pool.query(
      `INSERT INTO agenda_reminders (action_id, lead_id, reminder_type, title, message, scheduled_for, channel, priority, assigned_agent_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING *`,
      [action_id, lead_id, reminder_type, title, message, scheduled_for, channel, priority, assigned_agent_id || 'system']
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updateParts: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.status === "sent" || updates.status === "read") {
      updateParts.push(`sent_at = $${paramIndex++}`);
      params.push(updates.sent_at || new Date().toISOString());
      if (updates.status === "read") {
        updateParts.push(`read_at = $${paramIndex++}`);
        params.push(new Date().toISOString());
      }
    }

    for (const key of Object.keys(updates)) {
      if (key !== 'id' && key !== 'sent_at' && key !== 'read_at') {
        updateParts.push(`${key} = $${paramIndex++}`);
        params.push(updates[key]);
      }
    }

    if (updateParts.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE agenda_reminders SET ${updateParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return NextResponse.json(result.rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    const result = await pool.query('DELETE FROM agenda_reminders WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
