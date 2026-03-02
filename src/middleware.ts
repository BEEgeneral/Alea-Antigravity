import { createSupabaseMiddlewareClient } from '@/lib/supabase-server';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createSupabaseMiddlewareClient(request, response);

    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession();

    const url = new URL(request.url);

    // 1. Protected Routes: /praetorium (ADMIN/AGENT ONLY)
    if (url.pathname.startsWith('/praetorium')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Check if user is an approved agent
        const { data: agent } = await supabase
            .from('agents')
            .select('is_approved')
            .eq('id', session.user.id)
            .single();

        if (!agent || !agent.is_approved) {
            // If they are authenticated but not an approved agent, they might be an investor.
            // Redirect them away from the admin area.
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // 2. Protected Routes: /radar, /profile, /cumplimiento (AUTHENTICATED ONLY)
    const authenticatedRoutes = ['/radar', '/profile', '/cumplimiento'];
    if (authenticatedRoutes.some(path => url.pathname.startsWith(path))) {
        if (!session) {
            return NextResponse.redirect(new URL('/login?from=' + url.pathname, request.url));
        }
    }

    // 3. Auth Redirect: If already logged in, redirect away from login page
    if (url.pathname === '/login' && session) {
        // Redirect to praetorium if agent, or radar if investor
        const { data: agent } = await supabase
            .from('agents')
            .select('id')
            .eq('id', session.user.id)
            .single();

        if (agent) {
            return NextResponse.redirect(new URL('/praetorium', request.url));
        }
        return NextResponse.redirect(new URL('/radar', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
