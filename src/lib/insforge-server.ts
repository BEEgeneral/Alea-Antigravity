import { createClient, type InsForgeClient } from '@insforge/sdk';
import { cookies } from 'next/headers';
import { INSFORGE_APP_URL, INSFORGE_API_KEY } from './insforge-constants';

export { INSFORGE_APP_URL, INSFORGE_API_KEY } from './insforge-constants';

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
    isServerMode: true,
  });
  
  if (token) {
    (client.auth as any).setAuthToken(token);
  }
  
  return client;
}

export const insforge = createServerClient();