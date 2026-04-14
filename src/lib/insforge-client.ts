import { createClient, type InsForgeClient } from '@insforge/sdk';

export const INSFORGE_APP_URL = 'https://if8rkq6j.eu-central.insforge.app';
export const INSFORGE_API_KEY = 'ik_dbb952a6fd01508d4ae7f53b36e23eaf';

export const INSFORGE_TOKEN_COOKIE = 'insforge_token';

function getTokenFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + INSFORGE_TOKEN_COOKIE + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

export function createInsforgeClient(): InsForgeClient {
  const token = getTokenFromCookie();
  const client = createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
  });
  
  if (token) {
    (client as any).auth?.setSession?.(token);
  }
  
  return client;
}

let _insforge: InsForgeClient | null = null;

export const insforge = new Proxy({} as InsForgeClient, {
  get(_target, prop) {
    if (!_insforge) {
      _insforge = createInsforgeClient();
    }
    return (_insforge as any)[prop];
  },
});

export function refreshInsforgeClient() {
  _insforge = createInsforgeClient();
}