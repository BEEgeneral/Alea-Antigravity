import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

function getDatabaseUrl(): string {
  const host = process.env.NEON_HOST;
  const port = process.env.NEON_PORT;
  const user = process.env.NEON_USER;
  const password = process.env.NEON_PASSWORD;
  const database = process.env.NEON_DATABASE;
  if (!host || !user || !password || !database) {
    throw new Error("Missing NEON_* environment variables");
  }
  return `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require`;
}

export async function GET() {
  try {
    const DATABASE_URL = getDatabaseUrl();
    const sql = neon(DATABASE_URL);

    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash TEXT
    `;

    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS name TEXT
    `;

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
      message: "Migrations applied"
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
