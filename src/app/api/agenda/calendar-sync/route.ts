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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '14');
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const userId = searchParams.get('user_id') || 'system';

    const tokensResult = await pool.query(
      'SELECT * FROM gmail_tokens WHERE user_id = $1',
      [userId]
    );
    const tokens = tokensResult.rows[0];

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
    const { events } = await request.json();
    const userId = request.headers.get('x-user-id') || 'system';

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

        const result = await pool.query(
          `INSERT INTO agenda_actions (title, description, action_type, action_category, due_date, scheduled_for, estimated_duration_minutes, priority, status, assigned_agent_id, created_by, is_auto_generated, trigger_rule, google_calendar_event_id)
           VALUES ($1, $2, 'meeting', 'external', $3, $4, $5, 'medium', 'scheduled', $6, $7, true, 'google_calendar_sync', $8)
           RETURNING *`,
          [
            event.summary || 'Evento de Google Calendar',
            `${event.description || ''}${event.location ? '\n📍 ' + event.location : ''}`,
            startTime.toISOString(),
            startTime.toISOString(),
            durationMinutes || 30,
            userId,
            userId,
            event.id
          ]
        );

        if (result.rows.length > 0) {
          created.push({ ...result.rows[0], meetLink: event.meetLink });
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
