import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, getRedirectPath } from '@/lib/insforge';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get('insforge_token')?.value;
    const authHeader = request.headers.get('authorization');

    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = createAuthenticatedClient(token);

    const { data, error } = await client.auth.getCurrentUser();

    if (error || !data?.user) {
      const response = NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
      response.cookies.delete('insforge_token');
      return response;
    }

    const { data: profile } = await client
      .database
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'Account access has been revoked' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: data.user,
      profile,
      redirectPath: getRedirectPath(profile.role)
    });
  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}