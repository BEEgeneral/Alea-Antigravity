import { createClient, type InsForgeClient } from '@insforge/sdk';
import { INSFORGE_APP_URL, INSFORGE_API_KEY } from './insforge-constants';

export { INSFORGE_APP_URL, INSFORGE_API_KEY } from './insforge-constants';

export function createServerClient(): InsForgeClient {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY
  });
}

export function createAuthenticatedClient(_token?: string): InsForgeClient {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
  });
}

export const insforge = createServerClient();

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
  metadata: Record<string, any>;
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