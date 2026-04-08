import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agent_id") || user.id;
  const includeOverdue = searchParams.get("include_overdue") !== "false";
  const includeUpcoming = searchParams.get("include_upcoming") !== "false";
  const hoursAhead = parseInt(searchParams.get("hours_ahead") || "72");

  const suggestions: any[] = [];
  const now = new Date();

  // 1. OVERDUE ACTIONS - Actions past their due date
  if (includeOverdue) {
    const { data: overdueActions } = await supabase
      .from("agenda_actions")
      .select(`
        id, title, due_date, priority, status, action_type, sla_hours, pipeline_stage,
        lead:leads(id, investors:investors(full_name, company_name), properties:properties(title))
      `)
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
          lead_id: action.lead?.id,
          lead_name: action.lead?.investors?.full_name || action.lead?.investors?.company_name || "Unknown",
          property_title: action.lead?.properties?.title,
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

  // 2. UPCOMING ACTIONS - Actions due soon
  if (includeUpcoming) {
    const upcomingDeadline = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const { data: upcomingActions } = await supabase
      .from("agenda_actions")
      .select(`
        id, title, due_date, priority, status, action_type, sla_hours, pipeline_stage,
        lead:leads(id, investors:investors(full_name, company_name), properties:properties(title))
      `)
      .eq("assigned_agent_id", agentId)
      .neq("status", "completed")
      .neq("status", "cancelled")
      .gte("due_date", now.toISOString())
      .lte("due_date", upcomingDeadline.toISOString())
      .order("due_date", { ascending: true });

    if (upcomingActions) {
      for (const action of upcomingActions) {
        const hoursUntil = Math.floor((new Date(action.due_date).getTime() - now.getTime()) / (1000 * 60 * 60));
        
        // SLA Warning if within 24h of breach
        const isSlaWarning = action.sla_hours && hoursUntil <= 24;
        
        suggestions.push({
          id: `upcoming_${action.id}`,
          lead_id: action.lead?.id,
          lead_name: action.lead?.investors?.full_name || action.lead?.investors?.company_name || "Unknown",
          property_title: action.lead?.properties?.title,
          action_id: action.id,
          suggestion_type: isSlaWarning ? "sla_warning" : "upcoming",
          title: isSlaWarning ? `⚠️ SLA próximo a vencer: ${action.title}` : `Recordatorio: ${action.title}`,
          message: isSlaWarning 
            ? `Quedan ${hoursUntil}h para el SLA. ${action.action_type === 'call' ? 'Llama ahora' : 'Completa esta acción pronto'}.`
            : `Due en ${hoursUntil <= 24 ? `${hoursUntil} horas` : `${Math.floor(hoursUntil / 24)} días`}. ${action.action_type === 'call' ? 'Llama' : action.action_type === 'email' ? 'Envía email' : 'Completa'} cuando puedas.`,
          priority: isSlaWarning ? "high" : hoursUntil <= 24 ? "medium" : "low",
          hours_until_due: hoursUntil,
          pipeline_stage: action.pipeline_stage,
        });
      }
    }
  }

  // 3. STAGE-BASED SUGGESTIONS - Actions that should exist but don't
  const { data: activeLeads } = await supabase
    .from("leads")
    .select(`
      id, status, operative_stage, investors:investors(full_name, company_name), 
      properties:properties(title)
    `)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (activeLeads) {
    for (const lead of activeLeads) {
      const stage = lead.operative_stage || lead.status;
      
      // Get template actions for this stage
      const { data: templates } = await supabase
        .from("pipeline_action_templates")
        .select("*")
        .eq("trigger_at_stage", stage)
        .eq("auto_create", true)
        .order("display_order", { ascending: true })
        .limit(3);

      if (templates) {
        for (const template of templates) {
          // Check if this action already exists for this lead
          const { data: existing } = await supabase
            .from("agenda_actions")
            .select("id")
            .eq("lead_id", lead.id)
            .eq("action_type", template.action_type)
            .neq("status", "cancelled")
            .single();

          if (!existing) {
            suggestions.push({
              id: `suggestion_${lead.id}_${template.action_type}`,
              lead_id: lead.id,
              lead_name: lead.investors?.full_name || lead.investors?.company_name || "Unknown",
              property_title: lead.properties?.title,
              suggestion_type: "stage_suggestion",
              title: `Sugerencia: ${template.name}`,
              message: `Según el pipeline, cuando un lead está en "${stage}", debería ${template.name.toLowerCase()}. ¿Deseas crear esta acción?`,
              priority: "low",
              pipeline_stage: stage,
              template_id: template.id,
            });
          }
        }
      }
    }
  }

  // 4. FOLLOW-UP SUGGESTIONS - Leads without recent contact
  const { data: leadsNeedingFollowUp } = await supabase
    .from("leads")
    .select(`
      id, last_reminder_at, operative_stage, updated_at,
      investors:investors(full_name, company_name),
      properties:properties(title)
    `)
    .not("status", "eq", "closed")
    .not("status", "eq", "won")
    .order("updated_at", { ascending: true })
    .limit(10);

  if (leadsNeedingFollowUp) {
    for (const lead of leadsNeedingFollowUp) {
      const daysSinceUpdate = Math.floor((now.getTime() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate >= 3) {
        suggestions.push({
          id: `followup_${lead.id}`,
          lead_id: lead.id,
          lead_name: lead.investors?.full_name || lead.investors?.company_name || "Unknown",
          property_title: lead.properties?.title,
          suggestion_type: "follow_up",
          title: `Seguimiento necesario`,
          message: `No hay actividad con ${lead.investors?.full_name || "este lead"} desde hace ${daysSinceUpdate} días. Considera hacer un seguimiento.`,
          priority: daysSinceUpdate >= 7 ? "high" : "medium",
          days_inactive: daysSinceUpdate,
          pipeline_stage: lead.operative_stage,
        });
      }
    }
  }

  // Sort by priority and urgency
  const priorityOrder = { critical: 0, urgent: 1, high: 2, medium: 3, low: 4 };
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
      stage_suggestions: suggestions.filter(s => s.suggestion_type === "stage_suggestion").length,
      follow_ups: suggestions.filter(s => s.suggestion_type === "follow_up").length,
    }
  });
}
