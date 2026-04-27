"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, CheckCircle2, AlertCircle, Calendar, Plus, 
  ChevronRight, Bell, TrendingUp, User, Building, 
  Mail, Phone, FileText, MoreVertical, Filter, X,
  RefreshCw, Link2, ExternalLink, Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AgendaAction, AgendaSuggestion, ActionType, ActionPriority, ActionStatus } from "@/types/admin";

const ACTION_ICONS: Record<string, any> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  document: FileText,
  follow_up: TrendingUp,
  kyc: FileText,
  loi: FileText,
  nda: FileText,
  offer: FileText,
  closing: CheckCircle2,
  custom: MoreVertical,
};

const PRIORITY_COLORS: Record<ActionPriority, string> = {
  low: "bg-blue-500/20 text-blue-400",
  medium: "bg-amber-500/20 text-amber-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400",
  critical: "bg-red-600/20 text-red-600",
};

const STATUS_LABELS: Record<ActionStatus, string> = {
  pending: "Pendiente",
  scheduled: "Programada",
  in_progress: "En Progreso",
  completed: "Completada",
  cancelled: "Cancelada",
  failed: "Fallida",
  waiting: "Esperando",
};

interface AgendaPanelProps {
  leadId?: string;
  isEmbedded?: boolean;
}

export default function AgendaPanel({ leadId, isEmbedded }: AgendaPanelProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [actions, setActions] = useState<AgendaAction[]>([]);
  const [suggestions, setSuggestions] = useState<AgendaSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "overdue" | "today" | "upcoming">("all");
  const [isCreating, setIsCreating] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showCalendarEvents, setShowCalendarEvents] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [newAction, setNewAction] = useState({
    title: "",
    description: "",
    action_type: "call" as ActionType,
    due_date: "",
    priority: "medium" as ActionPriority,
    create_calendar_event: false,
  });

  useEffect(() => {
    fetchActions();
    fetchSuggestions();
    checkGmailStatus();
  }, [leadId]);

  async function checkGmailStatus() {
    try {
      const res = await fetch("/api/gmail/status");
      const data = await res.json();
      setGmailConnected(data.connected || false);
    } catch { setGmailConnected(false); }
  }

  async function connectGmail() {
    try {
      const res = await fetch("/api/gmail/auth");
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error("Error connecting Gmail:", err);
    }
  }

  async function fetchCalendarEvents() {
    setSyncing(true);
    try {
      const res = await fetch("/api/agenda/calendar-sync?days=14");
      const data = await res.json();
      if (data.events) {
        setCalendarEvents(data.events);
        setShowCalendarEvents(true);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error("Error fetching calendar:", err);
    } finally {
      setSyncing(false);
    }
  }

  async function syncCalendarEvent(event: any) {
    try {
      const res = await fetch("/api/agenda/calendar-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: [event] }),
      });
      const data = await res.json();
      if (data.created > 0) {
        setCalendarEvents(prev => prev.filter(e => e.id !== event.id));
        fetchActions();
      }
    } catch (err) {
      console.error("Error syncing event:", err);
    }
  }

  async function fetchActions() {
    setLoading(true);
    let url = "/api/agenda/actions?limit=50";
    if (leadId) url += `&lead_id=${leadId}`;

    if (!session?.user) return;

    const res = await fetch(url);
    const data = await res.json();
    setActions(data || []);
    setLoading(false);
  }

  async function fetchSuggestions() {
    const res = await fetch("/api/agenda/suggestions?limit=20");
    const data = await res.json();
    setSuggestions(data?.suggestions || []);
  }

  async function createAction() {
    if (!newAction.title || !newAction.due_date) return;

    if (!session?.user) return;

    const res = await fetch("/api/agenda/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newAction.title,
        description: newAction.description,
        action_type: newAction.action_type,
        due_date: new Date(newAction.due_date).toISOString(),
        priority: newAction.priority,
        lead_id: leadId,
        assigned_agent_id: (session.user as any).id,
        create_calendar_event: newAction.action_type === 'meeting' && newAction.create_calendar_event && gmailConnected,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setIsCreating(false);
      setNewAction({ title: "", description: "", action_type: "call", due_date: "", priority: "medium", create_calendar_event: false });
      fetchActions();
      fetchSuggestions();
      
      if (data.calendarEvent?.htmlLink) {
        window.open(data.calendarEvent.htmlLink, '_blank');
      }
    }
  }

  async function completeAction(actionId: string, outcome: string) {
    const res = await fetch("/api/agenda/actions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: actionId,
        status: "completed",
        outcome,
      }),
    });

    if (res.ok) {
      fetchActions();
      fetchSuggestions();
    }
  }

  const filteredActions = actions.filter(a => {
    if (filter === "overdue") {
      return new Date(a.due_date) < new Date() && a.status !== "completed" && a.status !== "cancelled";
    }
    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return new Date(a.due_date) >= today && new Date(a.due_date) < tomorrow;
    }
    if (filter === "upcoming") {
      return new Date(a.due_date) >= new Date() && a.status !== "completed" && a.status !== "cancelled";
    }
    return true;
  });

  const stats = {
    total: actions.length,
    overdue: actions.filter(a => new Date(a.due_date) < new Date() && a.status !== "completed" && a.status !== "cancelled").length,
    pending: actions.filter(a => a.status === "pending" || a.status === "scheduled").length,
    completed: actions.filter(a => a.status === "completed").length,
  };

  return (
    <div className={`${isEmbedded ? "" : "max-w-6xl mx-auto w-full"}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Total</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-red-500" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Vencidas</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={14} className="text-amber-500" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Pendientes</span>
          </div>
          <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Completadas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
        </div>
      </div>

      {/* Google Calendar Integration */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gmailConnected ? 'bg-emerald-500/20' : 'bg-muted'}`}>
              {gmailConnected ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Calendar size={18} className="text-muted-foreground" />}
            </div>
            <div>
              <p className="text-sm font-bold">Google Calendar</p>
              <p className="text-[10px] text-muted-foreground">
                {gmailConnected ? 'Conectado - Sincroniza eventos de Google Calendar' : 'No conectado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!gmailConnected ? (
              <button
                onClick={connectGmail}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
              >
                <Link2 size={14} />
                <span>Conectar</span>
              </button>
            ) : (
              <>
                <button
                  onClick={fetchCalendarEvents}
                  disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                >
                  <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                  <span>{syncing ? 'Sincronizando...' : 'Ver Eventos'}</span>
                </button>
                <button
                  onClick={() => setShowCalendarEvents(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                >
                  <ExternalLink size={14} />
                  <span>Importar</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-muted-foreground" />
          {["all", "overdue", "today", "upcoming"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {f === "all" ? "Todas" : f === "overdue" ? "Vencidas" : f === "today" ? "Hoy" : "Próximas"}
            </button>
          ))}
        </div>
        {!leadId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
          >
            <Plus size={14} />
            <span>Nueva Acción</span>
          </button>
        )}
      </div>

      {/* Create Action Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <div className="relative bg-card border border-border w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8">
              <button
                onClick={() => setIsCreating(false)}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
              <h2 className="font-serif text-2xl mb-2">Nueva Acción</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">Crear una nueva acción de seguimiento</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2">Título</label>
                  <input
                    type="text"
                    value={newAction.title}
                    onChange={e => setNewAction({ ...newAction, title: e.target.value })}
                    className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50"
                    placeholder="Ej: Llamar a Juan García"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2">Tipo</label>
                    <select
                      value={newAction.action_type}
                      onChange={e => setNewAction({ ...newAction, action_type: e.target.value as ActionType })}
                      className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none appearance-none"
                    >
                      <option value="call">Llamada</option>
                      <option value="email">Email</option>
                      <option value="meeting">Reunión</option>
                      <option value="document">Documento</option>
                      <option value="follow_up">Seguimiento</option>
                      <option value="kyc">KYC</option>
                      <option value="nda">NDA</option>
                      <option value="loi">LOI (Carta de Intenciones)</option>
                      <option value="offer">Oferta</option>
                      <option value="closing">Cierre</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2">Prioridad</label>
                    <select
                      value={newAction.priority}
                      onChange={e => setNewAction({ ...newAction, priority: e.target.value as ActionPriority })}
                      className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none appearance-none"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2">Fecha Límite</label>
                  <input
                    type="datetime-local"
                    value={newAction.due_date}
                    onChange={e => setNewAction({ ...newAction, due_date: e.target.value })}
                    className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2">Descripción (opcional)</label>
                  <textarea
                    value={newAction.description}
                    onChange={e => setNewAction({ ...newAction, description: e.target.value })}
                    className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none resize-none h-24"
                    placeholder="Notas adicionales..."
                  />
                </div>
                
                {newAction.action_type === 'meeting' && gmailConnected && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                    <input
                      type="checkbox"
                      id="create_calendar_event"
                      checked={newAction.create_calendar_event}
                      onChange={e => setNewAction({ ...newAction, create_calendar_event: e.target.checked })}
                      className="w-5 h-5 rounded border-emerald-500 text-emerald-500 focus:ring-emerald-500"
                    />
                    <label htmlFor="create_calendar_event" className="text-sm cursor-pointer">
                      <span className="font-bold">Crear evento en Google Calendar</span>
                      <span className="text-muted-foreground text-xs block">Se creará un Meet automáticamente</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-6 py-3 border border-border rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={createAction}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
                >
                  Crear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Calendar Events Modal */}
      <AnimatePresence>
        {showCalendarEvents && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={() => setShowCalendarEvents(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <div className="relative bg-card border border-border w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 max-h-[80vh] overflow-y-auto">
              <button
                onClick={() => setShowCalendarEvents(false)}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
              <h2 className="font-serif text-2xl mb-2">Eventos de Google Calendar</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">Selecciona eventos para importar a tu agenda</p>
              
              {calendarEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay eventos próximos en Google Calendar</p>
                  <button
                    onClick={fetchCalendarEvents}
                    className="mt-4 px-6 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
                  >
                    Actualizar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {calendarEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/60">
                      <div className="flex-1">
                        <p className="font-bold text-sm">{event.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.start).toLocaleString('es-ES', { 
                            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                        {event.location && <p className="text-xs text-muted-foreground mt-1">📍 {event.location}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {event.meetLink && (
                          <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
                            className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
                            <ExternalLink size={16} className="text-primary" />
                          </a>
                        )}
                        <button
                          onClick={() => syncCalendarEvent(event)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                          <Plus size={14} />
                          Importar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      {suggestions.length > 0 && !leadId && (
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Bell size={14} className="text-amber-500" />
            Sugerencias
          </h3>
          <div className="grid gap-3">
            {suggestions.slice(0, 5).map(s => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${PRIORITY_COLORS[s.priority]}`}>
                    <Bell size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.message}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Cargando acciones...</span>
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-12 rounded-[2rem] text-center">
            <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-serif font-bold text-foreground/80 mb-2">Sin acciones</h3>
            <p className="text-sm text-muted-foreground">Las acciones aparecerán aquí cuando se creen.</p>
          </div>
        ) : (
          filteredActions.map(action => {
            const Icon = ACTION_ICONS[action.action_type] || MoreVertical;
            const isOverdue = new Date(action.due_date) < new Date() && action.status !== "completed" && action.status !== "cancelled";
            const hoursUntil = Math.floor((new Date(action.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60));

            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-card border rounded-2xl p-5 hover:border-primary/40 transition-all ${
                  isOverdue ? 'border-red-500/30 bg-red-500/5' : action.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isOverdue ? 'bg-red-500/10 text-red-500' : 
                      action.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                      'bg-primary/10 text-primary'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{action.title}</p>
                      {action.description && (
                        <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${PRIORITY_COLORS[action.priority]}`}>
                          {action.priority}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {STATUS_LABELS[action.status]}
                        </span>
                        <span className={`text-[10px] ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {isOverdue 
                            ? `Vencida hace ${Math.abs(hoursUntil)}h` 
                            : hoursUntil <= 24 
                              ? `En ${hoursUntil}h` 
                              : `En ${Math.floor(hoursUntil / 24)}d`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {action.status !== "completed" && action.status !== "cancelled" && (
                      <button
                        onClick={() => completeAction(action.id, "Completada desde agenda")}
                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                      >
                        <CheckCircle2 size={14} className="inline mr-1" />
                        Completar
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
