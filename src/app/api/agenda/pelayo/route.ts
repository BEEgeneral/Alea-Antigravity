import { createAuthenticatedClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("lead_id");
  const agentId = searchParams.get("agent_id") || user.id;
  const includeHistory = searchParams.get("include_history") === "true";

  let actionsQuery = client
    .database
    .from("agenda_actions")
    .select(`
      id, title, description, action_type, action_category, due_date, priority, status,
      outcome, completion_notes, completed_at, sla_hours, sla_breached, pipeline_stage,
      lead:leads(id, status, investors:investors(full_name, company_name))
    `)
    .order("due_date", { ascending: true });

  if (leadId) {
    actionsQuery = actionsQuery.eq("lead_id", leadId);
  } else {
    actionsQuery = actionsQuery.eq("assigned_agent_id", agentId);
  }

  const { data: actions, error: actionsError } = await actionsQuery;
  if (actionsError) return NextResponse.json({ error: actionsError.message }, { status: 500 });

  const { data: reminders } = await client
    .database
    .from("agenda_reminders")
    .select("*")
    .eq("assigned_agent_id", agentId)
    .in("status", ["pending", "sent"])
    .order("scheduled_for", { ascending: true })
    .limit(10);

  const { count: overdueCount } = await client
    .database
    .from("agenda_actions")
    .select("id", { count: "exact" })
    .eq("assigned_agent_id", agentId)
    .neq("status", "completed")
    .neq("status", "cancelled")
    .lt("due_date", new Date().toISOString());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: todayActions } = await client
    .database
    .from("agenda_actions")
    .select("id, title, due_date, priority, action_type")
    .eq("assigned_agent_id", agentId)
    .neq("status", "completed")
    .neq("status", "cancelled")
    .gte("due_date", today.toISOString())
    .lt("due_date", tomorrow.toISOString())
    .order("priority", { ascending: false })
    .limit(5);

  // Format response for Pelayo
  const agendaData = {
    current_actions: actions?.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.action_type,
      category: a.action_category,
      due_date: a.due_date,
      priority: a.priority,
      status: a.status,
      outcome: a.outcome,
      completion_notes: a.completion_notes,
      completed_at: a.completed_at,
      sla_hours: a.sla_hours,
      sla_breached: a.sla_breached,
      pipeline_stage: a.pipeline_stage,
      lead: (a.lead as any)?.[0] ? {
        id: (a.lead as any)[0].id,
        status: (a.lead as any)[0].status,
        investor_name: (a.lead as any)[0].investors?.[0]?.full_name || (a.lead as any)[0].investors?.[0]?.company_name
      } : null
    })) || [],
    
    pending_reminders: reminders || [],
    
    stats: {
      overdue_count: overdueCount || 0,
      today_count: todayActions?.length || 0,
      total_active: actions?.filter(a => a.status !== "completed" && a.status !== "cancelled").length || 0
    },
    
    today_actions: todayActions || [],
    
    // Natural language summary for Pelayo
    summary: generateSummary(actions || [], overdueCount || 0, todayActions || [])
  };

  return NextResponse.json(agendaData);
}

function generateSummary(actions: any[], overdueCount: number, todayActions: any[]) {
  if (!actions || actions.length === 0) {
    return "No tienes acciones pendientes en este momento.";
  }

  const pending = actions.filter(a => a.status !== "completed" && a.status !== "cancelled");
  const overdue = pending.filter(a => new Date(a.due_date) < new Date());
  const upcoming = pending.filter(a => new Date(a.due_date) >= new Date());

  let summary = "";

  if (overdue.length > 0) {
    summary += `Tienes ${overdue.length} acción${overdue.length > 1 ? 'es' : ''} vencida${overdue.length > 1 ? 's' : ''}. `;
    overdue.slice(0, 3).forEach(a => {
      summary += `"${a.title}" (${a.action_type}) con ${a.lead?.investors?.full_name || a.lead?.investors?.company_name || "sin lead"}. `;
    });
  }

  if (todayActions && todayActions.length > 0) {
    summary += `Hoy tienes ${todayActions.length} acción${todayActions.length > 1 ? 'es' : ''} pendientes: `;
    todayActions.forEach(a => {
      summary += `"${a.title}" (${a.action_type})${a !== todayActions[todayActions.length - 1] ? ', ' : '. '}`;
    });
  } else if (upcoming.length > 0 && !todayActions) {
    summary += `Tienes ${upcoming.length} acción${upcoming.length > 1 ? 'es' : ''} próximas. `;
  }

  return summary.trim() || "Tu agenda está al día.";
}
