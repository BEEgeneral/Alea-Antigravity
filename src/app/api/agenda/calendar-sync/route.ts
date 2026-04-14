import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedClient } from "@/lib/insforge-server";

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

export async function GET(request: NextRequest) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
  
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '14');
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { data: tokens } = await client.database
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!tokens?.refresh_token) {
      return NextResponse.json({ error: 'Gmail not connected', connected: false }, { status: 200 });
    }

    let accessToken = tokens.access_token;
    if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
      accessToken = await getFreshAccessToken(tokens.refresh_token) || accessToken;
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=100&singleEvents=true&orderBy=startTime`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    const calendarData = await response.json();
    if (calendarData.error) {
      return NextResponse.json({ error: calendarData.error.message }, { status: 400 });
    }

    const events = (calendarData.items || []).map((event: any) => ({
      id: event.id,
      summary: event.summary || 'Sin título',
      description: event.description || '',
      location: event.location || '',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      attendees: event.attendees?.map((a: any) => a.email).filter(Boolean) || [],
      meetLink: event.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri,
      htmlLink: event.htmlLink,
    }));

    return NextResponse.json({ events, connected: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
  
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { events } = await request.json();

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'events array required' }, { status: 400 });
    }

    const created: any[] = [];
    const errors: any[] = [];

    for (const event of events) {
      try {
        const startTime = new Date(event.start);
        const endTime = new Date(event.end || new Date(startTime.getTime() + 60 * 60 * 1000));
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        const { data, error } = await client.database
          .from('agenda_actions')
          .insert({
            title: event.summary || 'Evento de Google Calendar',
            description: `${event.description || ''}${event.location ? '\n📍 ' + event.location : ''}`,
            action_type: 'meeting',
            action_category: 'external',
            due_date: startTime.toISOString(),
            scheduled_for: startTime.toISOString(),
            estimated_duration_minutes: durationMinutes || 30,
            priority: 'medium',
            status: 'scheduled',
            assigned_agent_id: user.id,
            created_by: user.id,
            is_auto_generated: true,
            trigger_rule: 'google_calendar_sync',
            google_calendar_event_id: event.id,
          })
          .select()
          .single();

        if (error) {
          errors.push({ eventId: event.id, error: error.message });
        } else {
          created.push({ ...data, meetLink: event.meetLink });
        }
      } catch (err: any) {
        errors.push({ eventId: event.id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      imported: created,
      failed: errors.length,
      errors
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}