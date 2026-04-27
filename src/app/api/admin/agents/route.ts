import pool from "@/lib/vps-pg";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const result = await pool.query('SELECT * FROM agents ORDER BY full_name');
        return NextResponse.json({ agents: result.rows || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { full_name, email, role } = body;

        if (!full_name || !email) {
            return NextResponse.json({ error: 'full_name y email son obligatorios' }, { status: 400 });
        }

        // Check if agent already exists
        const existing = await pool.query('SELECT id FROM agents WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return NextResponse.json({ error: 'Ya existe un agente con este email' }, { status: 409 });
        }

        const result = await pool.query(
            `INSERT INTO agents (full_name, email, role, is_approved, has_centurion_access, created_at) 
             VALUES ($1, $2, $3, false, false, NOW()) 
             RETURNING *`,
            [full_name, email, role || 'agent']
        );

        return NextResponse.json({ agent: result.rows[0] }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
