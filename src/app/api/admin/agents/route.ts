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