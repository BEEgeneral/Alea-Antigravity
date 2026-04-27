import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { id, status, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (status) { updates.push(`status = $${i++}`); params.push(status); }
    if (notes !== undefined) { updates.push(`notes = $${i++}`); params.push(notes); }
    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await pool.query(
      `UPDATE iai_inbox_suggestions SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ suggestion: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
