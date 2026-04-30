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

    await getSql()`UPDATE users SET is_active = true, updated_at = NOW() WHERE id = ${userId}`

    return NextResponse.json({ success: true, message: 'Access activated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
