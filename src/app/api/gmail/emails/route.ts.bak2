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
    console.error('Error refreshing token:', error);
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
      await client.database
        .from('gmail_tokens')
        .update({ access_token: accessToken, expires_at: new Date(Date.now() + 3600 * 1000).toISOString() })
        .eq('user_id', user.id);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'in:inbox';
    const maxResults = parseInt(searchParams.get('maxResults') || '20');

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
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

    const messages = data.messages || [];
    const emails = await Promise.all(
      messages.slice(0, maxResults).map(async (msg: any) => {
        const emailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=from&metadataHeaders=subject&metadataHeaders=date&metadataHeaders=to`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );
        const emailData = await emailRes.json();
        const headers = emailData.payload?.headers || [];
        return {
          id: msg.id,
          threadId: emailData.threadId,
          from: headers.find((h: any) => h.name === 'From')?.value,
          to: headers.find((h: any) => h.name === 'To')?.value,
          subject: headers.find((h: any) => h.name === 'Subject')?.value,
          date: headers.find((h: any) => h.name === 'Date')?.value,
          snippet: emailData.snippet,
          labelIds: emailData.labelIds,
        };
      })
    );

    return NextResponse.json({ 
      emails,
      connected: true,
      total: emails.length
    });

  } catch (error: any) {
    console.error('Gmail emails error:', error);
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

    const { to, subject, body, cc } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'to, subject and body are required' }, { status: 400 });
    }

    const message = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : '',
      'Content-Type: text/html;charset=utf-8',
      'From: me',
      `Subject: ${subject}`,
      '',
      body
    ].filter(line => line !== '').join('\r\n');

    const encodedMessage = Buffer.from(message).toString('base64url');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data.id 
    });

  } catch (error: any) {
    console.error('Gmail send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}