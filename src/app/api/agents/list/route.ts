import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM agents ORDER BY created_at DESC"
    );
    return NextResponse.json({ agents: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
