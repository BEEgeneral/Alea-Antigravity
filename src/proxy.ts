import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/insforge-server';
import { cookies } from 'next/headers';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/auth/verify',
  '/auth/confirm',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/invite',
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/confirm',
  '/api/auth/invite',
  '/onboarding',
  '/aviso-legal',
  '/terminos',
  '/privacidad',
  '/cookies',
  '/cumplimiento',
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('insforge_token')?.value;

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const client = createServerClient();
    const { data, error } = await client.auth.getCurrentUser();

    if (error || !data.user) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { data: profile } = await client
      .database
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    if (!profile) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!profile.is_active) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Account access has been revoked' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/login?error=access-revoked', request.url));
    }

    if (pathname.startsWith('/praetorium') || pathname.startsWith('/api/admin')) {
      if (profile.role !== 'admin' && profile.role !== 'agent') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/radar', request.url));
      }
    }

    if (pathname.startsWith('/radar')) {
      if (profile.role === 'investor' && !profile.is_approved) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Account pending approval' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }

    return NextResponse.next();

  } catch (error) {
    console.error('Proxy error:', error);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};