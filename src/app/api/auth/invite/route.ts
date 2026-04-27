import { NextRequest, NextResponse } from 'next/server';
import pool from "@/lib/vps-pg";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { token, password, name } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    // 1. Buscar invitación
    const invResult = await pool.query(
      "SELECT * FROM pending_invitations WHERE token = $1",
      [token]
    );

    if (invResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 });
    }

    const invitation = invResult.rows[0];

    if (invitation.accepted) {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    // 2. Crear usuario en tabla users
    const userId = crypto.randomUUID();
    const hashedPassword = hashPassword(password);

    const insertResult = await pool.query(
      `INSERT INTO users (id, name, email, role, is_active, is_approved, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, true, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
       RETURNING *`,
      [userId, name || invitation.email.split("@")[0], invitation.email, invitation.role || "user"]
    );

    // 3. Marcar invitación como aceptada
    await pool.query(
      "UPDATE pending_invitations SET accepted = true WHERE id = $1",
      [invitation.id]
    );

    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now login.",
      user: { id: insertResult.rows[0].id, email: insertResult.rows[0].email, role: insertResult.rows[0].role }
    });
  } catch (error: any) {
    // Log via telemetry if available, otherwise omit console logging in API routes
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const result = await pool.query(
      "SELECT * FROM pending_invitations WHERE token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 });
    }

    const invitation = result.rows[0];

    if (invitation.accepted) {
      return NextResponse.json({ error: "Invitation already accepted", accepted: true }, { status: 400 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      role: invitation.role
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
