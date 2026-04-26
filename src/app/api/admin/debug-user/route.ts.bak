import { createAuthenticatedClient } from "@/lib/insforge-server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const client = await createAuthenticatedClient();

        const { data: profile, error } = await client.database
            .from("user_profiles")
            .select("*")
            .eq("email", "beenocode@gmail.com")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message, profile: null }, { status: 500 });
        }

        return NextResponse.json({ profile });
    } catch (error: any) {
        console.error("Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH() {
    try {
        const client = await createAuthenticatedClient();

        const { data: profile, error } = await client.database
            .from("user_profiles")
            .select("*")
            .eq("email", "beenocode@gmail.com")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (profile && profile.role !== "admin") {
            const { data: updated, error: updateError } = await client.database
                .from("user_profiles")
                .update({ role: "admin" })
                .eq("email", "beenocode@gmail.com")
                .select()
                .single();

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }

            return NextResponse.json({ message: "Role updated to admin", profile: updated });
        }

        return NextResponse.json({ message: "Already admin", profile });
    } catch (error: any) {
        console.error("Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}