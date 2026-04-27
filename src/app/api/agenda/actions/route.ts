import pool from "@/lib/vps-pg";
import { NextRequest, NextResponse } from "next/server";

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET=process.env.GMAIL_CLIENT_SECRET || '';

async function getFreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });
    const data = await response.json();
    return data.access_token || null;
  } catch { return null; }
}

async function getGmailTokens(userId: string) {
  const result = await pool.query(
    'SELECT * FROM gmail_tokens WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

async function createCalendarEvent(accessToken: string, summary: string, description: string, startTime: string, endTime: string, attendees: string[]) {
  const endDate = new Date(new Date(endTime).getTime() + 60 * 60 * 1000).toISOString();
  
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: startTime },
      end: { dateTime: endDate },
      attendees: attendees?.map(email => ({ email })) || [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      },
      conferenceData: {
        createRequest: {
          requestId: `alea-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    }),
  });
  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("lead_id");
    const status = searchParams.get("status");
    const assignedToMe = searchParams.get("assigned_to_me");
    const overdue = searchParams.get("overdue");
    const limit = parseInt(searchParams.get("limit") || "50");
    const userId = searchParams.get("user_id");

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (leadId) {
      conditions.push(`lead_id = $${paramIndex++}`);
      params.push(leadId);
    }
    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (assignedToMe === "true" && userId) {
      conditions.push(`assigned_agent_id = $${paramIndex++}`);
      params.push(userId);
    }
    if (overdue === "true") {
      conditions.push(`due_date < NOW()`);
      conditions.push(`status != 'completed'`);
      conditions.push(`status != 'cancelled'`);
    }

    let query = 'SELECT * FROM agenda_actions';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ` ORDER BY due_date ASC LIMIT $${paramIndex}`;
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
      lead_id,
      investor_id,
      property_id,
      title,
      description,
      action_type,
      action_category,
      due_date,
      scheduled_for,
      estimated_duration_minutes = 30,
      priority = "medium",
      status = "pending",
      sla_hours,
      pipeline_stage,
      assigned_agent_id,
      is_auto_generated = false,
      trigger_rule,
      create_calendar_event = false,
      calendar_attendees = [],
    } = body;

    const result = await pool.query(
      `INSERT INTO agenda_actions (lead_id, investor_id, property_id, title, description, action_type, action_category, due_date, scheduled_for, estimated_duration_minutes, priority, status, sla_hours, pipeline_stage, assigned_agent_id, created_by, is_auto_generated, trigger_rule)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [lead_id, investor_id, property_id, title, description, action_type, action_category, due_date, scheduled_for, estimated_duration_minutes, priority, status, sla_hours, pipeline_stage, assigned_agent_id || 'system', 'system', is_auto_generated, trigger_rule]
    );


    const data = result.rows[0];
    let calendarEvent = null;
    
    if (create_calendar_event && action_type === 'meeting' && data.due_date) {
      const tokens = await getGmailTokens(assigned_agent_id || 'system');
      if (tokens?.refresh_token) {
        let accessToken = tokens.access_token;
        if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
          accessToken = await getFreshAccessToken(tokens.refresh_token) || accessToken;
        }
        if (accessToken) {
          try {
            calendarEvent = await createCalendarEvent(
              accessToken,
              title,
              description || '',
              data.due_date,
              data.due_date,
              calendar_attendees
            );
            
            if (calendarEvent.id) {
              await pool.query(
                "UPDATE agenda_actions SET google_calendar_event_id = $1 WHERE id = $2",
                [calendarEvent.id, data.id]
              );
              calendarEvent.htmlLink = `https://calendar.google.com/calendar/event?id=${calendarEvent.id}`;
            }
          } catch (calError: any) {
            // Calendar event creation failed, continue without it
          }
        }
      }
    }

    await pool.query(
      `INSERT INTO agenda_activity_log (action_id, lead_id, activity_type, description, agent_id)
       VALUES ($1, $2, 'created', $3, $4)`,
      [data.id, lead_id, `Action created: ${title}`, assigned_agent_id || 'system']
    );

    if (lead_id && due_date) {
      await pool.query(
        "UPDATE leads SET current_action_id = $1, next_action_due = $2 WHERE id = $3",
        [data.id, due_date, lead_id]
      );
    }

    return NextResponse.json({ ...data, calendarEvent }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    if (updates.status === "completed") {
      updateParts.push(`completed_at = $${paramIndex++}`);
      params.push(new Date().toISOString());
      updateParts.push(`completed_by = $${paramIndex++}`);
      params.push(updates.user_id || 'system');
    }

    for (const key of Object.keys(updates)) {
      if (key !== 'id' && key !== 'completed_at' && key !== 'completed_by') {
        updateParts.push(`${key} = $${paramIndex++}`);
        params.push(updates[key]);
      }
    }

    if (updateParts.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE agenda_actions SET ${updateParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );


    const data = result.rows[0];
    
    await pool.query(
      `INSERT INTO agenda_activity_log (action_id, lead_id, activity_type, description, agent_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, data.lead_id, updates.status === "completed" ? "completed" : "updated", `Action ${updates.status === "completed" ? "completed" : "updated"}: ${data.title}`, updates.user_id || 'system']
    );

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const result = await pool.query('DELETE FROM agenda_actions WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
