import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';
import pool from '@/lib/vps-pg';

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

    const profileResult = await pool.query(
      'SELECT * FROM user_profiles WHERE id = $1',
      [currentUser.user.id]
    );
    const adminProfile = profileResult.rows[0];
      
    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const result = await pool.query(
      'SELECT * FROM user_profiles ORDER BY created_at DESC'
    );

    return NextResponse.json({ users: result.rows || [] });
  } catch (error: any) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
