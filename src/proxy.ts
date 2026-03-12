import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase-server'

const PROTECTED_ROUTES = ['/praetorium', '/radar', '/profile', '/admin'];

export default async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const isProtected = PROTECTED_ROUTES.some(route =>
        request.nextUrl.pathname.startsWith(route)
    );

    const supabase = createSupabaseMiddlewareClient(request, supabaseResponse);

    // IMPORTANT: refreshes the auth token if needed
    const { data: { user }, error } = await supabase.auth.getUser();

    if (isProtected) {
        if (error || !user) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }

        const userRole = user.user_metadata?.role;
        const userEmail = user.email;
        const normalizedEmail = userEmail?.toLowerCase();
        const isGodMode = normalizedEmail === 'beenocode@gmail.com' || normalizedEmail === 'albertogala@beenocode.com';

        // /praetorium or /admin → only admin or approved agent (or God Mode)
        if (request.nextUrl.pathname.startsWith('/praetorium') || request.nextUrl.pathname.startsWith('/admin')) {
            if (!isGodMode && userRole !== 'admin' && userRole !== 'agent') {
                // Rígido: inversores y otros a /radar
                return NextResponse.redirect(new URL('/radar', request.url));
            }
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (svg, png, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
