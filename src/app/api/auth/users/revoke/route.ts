import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { auth } from '@/lib/auth';

function getSql() {
    return neon(process.env.DATABASE_URL!)
}

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado", status: 401 };
  const role = (session.user as any)?.role;
  const email = (session.user as any)?.email?.toLowerCase();
  const isGodMode = email === "beenocode@gmail.com" || email === "albertogala@beenocode.com";
  if (role !== "admin" && !isGodMode) return { error: "Solo administradores", status: 403 };
  return null;
}

export async function POST(request: NextRequest) {
    try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

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
