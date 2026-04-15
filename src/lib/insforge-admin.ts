import { cookies } from 'next/headers';
import { createClient, type InsForgeClient } from '@insforge/sdk';
import { INSFORGE_APP_URL, INSFORGE_API_KEY } from './insforge-constants';

export { INSFORGE_APP_URL, INSFORGE_API_KEY } from './insforge-constants';

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('insforge_token')?.value || null;
}

export function createInsforgeAdmin(): InsForgeClient {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
    isServerMode: true,
  });
}

export const insforgeAdmin = createInsforgeAdmin();

export async function fetchFromInsForge(table: string, options: {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string;
  params?: Record<string, string>;
  body?: any;
} = {}) {
  const { method = 'GET', token, params, body } = options;
  const authToken = token || INSFORGE_API_KEY;

  let url = `${INSFORGE_APP_URL}/api/database/records/${table}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  const fetchOptions: RequestInit = { method, headers };
  if (body) fetchOptions.body = JSON.stringify(body);

  const res = await fetch(url, fetchOptions);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function queryTable(table: string, token?: string) {
  const authToken = token || (await getAuthToken()) || INSFORGE_API_KEY;
  return fetchFromInsForge(table, { token: authToken });
}