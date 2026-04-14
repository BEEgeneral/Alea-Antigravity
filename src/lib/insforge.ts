import { createClient } from '@insforge/sdk';

export const INSFORGE_APP_URL = 'https://if8rkq6j.eu-central.insforge.app';
export const INSFORGE_API_KEY = 'ik_dbb952a6fd01508d4ae7f53b36e23eaf';

export function createServerClient() {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY
  });
}

export function createAuthenticatedClient(token?: string) {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
    token
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

export async function getUserProfile(client: ReturnType<typeof createClient>, authUserId: string): Promise<UserProfile | null> {
  const { data, error } = await client
    .database
    .from('user_profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();
  if (error) return null;
  return data as UserProfile;
}

export async function isUserActive(client: ReturnType<typeof createClient>, authUserId: string): Promise<boolean> {
  const profile = await getUserProfile(client, authUserId);
  return profile?.is_active ?? false;
}

export async function isAdmin(client: ReturnType<typeof createClient>, authUserId: string): Promise<boolean> {
  const profile = await getUserProfile(client, authUserId);
  return profile?.role === 'admin';
}

export async function isAgent(client: ReturnType<typeof createClient>, authUserId: string): Promise<boolean> {
  const profile = await getUserProfile(client, authUserId);
  return profile?.role === 'agent';
}

export async function isInvestor(client: ReturnType<typeof createClient>, authUserId: string): Promise<boolean> {
  const profile = await getUserProfile(client, authUserId);
  return profile?.role === 'investor';
}