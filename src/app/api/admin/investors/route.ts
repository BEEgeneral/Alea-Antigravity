import pool from "@/lib/vps-pg";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const result = await pool.query('SELECT * FROM investors ORDER BY full_name');
        return NextResponse.json({ investors: result.rows || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
