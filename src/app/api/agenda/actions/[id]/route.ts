import pool from "@/lib/vps-pg";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, ...updates } = body;

    const updateParts: string[] = [];
    const paramsList: any[] = [];
    let paramIndex = 1;

    if (status) {
      if (status === "completed") {
        updateParts.push(`completed_at = $${paramIndex++}`);
        paramsList.push(new Date().toISOString());
        updateParts.push(`completed_by = $${paramIndex++}`);
        paramsList.push(updates.user_id || "system");
      }
      updateParts.push(`status = $${paramIndex++}`);
      paramsList.push(status);
    }

    for (const key of Object.keys(updates)) {
      if (key !== "user_id") {
        updateParts.push(`${key} = $${paramIndex++}`);
        paramsList.push(updates[key]);
      }
    }

    if (updateParts.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    paramsList.push(id);
    const result = await pool.query(
      `UPDATE agenda_actions SET ${updateParts.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      paramsList
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    const data = result.rows[0];

    if (status === "completed" || updates.status === "completed") {
      await pool.query(
        `INSERT INTO agenda_activity_log (action_id, lead_id, activity_type, description, agent_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, data.lead_id, "completed", `Action completed: ${data.title}`, updates.user_id || "system"]
      ).catch(() => {});
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query(
      "DELETE FROM agenda_actions WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
