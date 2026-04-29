import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless'

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

export async function GET(request: NextRequest) {
  try {
    const result = await getSql()`SELECT id, email, name, role, is_active, is_approved, created_at FROM users ORDER BY created_at DESC`
    return NextResponse.json({ users: result || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
