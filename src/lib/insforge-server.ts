/**
 * Shared utilities for InsForge client creation
 * Avoids duplication across API routes
 */

import { createClient, type InsForgeClient } from '@insforge/sdk';
import { cookies } from 'next/headers';
import { INSFORGE_APP_URL, INSFORGE_API_KEY } from './insforge-constants';
import { NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────
// Client factories
// ─────────────────────────────────────────────────────────

export function createServerClient(): InsForgeClient {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
    isServerMode: true
  });
}

export async function createAuthenticatedClient(request?: NextRequest): Promise<InsForgeClient> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get('insforge_token')?.value;
    if (!token && request.headers.get('authorization')) {
      token = request.headers.get('authorization')?.replace('Bearer ', '');
    }
  }

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('insforge_token')?.value;
  }

  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
    isServerMode: true,
    edgeFunctionToken: token,
  });
}

/**
 * Create client with a raw token string (for webhooks, cron jobs, etc.)
 */
export function createClientWithToken(token: string): InsForgeClient {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
    isServerMode: true,
    edgeFunctionToken: token,
  });
}

export { INSFORGE_APP_URL, INSFORGE_API_KEY };
export const insforge = createServerClient();
