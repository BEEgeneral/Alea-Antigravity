import pool from "@/lib/vps-pg";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado", status: 401 };
  const role = (session.user as any)?.role;
  const email = (session.user as any)?.email?.toLowerCase();
  const isGodMode = email === "beenocode@gmail.com" || email === "albertogala@beenocode.com";
  if (role !== "admin" && !isGodMode) return { error: "Solo administradores", status: 403 };
  return null;
}

export async function GET(request: NextRequest) {
    try {
        const authErr = await requireAdmin(request);
        if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });
        const result = await pool.query('SELECT * FROM investors ORDER BY full_name');
        return NextResponse.json({ investors: result.rows || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
