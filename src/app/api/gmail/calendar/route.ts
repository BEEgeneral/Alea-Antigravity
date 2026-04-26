import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';

async function getFreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    
    return null;
  }
}

export async function GET(request: NextRequest) {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: tokens } = await client
      .database
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!tokens || !tokens.refresh_token) {
      return NextResponse.json({ error: 'Gmail not connected', connected: false }, { status: 200 });
    }

    let accessToken = tokens.access_token;
    
    if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
      accessToken = await getFreshAccessToken(tokens.refresh_token);
      if (!accessToken) {
        return NextResponse.json({ error: 'Failed to refresh token', connected: false }, { status: 200 });
      }
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const maxResults = parseInt(searchParams.get('maxResults') || '50');

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const events = (data.items || []).map((event: any) => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      attendees: event.attendees?.map((a: any) => ({ email: a.email, displayName: a.displayName || a.email, responseStatus: a.responseStatus })) || [],
      organizer: event.organizer?.email,
      status: event.status,
      htmlLink: event.htmlLink,
      conferenceData: event.conferenceData,
    }));

    return NextResponse.json({ 
      events,
      connected: true,
      total: events.length
    });

  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: tokens } = await client
      .database
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!tokens || !tokens.refresh_token) {
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 });
    }

    let accessToken = tokens.access_token;
    
    if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
      accessToken = await getFreshAccessToken(tokens.refresh_token);
      if (!accessToken) {
        return NextResponse.json({ error: 'Failed to refresh token' }, { status: 400 });
      }
    }

    const { summary, description, location, start_time, end_time, attendees } = await request.json();

    if (!summary || !start_time || !end_time) {
      return NextResponse.json({ error: 'summary, start_time and end_time are required' }, { status: 400 });
    }

    const event = {
      summary,
      description,
      location,
      start: { dateTime: start_time },
      end: { dateTime: end_time },
      attendees: attendees?.map((email: string) => ({ email })) || [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      },
      conferenceDataVersion: 1,
      requestBody: {
        conferenceData: {
          createRequest: {
            requestId: `alea-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      event: {
        id: data.id,
        summary: data.summary,
        start: data.start?.dateTime || data.start?.date,
        end: data.end?.dateTime || data.end?.date,
        meetLink: data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri,
        htmlLink: data.htmlLink
      }
    });

  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}