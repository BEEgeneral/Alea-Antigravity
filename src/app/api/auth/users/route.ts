import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function GET(request: NextRequest) {
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

    const { data: profiles, error } = await insforge
      .database
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users: profiles || [] });
  } catch (error: any) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}