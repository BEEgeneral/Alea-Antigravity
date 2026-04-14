import { cookies } from 'next/headers';
import { createClient, type InsForgeClient } from '@insforge/sdk';

const BASE_URL = 'https://if8rkq6j.eu-central.insforge.app';
const API_KEY = 'ik_dbb952a6fd01508d4ae7f53b36e23eaf';

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('insforge_token')?.value || null;
}

export function createInsforgeAdmin(): InsForgeClient {
  return createClient({
    baseUrl: BASE_URL,
    anonKey: API_KEY,
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
  const authToken = token || API_KEY;

  let url = `${BASE_URL}/api/db/${table}`;
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
  const authToken = token || (await getAuthToken()) || API_KEY;
  return fetchFromInsForge(table, { token: authToken });
}