import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL not set" },
      { status: 500 }
    );
  }

  try {
    const sql = neon(DATABASE_URL);

    // 1. Add password_hash column if not exists
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash TEXT
    `;

    // 2. Add name column if not exists
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS name TEXT
    `;

    // 3. Create password_reset_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      message: "Migrations applied: password_hash, name columns added to users; password_reset_tokens table created"
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
