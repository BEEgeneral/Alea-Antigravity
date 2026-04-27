import pool from "@/lib/vps-pg";
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get('x-user-id') || 'system';

    const result = await pool.query(
      `UPDATE iai_inbox_suggestions 
       SET status = 'rejected', rejected_by = $1, rejected_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [userId, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Sugerencia no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      suggestion: result.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
