import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/insforge-server';
import { cookies } from 'next/headers';

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'https://if8rkq6j.eu-central.insforge.app/api/gmail/callback';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  if (error) {
    return NextResponse.redirect(
      new URL(`/praetorium?gmail_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/praetorium?gmail_error=no_code', request.url)
    );
  }

  try {
    const stateData = state ? JSON.parse(Buffer.from(state, 'base64').toString()) : null;
    const userId = stateData?.userId;

    if (!userId) {
      return NextResponse.redirect(
        new URL('/praetorium?gmail_error=invalid_state', request.url)
      );
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        redirect_uri: GMAIL_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens: TokenResponse = await tokenResponse.json();

    if (tokens.error) {
      console.error('Gmail token error:', tokens.error);
      return NextResponse.redirect(
        new URL(`/praetorium?gmail_error=${encodeURIComponent(tokens.error)}`, request.url)
      );
    }

    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    const insforge = createServerClient();
    
    const { error: upsertError } = await insforge.database
      .from('gmail_tokens')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_type: tokens.token_type || 'Bearer',
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error saving Gmail tokens:', upsertError);
      return NextResponse.redirect(
        new URL('/praetorium?gmail_error=db_error', request.url)
      );
    }

    return NextResponse.redirect(
      new URL('/praetorium?gmail_connected=true', request.url)
    );

  } catch (err: any) {
    console.error('Gmail callback error:', err);
    return NextResponse.redirect(
      new URL(`/praetorium?gmail_error=${encodeURIComponent(err.message)}`, request.url)
    );
  }
}