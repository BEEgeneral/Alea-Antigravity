import { createClient, type InsForgeClient } from '@insforge/sdk';
import { cookies } from 'next/headers';

export const INSFORGE_APP_URL = 'https://if8rkq6j.eu-central.insforge.app';
export const INSFORGE_API_KEY = 'ik_dbb952a6fd01508d4ae7f53b36e23eaf';

export function createServerClient(): InsForgeClient {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY
  });
}

export async function createAuthenticatedClient(): Promise<InsForgeClient> {
  const cookieStore = await cookies();
  const token = cookieStore.get('insforge_token')?.value;
  
  const client = createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
  });
  
  if (token) {
    try {
      (client as any)._token = token;
    } catch (e) {
      // Token handling may vary by SDK version
    }
  }
  
  return client;
}

export const insforge = createServerClient();