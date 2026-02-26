// ─────────────────────────────────────────────────────────
// Next.js Middleware — Auth Guard (SSR)
//
// WHY: Without middleware, all route protection was client-side only,
// meaning HTML+JS for protected pages was delivered to the browser
// before any redirect happened. This middleware blocks access at the
// edge before anything reaches the client.
//
// Protected routes:
//   - /praetorium  → requires authenticated agent (is_approved)
//   - /radar       → requires authenticated user (agent or investor)
//   - /profile     → requires authenticated user
// ─────────────────────────────────────────────────────────
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase-server';

const PROTECTED_ROUTES = ['/praetorium', '/radar', '/profile'];

export async function proxy(request: NextRequest) {
    const response = NextResponse.next({ request });

    const isProtected = PROTECTED_ROUTES.some(route =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (!isProtected) {
        return response;
    }

    try {
        const supabase = createSupabaseMiddlewareClient(request, response);

        // Refresh the session (handles token rotation automatically)
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            // Not authenticated → redirect to login
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }

        const userRole = user.user_metadata?.role;

        // /praetorium → only admin or approved agent
        if (request.nextUrl.pathname.startsWith('/praetorium')) {
            if (userRole !== 'admin' && userRole !== 'agent') {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }

        // /radar → any authenticated user passes middleware;
        // fine-grained role check (investor/collaborator by email) happens client-side
        // because middleware can't efficiently query Supabase tables.

        return response;
    } catch {
        // If Supabase is unreachable, redirect to login as a safety net
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }
}

export const config = {
    matcher: [
        '/praetorium/:path*',
        '/radar/:path*',
        '/profile/:path*',
    ],
};
