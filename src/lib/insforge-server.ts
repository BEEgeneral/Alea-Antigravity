/**
 * InsForge client factory — SINGLETON SOURCE OF TRUTH
 * ====================================================
 *
 * All InsForge client creation flows through this file.
 *
 * Replaces and consolidates:
 *   - insforge.ts        (re-exported for backward compat)
 *   - insforge-admin.ts  (merged in)
 *   - insforge-client.ts (unused — deleted)
 *
 * Usage:
 *   import { createServerClient, createAuthenticatedClient } from '@/lib/insforge-server';
 *   const client = await createAuthenticatedClient(request);
 */

import { createClient, type InsForgeClient } from '@insforge/sdk';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { INSFORGE_APP_URL, INSFORGE_API_KEY } from './insforge-constants';

// ─────────────────────────────────────────────────────────
// Client factories
// ─────────────────────────────────────────────────────────

export function createServerClient(): InsForgeClient {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
    isServerMode: true,
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

export function createClientWithToken(token: string): InsForgeClient {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
    isServerMode: true,
    edgeFunctionToken: token,
  });
}

// ─────────────────────────────────────────────────────────
// Shared singleton (server-side admin operations)
// ─────────────────────────────────────────────────────────

export const insforge = createServerClient();

// ─────────────────────────────────────────────────────────
// Re-exports from constants
// ─────────────────────────────────────────────────────────

export { INSFORGE_APP_URL, INSFORGE_API_KEY };

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'agent' | 'investor';

export interface InsForgeUser {
  id: string;
  email: string;
  emailVerified: boolean;
  providers: string[];
  createdAt: string;
  updatedAt: string;
  profile: {
    name?: string;
    avatar_url?: string;
  };
  metadata: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  auth_user_id: string;
  role: UserRole;
  is_active: boolean;
  is_approved: boolean;
  invitation_token?: string;
  invitation_sent_at?: string;
  invitation_accepted_at?: string;
  linked_entity_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: InsForgeUser | null;
  accessToken: string | null;
  requireEmailVerification?: boolean;
  csrfToken?: string | null;
}

// ─────────────────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────────────────

export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'admin':
    case 'agent':
      return '/praetorium';
    case 'investor':
      return '/radar';
    default:
      return '/login';
  }
}

export async function getUserProfile(client: InsForgeClient, authUserId: string): Promise<UserProfile | null> {
  const { data, error } = await client
    .database
    .from('user_profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();
  if (error) return null;
  return data as UserProfile;
}

export async function isUserActive(client: InsForgeClient, authUserId: string): Promise<boolean> {
  const profile = await getUserProfile(client, authUserId);
  return profile?.is_active ?? false;
}

export async function isAdmin(client: InsForgeClient, authUserId: string): Promise<boolean> {
  const profile = await getUserProfile(client, authUserId);
  return profile?.role === 'admin';
}

export async function isAgent(client: InsForgeClient, authUserId: string): Promise<boolean> {
  const profile = await getUserProfile(client, authUserId);
  return profile?.role === 'agent';
}

export async function isInvestor(client: InsForgeClient, authUserId: string): Promise<boolean> {
  const profile = await getUserProfile(client, authUserId);
  return profile?.role === 'investor';
}

// ─────────────────────────────────────────────────────────
// REST helpers (migrated from insforge-admin.ts)
// ─────────────────────────────────────────────────────────

export async function fetchFromInsForge(table: string, options: {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string;
  params?: Record<string, string>;
  body?: unknown;
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
    'Content-Type': 'application/json',
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

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('insforge_token')?.value || null;
}

export const insforgeAdmin = createServerClient();
