import pool from "@/lib/vps-pg";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'system';

  try {
    const result = await pool.query(
      'SELECT id, expires_at, updated_at FROM gmail_tokens WHERE user_id = $1',
      [userId]
    );
    const tokens = result.rows[0];

    return NextResponse.json({ 
      connected: !!tokens,
      expiresAt: tokens?.expires_at || null
    });

  } catch (error: any) {
    return NextResponse.json({ connected: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'system';

  try {
    await pool.query('DELETE FROM gmail_tokens WHERE user_id = $1', [userId]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
