import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = env.SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }
    
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}

export const supabaseAdmin = {
  from: (table: string) => getSupabaseAdmin().from(table)
};
