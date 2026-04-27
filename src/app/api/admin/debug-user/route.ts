import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const result = await pool.query(
            'SELECT * FROM user_profiles WHERE email = $1',
            ["beenocode@gmail.com"]
        );
        const profile = result.rows[0] || null;
        return NextResponse.json({ profile });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, profile: null }, { status: 500 });
    }
}

export async function PATCH() {
    try {
        const result = await pool.query(
            'SELECT * FROM user_profiles WHERE email = $1',
            ["beenocode@gmail.com"]
        );
        const profile = result.rows[0];

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        if (profile.role !== "admin") {
            const updateResult = await pool.query(
                `UPDATE user_profiles SET role = 'admin' WHERE email = $1 RETURNING *`,
                ["beenocode@gmail.com"]
            );
            return NextResponse.json({ message: "Role updated to admin", profile: updateResult.rows[0] });
        }

        return NextResponse.json({ message: "Already admin", profile });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
