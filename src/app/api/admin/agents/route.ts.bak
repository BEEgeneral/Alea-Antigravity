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
            console.error("Error fetching agents:", error);
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json({ agents: agents || [] });
    } catch (error: any) {
        console.error("Error fetching agents:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}