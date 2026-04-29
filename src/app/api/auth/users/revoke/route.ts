import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless'

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Don't allow revoking admins
    const users = await getSql()`SELECT role FROM users WHERE id = ${userId}`
    if (!users[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (users[0].role === 'admin') {
      return NextResponse.json({ error: 'Cannot revoke admin access' }, { status: 403 });
    }

    await getSql()`UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ${userId}`

    return NextResponse.json({ success: true, message: 'Access revoked successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
