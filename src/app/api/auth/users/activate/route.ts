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

    await getSql()`UPDATE users SET is_active = true, updated_at = NOW() WHERE id = ${userId}`

    return NextResponse.json({ success: true, message: 'Access activated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
