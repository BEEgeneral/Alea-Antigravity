import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing suggestion ID" }, { status: 400 });
    }

    const updates: string[] = [];
    const paramsList: any[] = [];
    let i = 1;

    if (status) {
      updates.push(`status = $${i++}`);
      paramsList.push(status);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${i++}`);
      paramsList.push(notes);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    paramsList.push(id);

    const result = await pool.query(
      `UPDATE iai_inbox_suggestions SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,
      paramsList
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    return NextResponse.json({ suggestion: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
