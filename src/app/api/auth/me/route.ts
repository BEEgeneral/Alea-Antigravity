import { NextRequest, NextResponse } from 'next/server';
import { insforge, getUserProfile, getRedirectPath } from '@/lib/insforge';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('insforge_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data, error } = await insforge.auth.getCurrentUser();

    if (error || !data.user) {
      const response = NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
      response.cookies.delete('insforge_token');
      return response;
    }

    const profile = await getUserProfile(data.user.id);

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
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}