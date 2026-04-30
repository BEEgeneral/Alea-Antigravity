/**
 * InsForge client factory — CLIENT-SAFE
 * ======================================
 * Use this for client components (pages, browser code).
 * For API routes with auth, use @/lib/insforge-server instead.
 */

import { createClient, type InsForgeClient } from '@insforge/sdk';
import { INSFORGE_APP_URL, INSFORGE_API_KEY } from './insforge-constants';

export { INSFORGE_APP_URL, INSFORGE_API_KEY };

export function createServerClient(): InsForgeClient {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
    isServerMode: true,
  });
}

export function createClientWithToken(token: string): InsForgeClient {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
    isServerMode: true,
    edgeFunctionToken: token,
  });
}

// Singleton for client-side usage (read-only operations)
export const insforge = createServerClient();
