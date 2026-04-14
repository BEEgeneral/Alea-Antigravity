import { createAuthenticatedClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agent_id") || user.id;
  const actionId = searchParams.get("action_id");
  const status = searchParams.get("status") || "pending";
  const limit = parseInt(searchParams.get("limit") || "50");

  let query = client
    .database
    .from("agenda_reminders")
    .select("*")
    .eq("assigned_agent_id", agentId)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (actionId) query = query.eq("action_id", actionId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      action_id,
      lead_id,
      reminder_type = "notification",
      title,
      message,
      scheduled_for,
      channel = "in_app",
      priority = "medium",
      assigned_agent_id,
    } = body;

    const { data, error } = await client
      .database
      .from("agenda_reminders")
      .insert({
        action_id,
        lead_id,
        reminder_type,
        title,
        message,
        scheduled_for,
        channel,
        priority,
        assigned_agent_id: assigned_agent_id || user.id,
        status: "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (updates.status === "sent" || updates.status === "read") {
      updates.sent_at = updates.sent_at || new Date().toISOString();
      if (updates.status === "read") {
        updates.read_at = new Date().toISOString();
      }
    }

    const { data, error } = await client
      .database
      .from("agenda_reminders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { error } = await client
    .database
    .from("agenda_reminders")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
