import pool from "@/lib/vps-pg";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get("id");
  const status = searchParams.get("status");
  const upcoming = searchParams.get("upcoming") === "true";

  try {
    let query = 'SELECT * FROM meetings';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (meetingId) {
      conditions.push(`id = $${paramIndex++}`);
      params.push(meetingId);
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (upcoming) {
      conditions.push(`scheduled_at >= NOW()`);
      conditions.push(`status IN ('scheduled', 'in_progress')`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY scheduled_at ASC';

    const result = await pool.query(query, params);
    return NextResponse.json({ meetings: result.rows || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, scheduled_at, duration_minutes, jitsi_room_name, jitsi_room_url, participant_ids, agenda_id } = body;

    if (!title || !scheduled_at) {
      return NextResponse.json({ error: "title and scheduled_at are required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO meetings (title, description, scheduled_at, duration_minutes, jitsi_room_name, jitsi_room_url, participant_ids, agenda_id, host_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
       RETURNING *`,
      [title, description, scheduled_at, duration_minutes || 30, jitsi_room_name, jitsi_room_url, participant_ids || [], agenda_id, 'system']
    );


    return NextResponse.json({ meeting: result.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, scheduled_at, duration_minutes, jitsi_room_name, jitsi_room_url, participant_ids, agenda_id, status, meeting_notes, fathom_recording_id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) { updates.push(`title = $${paramIndex++}`); params.push(title); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); params.push(description); }
    if (scheduled_at !== undefined) { updates.push(`scheduled_at = $${paramIndex++}`); params.push(scheduled_at); }
    if (duration_minutes !== undefined) { updates.push(`duration_minutes = $${paramIndex++}`); params.push(duration_minutes); }
    if (jitsi_room_name !== undefined) { updates.push(`jitsi_room_name = $${paramIndex++}`); params.push(jitsi_room_name); }
    if (jitsi_room_url !== undefined) { updates.push(`jitsi_room_url = $${paramIndex++}`); params.push(jitsi_room_url); }
    if (participant_ids !== undefined) { updates.push(`participant_ids = $${paramIndex++}`); params.push(participant_ids); }
    if (agenda_id !== undefined) { updates.push(`agenda_id = $${paramIndex++}`); params.push(agenda_id); }
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); params.push(status); }
    if (meeting_notes !== undefined) { updates.push(`meeting_notes = $${paramIndex++}`); params.push(meeting_notes); }
    if (fathom_recording_id !== undefined) { updates.push(`fathom_recording_id = $${paramIndex++}`); params.push(fathom_recording_id); }

    params.push(id);
    const result = await pool.query(
      `UPDATE meetings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    return NextResponse.json({ meeting: result.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get("id");

  if (!meetingId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const result = await pool.query('DELETE FROM meetings WHERE id = $1 RETURNING id', [meetingId]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
