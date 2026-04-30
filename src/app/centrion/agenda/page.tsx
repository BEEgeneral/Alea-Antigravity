"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, Plus, Search, Bell, CheckCircle, AlertCircle, Trash2, Loader2, Edit2, Video, X } from "lucide-react";

interface Action {
    id: string;
    title: string;
    description?: string;
    action_type: string;
    entity_type?: string;
    entity_id?: string;
    priority: "high" | "medium" | "low";
    status: "pending" | "in_progress" | "completed" | "cancelled";
    due_date: string;
    assigned_to?: string;
    created_at: string;
}

interface Reminder {
    id: string;
    title: string;
    description?: string;
    remind_at: string;
    entity_type?: string;
    entity_id?: string;
    is_sent: boolean;
    created_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
    high: "bg-red-500/10 text-red-400 border border-red-500/20",
    medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    low: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

const STATUS_COLORS: Record<string, string> = {
    pending: "text-amber-400",
    completed: "text-emerald-400",
    overdue: "text-red-400",
    in_progress: "text-blue-400",
    cancelled: "text-muted-foreground",
};

const ACTION_TYPE_LABELS: Record<string, string> = {
    call: "📞 Llamada",
    email: "✉️ Email",
    meeting: "🤝 Reunión",
    document: "📄 Documento",
    visit: "🏠 Visita",
    follow_up: "↗️ Seguimiento",
    other: "• Otro",
};

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffD = Math.floor(diffH / 24);

    if (diffD < -1) return `hace ${Math.abs(diffD)} días`;
    if (diffD === -1) return "ayer";
    if (diffD === 0) {
        if (diffH > 0) return `en ${diffH}h`;
        if (diffH === 0) return "ahora";
        return `hace ${Math.abs(diffH)}h`;
    }
    if (diffD === 1) return "mañana";
    if (diffD < 7) return `en ${diffD} días`;
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
}

