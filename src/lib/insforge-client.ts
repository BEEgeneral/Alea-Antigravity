import { createClient } from '@insforge/sdk';

export const INSFORGE_APP_URL = 'https://if8rkq6j.eu-central.insforge.app';
export const INSFORGE_API_KEY = 'ik_dbb952a6fd01508d4ae7f53b36e23eaf';

export const INSFORGE_TOKEN_COOKIE = 'insforge_token';

function getTokenFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + INSFORGE_TOKEN_COOKIE + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

export function createInsforgeClient(): ReturnType<typeof createClient> {
  const token = getTokenFromCookie();
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
    token
  });
}

let _insforge: ReturnType<typeof createClient> | null = null;

export const insforge = new Proxy({} as ReturnType<typeof createClient>, {
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
