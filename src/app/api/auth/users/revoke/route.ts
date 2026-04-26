import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('insforge_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: currentUser, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !currentUser?.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: adminProfile } = await insforge
      .database
      .from('user_profiles')
      .select('*')
      .eq('id', currentUser.user.id)
      .single();
      
    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data: profile } = await insforge
      .database
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (profile.role === 'admin') {
      return NextResponse.json({ error: 'Cannot revoke admin access' }, { status: 403 });
    }

    const { error } = await insforge
      .database
      .from('user_profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Access revoked successfully' });
  } catch (error: any) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}