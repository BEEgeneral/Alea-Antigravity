import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { insforge, getUserProfile } from '@/lib/insforge';

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('insforge_token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { data, error } = await insforge.auth.getCurrentUser();

    if (error || !data.user) {
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));
      return response;
    }

    const profile = await getUserProfile(data.user.id);

    if (!profile) {
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'User profile not found' }, { status: 403 })
        : NextResponse.redirect(new URL('/login', request.url));
      return response;
    }

    if (!profile.is_active) {
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Account access has been revoked' }, { status: 403 })
        : NextResponse.redirect(new URL('/login?error=access-revoked', request.url));
      return response;
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
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};