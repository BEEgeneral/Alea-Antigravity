// ─────────────────────────────────────────────────────────
// Supabase Client — Browser (Client Components)
// Uses @supabase/ssr for proper cookie-based session handling.
// ─────────────────────────────────────────────────────────
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// Re-export a singleton for backward-compat with existing components
// that import `supabase` directly. Lazy-initialized.
let _supabase: ReturnType<typeof createBrowserClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
    get(_target, prop) {
        if (!_supabase) {
            _supabase = createClient();
        }
        return (_supabase as any)[prop];
    },
});
