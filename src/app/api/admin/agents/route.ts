import { createAuthenticatedClient } from "@/lib/insforge-server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const client = await createAuthenticatedClient();

        const { data: agents, error } = await client.database
            .from("agents")
            .select("*")
            .order("full_name");

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ agents });
    } catch (error: any) {
        console.error("Error fetching agents:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}