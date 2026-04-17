"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Plus, Search, Bell, CheckCircle, AlertCircle, Trash2, Loader2, Edit2, Video } from "lucide-react";

interface Reminder {
    id: string;
    title: string;
    description?: string;
    due_date: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'completed' | 'overdue';
    entity_type?: string;
    entity_id?: string;
}

interface Action {
    id: string;
    title: string;
    due_date: string;
    assigned_to?: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in_progress' | 'completed';
}

export default function AgendaPage() {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [actions, setActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'reminders' | 'actions' | 'calendar'>('reminders');
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const today = new Date();
        setReminders([
            { id: '1', title: 'Llamar a Carlos Ruiz', description: 'Seguir up inversión hotel Madrid', due_date: today.toISOString(), priority: 'high', status: 'pending' },
            { id: '2', title: 'Enviar dossier Chueca', description: 'Adjuntar imágenes y precio', due_date: new Date(today.getTime() + 86400000).toISOString(), priority: 'medium', status: 'pending' },
            { id: '3', title: 'Revisar propuestas', description: '3 propuestas pendientes', due_date: new Date(today.getTime() - 86400000).toISOString(), priority: 'high', status: 'overdue' },
        ]);
        setActions([
            { id: '1', title: 'Crear lead para Maria García', due_date: today.toISOString(), priority: 'high', status: 'pending' },
            { id: '2', title: 'Actualizar precio Palacio Gran Via', due_date: new Date(today.getTime() + 172800000).toISOString(), priority: 'medium', status: 'in_progress' },
            { id: '3', title: 'Enviar NDA a inversor', due_date: today.toISOString(), priority: 'medium', status: 'completed' },
        ]);
        setLoading(false);
    }, []);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-500/10 text-red-500';
            case 'medium': return 'bg-amber-500/10 text-amber-500';
            case 'low': return 'bg-green-500/10 text-green-500';
            default: return 'bg-muted';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-amber-500';
            case 'completed': return 'text-green-500';
            case 'overdue': return 'text-red-500';
            case 'in_progress': return 'text-blue-500';
            default: return 'text-muted-foreground';
        }
    };

    const handleToggleReminder = (id: string) => {
        setReminders(prev => prev.map(r => 
            r.id === id ? { ...r, status: r.status === 'completed' ? 'pending' : 'completed' } : r
        ));
    };

    const handleToggleAction = (id: string) => {
        setActions(prev => prev.map(a => 
            a.id === id ? { ...a, status: a.status === 'completed' ? 'pending' : 'completed' } : a
        ));
    };

    const filteredReminders = reminders.filter(r => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredActions = actions.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-medium">Agenda</h1>
                    <p className="text-sm text-muted-foreground mt-1">Recordatorios y acciones pendientes</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition-all">
                        <Plus size={18} />
                        <span className="text-sm font-medium">Nueva Tarea</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pendientes</p>
                    <p className="text-2xl font-serif text-amber-500">{reminders.filter(r => r.status === 'pending').length + actions.filter(a => a.status === 'pending').length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Completadas</p>
                    <p className="text-2xl font-serif text-green-500">{reminders.filter(r => r.status === 'completed').length + actions.filter(a => a.status === 'completed').length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Vencidas</p>
                    <p className="text-2xl font-serif text-red-500">{reminders.filter(r => r.status === 'overdue').length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">En Progreso</p>
                    <p className="text-2xl font-serif text-blue-500">{actions.filter(a => a.status === 'in_progress').length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center space-x-4 mb-6">
                {(['reminders', 'actions', 'calendar'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}
                    >
                        {tab === 'reminders' ? 'Recordatorios' : tab === 'actions' ? 'Acciones' : 'Calendario'}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 max-w-md flex items-center space-x-2 bg-card border border-border rounded-xl px-4 py-2">
                    <Search size={18} className="text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {activeTab === 'reminders' && (
                <div className="space-y-4">
                    {filteredReminders.map(reminder => (
                        <div key={reminder.id} className={`p-6 bg-card border rounded-2xl ${reminder.status === 'overdue' ? 'border-red-500/50' : 'border-border'}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <button 
                                        onClick={() => handleToggleReminder(reminder.id)}
                                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${reminder.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-muted-foreground'}`}
                                    >
                                        {reminder.status === 'completed' && <CheckCircle size={14} className="text-white" />}
                                    </button>
                                    <div>
                                        <h3 className={`font-medium mb-1 ${reminder.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{reminder.title}</h3>
                                        {reminder.description && (
                                            <p className="text-sm text-muted-foreground mb-2">{reminder.description}</p>
                                        )}
                                        <div className="flex items-center space-x-3">
                                            <span className={`px-2 py-0.5 ${getPriorityColor(reminder.priority)} text-xs rounded-md font-medium`}>
                                                {reminder.priority}
                                            </span>
                                            <span className="flex items-center space-x-1 text-xs text-muted-foreground">
                                                <Clock size={12} />
                                                <span>{new Date(reminder.due_date).toLocaleDateString('es-ES')}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="p-2 hover:bg-muted rounded-lg transition-colors text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredReminders.length === 0 && (
                        <div className="text-center py-12">
                            <Bell size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">No se encontraron recordatorios</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'actions' && (
                <div className="space-y-4">
                    {filteredActions.map(action => (
                        <div key={action.id} className="p-6 bg-card border border-border rounded-2xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <button 
                                        onClick={() => handleToggleAction(action.id)}
                                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${action.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-muted-foreground'}`}
                                    >
                                        {action.status === 'completed' && <CheckCircle size={14} className="text-white" />}
                                    </button>
                                    <div>
                                        <h3 className={`font-medium mb-1 ${action.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{action.title}</h3>
                                        <div className="flex items-center space-x-3">
                                            <span className={`px-2 py-0.5 ${getPriorityColor(action.priority)} text-xs rounded-md font-medium`}>
                                                {action.priority}
                                            </span>
                                            <span className={`text-xs ${getStatusColor(action.status)}`}>
                                                {action.status.replace('_', ' ')}
                                            </span>
                                            {action.assigned_to && (
                                                <span className="text-xs text-muted-foreground">→ {action.assigned_to}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                        <Video size={16} />
                                    </button>
                                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'calendar' && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="text-center py-12">
                        <Calendar size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">Vista de calendario próximamente</p>
                    </div>
                </div>
            )}
        </div>
    );
}