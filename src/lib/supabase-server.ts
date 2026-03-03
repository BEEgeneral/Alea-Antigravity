// ─────────────────────────────────────────────────────────
// Supabase Client — Server (Middleware & Server Components)
// Uses @supabase/ssr with cookie handling for Next.js edge/server.
// ─────────────────────────────────────────────────────────
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export function createSupabaseMiddlewareClient(
    request: NextRequest,
    response: NextResponse
) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // request.cookies.set(name, value); // this line causes 404 in Next.js 14+ sometimes
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );
}
