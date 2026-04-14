import { createAuthenticatedClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
  
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agent_id") || user.id;
    const includeOverdue = searchParams.get("include_overdue") !== "false";
    const includeUpcoming = searchParams.get("include_upcoming") !== "false";
    const hoursAhead = parseInt(searchParams.get("hours_ahead") || "72");

    const suggestions: any[] = [];
    const now = new Date();

    if (includeOverdue) {
      const { data: overdueActions } = await client
        .database
        .from("agenda_actions")
        .select("id, title, due_date, priority, status, action_type, sla_hours, pipeline_stage, lead_id")
        .eq("assigned_agent_id", agentId)
        .neq("status", "completed")
        .neq("status", "cancelled")
        .lt("due_date", now.toISOString())
        .order("due_date", { ascending: true });

      if (overdueActions) {
        for (const action of overdueActions) {
          const hoursOverdue = Math.floor((now.getTime() - new Date(action.due_date).getTime()) / (1000 * 60 * 60));
          suggestions.push({
            id: `overdue_${action.id}`,
            lead_id: action.lead_id,
            action_id: action.id,
            suggestion_type: "overdue",
            title: `Acción vencida: ${action.title}`,
            message: `Han pasado ${hoursOverdue}h desde la fecha límite. ${action.action_type === 'call' ? 'Llama' : action.action_type === 'email' ? 'Envía email' : 'Completa'} lo antes posible.`,
            priority: hoursOverdue > 48 ? "critical" : hoursOverdue > 24 ? "urgent" : "high",
            days_overdue: Math.floor(hoursOverdue / 24),
            hours_overdue: hoursOverdue,
            pipeline_stage: action.pipeline_stage,
          });
        }
      }
    }

    if (includeUpcoming) {
      const upcomingDeadline = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

      const { data: upcomingActions } = await client
        .database
        .from("agenda_actions")
        .select("id, title, due_date, priority, status, action_type, sla_hours, pipeline_stage, lead_id")
        .eq("assigned_agent_id", agentId)
        .neq("status", "completed")
        .neq("status", "cancelled")
        .gte("due_date", now.toISOString())
        .lte("due_date", upcomingDeadline.toISOString())
        .order("due_date", { ascending: true });

      if (upcomingActions) {
        for (const action of upcomingActions) {
          const hoursUntil = Math.floor((new Date(action.due_date).getTime() - now.getTime()) / (1000 * 60 * 60));
          const isSlaWarning = action.sla_hours && hoursUntil <= 24;
          
          suggestions.push({
            id: `upcoming_${action.id}`,
            lead_id: action.lead_id,
            action_id: action.id,
            suggestion_type: isSlaWarning ? "sla_warning" : "upcoming",
            title: isSlaWarning ? `⚠️ SLA próximo a vencer: ${action.title}` : `Recordatorio: ${action.title}`,
            message: isSlaWarning 
              ? `Quedan ${hoursUntil}h para el SLA. ${action.action_type === 'call' ? 'Llama ahora' : 'Completa esta acción pronto'}.`
              : `Due en ${hoursUntil <= 24 ? `${hoursUntil} horas` : `${Math.floor(hoursUntil / 24)} días`}.`,
            priority: isSlaWarning ? "high" : hoursUntil <= 24 ? "medium" : "low",
            hours_until_due: hoursUntil,
            pipeline_stage: action.pipeline_stage,
          });
        }
      }
    }

    const priorityOrder: Record<string, number> = { critical: 0, urgent: 1, high: 2, medium: 3, low: 4 };
    suggestions.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return (a.hours_overdue || 0) - (b.hours_overdue || 0);
    });

    return NextResponse.json({
      suggestions: suggestions.slice(0, 20),
      summary: {
        total: suggestions.length,
        overdue: suggestions.filter(s => s.suggestion_type === "overdue").length,
        upcoming: suggestions.filter(s => s.suggestion_type === "upcoming").length,
        sla_warnings: suggestions.filter(s => s.suggestion_type === "sla_warning").length,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}