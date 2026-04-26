import { createAuthenticatedClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';

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

async function getGmailTokens(client: any, userId: string) {
  const { data } = await client.database
    .from('gmail_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
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
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
  
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("lead_id");
    const status = searchParams.get("status");
    const assignedToMe = searchParams.get("assigned_to_me");
    const overdue = searchParams.get("overdue");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = client
      .database
      .from("agenda_actions")
      .select("*")
      .order("due_date", { ascending: true })
      .limit(limit);

    if (leadId) query = query.eq("lead_id", leadId);
    if (status) query = query.eq("status", status);
    if (assignedToMe === "true") query = query.eq("assigned_agent_id", user.id);
    if (overdue === "true") {
      query = query.lt("due_date", new Date().toISOString());
      query = query.neq("status", "completed");
      query = query.neq("status", "cancelled");
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
  
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const { data, error } = await client
      .database
      .from("agenda_actions")
      .insert({
        lead_id,
        investor_id,
        property_id,
        title,
        description,
        action_type,
        action_category,
        due_date,
        scheduled_for,
        estimated_duration_minutes,
        priority,
        status,
        sla_hours,
        pipeline_stage,
        assigned_agent_id: assigned_agent_id || user.id,
        created_by: user.id,
        is_auto_generated,
        trigger_rule,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let calendarEvent = null;
    
    if (create_calendar_event && action_type === 'meeting' && data.due_date) {
      const tokens = await getGmailTokens(client, user.id);
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
              await client.database
                .from('agenda_actions')
                .update({ google_calendar_event_id: calendarEvent.id })
                .eq('id', data.id);
              
              calendarEvent.htmlLink = `https://calendar.google.com/calendar/event?id=${calendarEvent.id}`;
            }
          } catch (calError: any) {
            console.error('Calendar event creation failed:', calError.message);
          }
        }
      }
    }

    await client.database.from("agenda_activity_log").insert({
      action_id: data.id,
      lead_id,
      activity_type: "created",
      description: `Action created: ${title}`,
      agent_id: user.id,
    });

    if (lead_id) {
      await client
        .database
        .from("leads")
        .update({ 
          current_action_id: data.id, 
          next_action_due: due_date 
        })
        .eq("id", lead_id);
    }

    return NextResponse.json({ ...data, calendarEvent }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
  
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (updates.status === "completed") {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = user.id;
    }

    const { data, error } = await client
      .database
      .from("agenda_actions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await client.database.from("agenda_activity_log").insert({
      action_id: id,
      lead_id: data.lead_id,
      activity_type: updates.status === "completed" ? "completed" : "updated",
      description: `Action ${updates.status === "completed" ? "completed" : "updated"}: ${data.title}`,
      agent_id: user.id,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
  
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { error } = await client
      .database
      .from("agenda_actions")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}