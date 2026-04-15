import { createAuthenticatedClient } from "@/lib/insforge-server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const client = await createAuthenticatedClient();

        const { data: investors, error } = await client.database
            .from("investors")
            .select("*")
            .order("full_name");

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ investors });
    } catch (error: any) {
        console.error("Error fetching investors:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}