export default function AgendaPage() {
    const [actions, setActions] = useState<Action[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"actions" | "reminders">("actions");
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        action_type: "call",
        priority: "medium" as "high" | "medium" | "low",
        due_date: "",
        assigned_to: "",
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [actionsRes, remindersRes] = await Promise.all([
                fetch("/api/agenda/actions"),
                fetch("/api/agenda/reminders"),
            ]);
            if (actionsRes.ok) {
                const data = await actionsRes.json();
                setActions(Array.isArray(data) ? data : data.actions || []);
            }
            if (remindersRes.ok) {
                const data = await remindersRes.json();
                setReminders(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to fetch agenda data:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            const res = await fetch("/api/agenda/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
                }),
            });
            if (res.ok) {
                setShowModal(false);
                setForm({ title: "", description: "", action_type: "call", priority: "medium", due_date: "", assigned_to: "" });
                await fetchData();
            }
        } finally {
            setModalLoading(false);
        }
    };

    const handleToggleAction = async (action: Action) => {
        const newStatus = action.status === "completed" ? "pending" : "completed";
        try {
            await fetch(`/api/agenda/actions/${action.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            await fetchData();
        } catch (e) {
            console.error("Failed to toggle action:", e);
        }
    };

    const handleDeleteAction = async (id: string) => {
        if (!confirm("¿Eliminar esta acción?")) return;
        try {
            await fetch(`/api/agenda/actions/${id}`, { method: "DELETE" });
            await fetchData();
        } catch (e) {
            console.error("Failed to delete action:", e);
        }
    };

    const filteredActions = actions.filter(
        (a) =>
            a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const overdueActions = actions.filter((a) => isOverdue(a.due_date) && a.status !== "completed" && a.status !== "cancelled");
    const pendingActions = actions.filter((a) => !isOverdue(a.due_date) && a.status === "pending");
    const inProgressActions = actions.filter((a) => a.status === "in_progress");
    const completedActions = actions.filter((a) => a.status === "completed");

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-medium">Agenda</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {actions.length} acciones · {reminders.length} recordatorios
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => fetchData()}
                        className="flex items-center space-x-2 px-4 py-2 border border-border rounded-xl hover:bg-muted transition-all text-sm"
                    >
                        <Loader2 size={14} className="text-muted-foreground" />
                        <span>Actualizar</span>
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all text-sm font-medium"
                    >
                        <Plus size={18} />
                        <span>Nueva Acción</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-card/50 border border-border/50 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Pendientes</span>
                        <AlertCircle size={14} className="text-amber-400/60" />
                    </div>
                    <p className="text-3xl font-serif font-bold text-amber-400">{pendingActions.length}</p>
                    {overdueActions.length > 0 && (
                        <p className="text-xs text-red-400 mt-1">{overdueActions.length} vencidas</p>
                    )}
                </div>
                <div className="bg-card/50 border border-border/50 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">En Progreso</span>
                        <Clock size={14} className="text-blue-400/60" />
                    </div>
                    <p className="text-3xl font-serif font-bold text-blue-400">{inProgressActions.length}</p>
                </div>
                <div className="bg-card/50 border border-border/50 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Completadas</span>
                        <CheckCircle size={14} className="text-emerald-400/60" />
                    </div>
                    <p className="text-3xl font-serif font-bold text-emerald-400">{completedActions.length}</p>
                </div>
                <div className="bg-card/50 border border-border/50 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Recordatorios</span>
                        <Bell size={14} className="text-muted-foreground/60" />
                    </div>
                    <p className="text-3xl font-serif font-bold">{reminders.length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center space-x-2 mb-6">
                {([["actions", "Acciones"], ["reminders", "Recordatorios"]] as const).map(([tab, label]) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            activeTab === tab ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="flex items-center space-x-3 mb-6">
                <div className="flex-1 max-w-md flex items-center space-x-2 bg-card border border-border rounded-xl px-4 py-2">
                    <Search size={16} className="text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar acciones o recordatorios..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm("")}>
                            <X size={14} className="text-muted-foreground" />
                        </button>
                    )}
                </div>
            </div>

            {/* Actions Tab */}
            {activeTab === "actions" && (
                <div className="space-y-3">
                    {filteredActions.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-border rounded-3xl">
                            <CheckCircle size={40} className="mx-auto text-muted-foreground/20 mb-4" />
                            <p className="text-muted-foreground uppercase tracking-widest text-sm font-bold">
                                Sin acciones
                            </p>
                            <p className="text-muted-foreground/50 text-xs mt-2">
                                Crea tu primera acción para empezar a gestionar tu agenda.
                            </p>
                        </div>
                    ) : (
                        filteredActions.map((action) => {
                            const overdue = isOverdue(action.due_date) && action.status !== "completed" && action.status !== "cancelled";
                            return (
                                <div
                                    key={action.id}
                                    className={`bg-card/50 border rounded-2xl p-5 hover:border-border/80 transition-all ${
                                        overdue ? "border-red-500/30 bg-red-500/5" : "border-border/50"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start space-x-4 flex-1 min-w-0">
                                            <button
                                                onClick={() => handleToggleAction(action)}
                                                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                                    action.status === "completed"
                                                        ? "bg-emerald-500 border-emerald-500"
                                                        : action.status === "cancelled"
                                                        ? "bg-muted border-muted-foreground/30"
                                                        : "border-muted-foreground/40 hover:border-primary"
                                                }`}
                                            >
                                                {action.status === "completed" && <CheckCircle size={12} className="text-white" />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${PRIORITY_COLORS[action.priority]}`}>
                                                        {action.priority}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground text-[10px] font-medium">
                                                        {ACTION_TYPE_LABELS[action.action_type] || action.action_type}
                                                    </span>
                                                    {overdue && (
                                                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                                                            Vencida
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className={`text-base font-medium ${action.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                                    {action.title}
                                                </h3>
                                                {action.description && (
                                                    <p className="text-sm text-muted-foreground/70 mt-1 line-clamp-2">{action.description}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                    <span className={`flex items-center gap-1 ${overdue ? "text-red-400" : ""}`}>
                                                        <Clock size={12} />
                                                        <span className={overdue ? "text-red-400 font-medium" : ""}>{formatDate(action.due_date)}</span>
                                                    </span>
                                                    {action.assigned_to && (
                                                        <span>→ {action.assigned_to}</span>
                                                    )}
                                                    <span className={`uppercase tracking-widest font-bold ${STATUS_COLORS[action.status]}`}>
                                                        {action.status.replace("_", " ")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1 shrink-0">
                                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAction(action.id)}
                                                className="p-2 hover:bg-muted rounded-lg transition-colors text-red-400"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Reminders Tab */}
            {activeTab === "reminders" && (
                <div className="space-y-3">
                    {reminders.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-border rounded-3xl">
                            <Bell size={40} className="mx-auto text-muted-foreground/20 mb-4" />
                            <p className="text-muted-foreground uppercase tracking-widest text-sm font-bold">
                                Sin recordatorios
                            </p>
                        </div>
                    ) : (
                        reminders.map((reminder) => (
                            <div key={reminder.id} className="bg-card/50 border border-border/50 rounded-2xl p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <Bell size={16} className="mt-0.5 text-primary/60 shrink-0" />
                                        <div>
                                            <h3 className="text-base font-medium">{reminder.title}</h3>
                                            {reminder.description && (
                                                <p className="text-sm text-muted-foreground/70 mt-1">{reminder.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {formatDate(reminder.remind_at)}
                                                </span>
                                                {reminder.is_sent && (
                                                    <span className="text-emerald-400">✓ Enviado</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Create Action Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-serif font-medium">Nueva Acción</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAction} className="space-y-4">
                            <div>
                                <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Título *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                                    placeholder="Ej: Llamar a Carlos Ruiz"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Descripción</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 resize-none"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Tipo</label>
                                    <select
                                        value={form.action_type}
                                        onChange={(e) => setForm({ ...form, action_type: e.target.value })}
                                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                                    >
                                        <option value="call">📞 Llamada</option>
                                        <option value="email">✉️ Email</option>
                                        <option value="meeting">🤝 Reunión</option>
                                        <option value="document">📄 Documento</option>
                                        <option value="visit">🏠 Visita</option>
                                        <option value="follow_up">↗️ Seguimiento</option>
                                        <option value="other">• Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Prioridad</label>
                                    <select
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: e.target.value as "high" | "medium" | "low" })}
                                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                                    >
                                        <option value="high">🔴 Alta</option>
                                        <option value="medium">🟡 Media</option>
                                        <option value="low">🟢 Baja</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Fecha límite</label>
                                    <input
                                        type="datetime-local"
                                        value={form.due_date}
                                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Asignado a</label>
                                    <input
                                        type="text"
                                        value={form.assigned_to}
                                        onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                                        placeholder="Nombre del agente"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-border rounded-xl text-sm hover:bg-muted transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalLoading}
                                    className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                    {modalLoading ? "Creando..." : "Crear Acción"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
