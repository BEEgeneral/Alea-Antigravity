import { createClient as createInsforgeClient, type InsForgeClient } from '@insforge/sdk';
import { INSFORGE_APP_URL, INSFORGE_API_KEY } from './insforge-constants';

export { INSFORGE_APP_URL, INSFORGE_API_KEY } from './insforge-constants';

let _token: string | null = null;
let _client: InsForgeClient | null = null;

export function setInsforgeToken(token: string) {
  _token = token;
  if (_client) {
    try {
      (_client.auth as any).setAuthToken(token);
    } catch (e) {
      console.warn('Failed to set auth token:', e);
    }
  }
}

export function getInsforgeToken(): string | null {
  return _token;
}

export function clearInsforgeToken() {
  _token = null;
}

function initClient(): InsForgeClient {
  const client = createInsforgeClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
    isServerMode: true,
  });
  if (_token) {
    try {
      (client.auth as any).setAuthToken(_token);
    } catch (e) {}
  }
  return client;
}

function getClient(): InsForgeClient {
  if (!_client) {
    _client = initClient();
  }
  return _client;
}

export const insforge: InsForgeClient = new Proxy({} as InsForgeClient, {
  get(_target, prop) {
    const client = getClient();
    return (client as any)[prop];
  },
});