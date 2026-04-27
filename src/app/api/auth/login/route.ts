import { NextRequest, NextResponse } from 'next/server';
import { insforge, getRedirectPath } from '@/lib/insforge';
import pool from '@/lib/vps-pg';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { data, error } = await insforge.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.error },
        { status: 401 }
      );
    }

    if (!data?.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const profileResult = await pool.query(
      'SELECT * FROM user_profiles WHERE auth_user_id = $1',
      [data.user.id]
    );
    const profile = profileResult.rows[0];

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found. Please contact administrator.' },
        { status: 403 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'Account access has been revoked. Please contact administrator.' },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      user: data.user,
      profile,
      redirectPath: getRedirectPath(profile.role),
      accessToken: data.accessToken || ''
    });

    response.cookies.set('insforge_token', data.accessToken || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
