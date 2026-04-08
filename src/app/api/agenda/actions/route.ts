import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("lead_id");
  const status = searchParams.get("status");
  const assignedToMe = searchParams.get("assigned_to_me");
  const overdue = searchParams.get("overdue");
  const limit = parseInt(searchParams.get("limit") || "50");

  let query = supabase
    .from("agenda_actions")
    .select("*, lead:leads(id, status, investors:investors(full_name, company_name))")
    .order("due_date", { ascending: true })
    .limit(limit);

  if (leadId) query = query.eq("lead_id", leadId);
  if (status) query = query.eq("status", status);
  if (assignedToMe === "true") query = query.eq("assigned_agent_id", user.id);
  if (overdue === "true") {
    query = query.lt("due_date", new Date().toISOString());
    query = query.neq("status", "completed");
    query = query.neq("status", "cancelled");
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      lead_id,
      investor_id,
      property_id,
      title,
      description,
      action_type,
      action_category,
      due_date,
      scheduled_for,
      estimated_duration_minutes = 30,
      priority = "medium",
      status = "pending",
      sla_hours,
      pipeline_stage,
      assigned_agent_id,
      is_auto_generated = false,
      trigger_rule,
    } = body;

    const { data, error } = await supabase
      .from("agenda_actions")
      .insert({
        lead_id,
        investor_id,
        property_id,
        title,
        description,
        action_type,
        action_category,
        due_date,
        scheduled_for,
        estimated_duration_minutes,
        priority,
        status,
        sla_hours,
        pipeline_stage,
        assigned_agent_id: assigned_agent_id || user.id,
        created_by: user.id,
        is_auto_generated,
        trigger_rule,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log activity
    await supabase.from("agenda_activity_log").insert({
      action_id: data.id,
      lead_id,
      activity_type: "created",
      description: `Action created: ${title}`,
      agent_id: user.id,
    });

    // Update lead's current_action_id and next_action_due
    await supabase
      .from("leads")
      .update({ 
        current_action_id: data.id, 
        next_action_due: due_date 
      })
      .eq("id", lead_id);

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // If completing, set completed_at and completed_by
    if (updates.status === "completed") {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = user.id;
    }

    const { data, error } = await supabase
      .from("agenda_actions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log activity
    await supabase.from("agenda_activity_log").insert({
      action_id: id,
      lead_id: data.lead_id,
      activity_type: updates.status === "completed" ? "completed" : "updated",
      description: `Action ${updates.status === "completed" ? "completed" : "updated"}: ${data.title}`,
      agent_id: user.id,
    });

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { error } = await supabase
    .from("agenda_actions")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
