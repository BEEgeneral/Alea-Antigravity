import { NextRequest, NextResponse } from 'next/server';
import { insforge, getUserProfile } from '@/lib/insforge';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('insforge_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: currentUser, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !currentUser.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminProfile = await getUserProfile(currentUser.user.id);
    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: profiles, error } = await insforge
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const usersWithDetails = await Promise.all(
      (profiles || []).map(async (profile: any) => {
        const { data: authUser } = await insforge.auth.getProfile(profile.auth_user_id);
        return {
          ...profile,
          email: authUser?.email || 'Unknown',
          name: authUser?.profile?.name || ''
        };
      })
    );

    return NextResponse.json({ users: usersWithDetails });
  } catch (error: any) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}