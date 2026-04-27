import { createAuthenticatedClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const client = await createAuthenticatedClient(request);

        const { data: agents, error } = await client.database
            .from("agents")
            .select("*")
            .order("full_name");

        if (error) {
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json({ agents: agents || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const client = await createAuthenticatedClient(request);
        const body = await request.json();
        const { full_name, email, role } = body;

        if (!full_name || !email) {
            return NextResponse.json({ error: 'full_name y email son obligatorios' }, { status: 400 });
        }

        // Check if agent already exists
        const { data: existing } = await client.database
            .from("agents")
            .select("id")
            .eq("email", email)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Ya existe un agente con este email' }, { status: 409 });
        }

        const { data: agent, error } = await client.database
            .from("agents")
            .insert({
                full_name,
                email,
                role: role || 'agent',
                is_approved: false,
                has_centurion_access: false,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ agent }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
