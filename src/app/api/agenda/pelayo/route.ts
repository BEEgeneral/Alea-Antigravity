import pool from "@/lib/vps-pg";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("lead_id");
  const agentId = searchParams.get("agent_id") || 'system';
  const includeHistory = searchParams.get("include_history") === "true";

  try {
    let actionsQuery = 'SELECT * FROM agenda_actions';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (leadId) {
      conditions.push(`lead_id = $${paramIndex++}`);
      params.push(leadId);
    } else {
      conditions.push(`assigned_agent_id = $${paramIndex++}`);
      params.push(agentId);
    }

    if (conditions.length > 0) {
      actionsQuery += ' WHERE ' + conditions.join(' AND ');
    }
    actionsQuery += ' ORDER BY due_date ASC';

    const actionsResult = await pool.query(actionsQuery, params);
    const actions = actionsResult.rows;

    const remindersResult = await pool.query(
      `SELECT * FROM agenda_reminders 
       WHERE assigned_agent_id = $1 AND status IN ('pending', 'sent') 
       ORDER BY scheduled_for ASC LIMIT 10`,
      [agentId]
    );
    const reminders = remindersResult.rows;

    const overdueCountResult = await pool.query(
      `SELECT COUNT(*) as count FROM agenda_actions 
       WHERE assigned_agent_id = $1 AND status != 'completed' AND status != 'cancelled' AND due_date < NOW()`,
      [agentId]
    );
    const overdueCount = parseInt(overdueCountResult.rows[0]?.count || '0');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayActionsResult = await pool.query(
      `SELECT id, title, due_date, priority, action_type FROM agenda_actions 
       WHERE assigned_agent_id = $1 AND status != 'completed' AND status != 'cancelled' 
       AND due_date >= $2 AND due_date < $3 
       ORDER BY priority DESC LIMIT 5`,
      [agentId, today.toISOString(), tomorrow.toISOString()]
    );
    const todayActions = todayActionsResult.rows;

    // Format response for Pelayo
    const agendaData = {
      current_actions: (actions || []).map((a: any) => ({
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
        lead: null
      })) || [],
      
      pending_reminders: reminders || [],
      
      stats: {
        overdue_count: overdueCount || 0,
        today_count: todayActions?.length || 0,
        total_active: (actions || []).filter((a: any) => a.status !== "completed" && a.status !== "cancelled").length || 0
      },
      
      today_actions: todayActions || [],
      
      summary: generateSummary(actions || [], overdueCount || 0, todayActions || [])
    };

    return NextResponse.json(agendaData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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
      summary += `"${a.title}" (${a.action_type}) sin lead. `;
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
