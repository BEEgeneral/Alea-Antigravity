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
      .from('profiles')
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

    const { error } = await insforge
      .database
      .from('profiles')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to activate access' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Access activated successfully' });
  } catch (error: any) {
    console.error('Activate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}