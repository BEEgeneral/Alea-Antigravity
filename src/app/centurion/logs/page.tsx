"use client";

import { useEffect, useState } from "react";
import { Activity, Database, Clock, Filter, Download, RefreshCw, Loader2, AlertCircle, CheckCircle, Info } from "lucide-react";

interface LogEntry {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    details: string;
    agent_id: string;
    created_at: string;
}

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState<string>('all');
    const [filterEntity, setFilterEntity] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('insforge_token');
                const res = await fetch('/api/admin/logs', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setLogs(data.logs || []);
                } else {
                    // Generate mock data for demo
                    setLogs([
                        { id: '1', entity_type: 'agent', entity_id: '1', action: 'LOGIN', details: 'Usuario inició sesión', agent_id: '1', created_at: new Date().toISOString() },
                        { id: '2', entity_type: 'property', entity_id: '2', action: 'CREATE', details: 'Propiedad creada: Chueca Project', agent_id: '1', created_at: new Date().toISOString() },
                        { id: '3', entity_type: 'investor', entity_id: '3', action: 'UPDATE', details: 'Perfil de inversor actualizado', agent_id: '1', created_at: new Date().toISOString() },
                    ]);
                }
            } catch (err) {
                console.error('Error fetching logs:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesAction = filterAction === 'all' || log.action === filterAction;
        const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;
        const matchesSearch = log.details?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesAction && matchesEntity && matchesSearch;
    });

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE': return <CheckCircle size={14} className="text-green-500" />;
            case 'UPDATE': return <Info size={14} className="text-blue-500" />;
            case 'DELETE': return <AlertCircle size={14} className="text-red-500" />;
            case 'LOGIN': return <CheckCircle size={14} className="text-green-500" />;
            default: return <Activity size={14} className="text-muted-foreground" />;
        }
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

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
                    <h1 className="text-2xl font-serif font-medium">Base de Datos y Logs</h1>
                    <p className="text-sm text-muted-foreground mt-1">Registro de actividad y auditoría del sistema</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-all text-sm">
                        <Download size={16} />
                        <span>Exportar</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-all text-sm">
                        <RefreshCw size={16} />
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Logs</p>
                    <p className="text-2xl font-serif">{logs.length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hoy</p>
                    <p className="text-2xl font-serif">{logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Acciones Create</p>
                    <p className="text-2xl font-serif text-green-500">{logs.filter(l => l.action === 'CREATE').length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Updates</p>
                    <p className="text-2xl font-serif text-blue-500">{logs.filter(l => l.action === 'UPDATE').length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 max-w-md flex items-center space-x-2 bg-card border border-border rounded-xl px-4 py-2">
                    <Filter size={16} className="text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Buscar en logs..." 
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className="px-4 py-2 bg-card border border-border rounded-xl text-sm"
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                >
                    <option value="all">Todas las acciones</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="LOGIN">Login</option>
                </select>
                <select 
                    className="px-4 py-2 bg-card border border-border rounded-xl text-sm"
                    value={filterEntity}
                    onChange={(e) => setFilterEntity(e.target.value)}
                >
                    <option value="all">Todas las entidades</option>
                    <option value="agent">Agentes</option>
                    <option value="investor">Inversores</option>
                    <option value="property">Propiedades</option>
                    <option value="lead">Leads</option>
                    <option value="mandatario">Mandatarios</option>
                </select>
            </div>

            {/* Logs Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead className="border-b border-border bg-muted/30">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Fecha</th>
                            <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Acción</th>
                            <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Entidad</th>
                            <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Detalles</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <Clock size={14} className="text-muted-foreground" />
                                        <span className="text-sm">{formatDate(log.created_at)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        {getActionIcon(log.action)}
                                        <span className="text-sm font-medium px-2 py-0.5 bg-muted rounded-md">{log.action}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded-md capitalize">{log.entity_type || 'N/A'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm">{log.details || 'Sin detalles'}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredLogs.length === 0 && (
                    <div className="text-center py-12">
                        <Database size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">No se encontraron registros</p>
                    </div>
                )}
            </div>
        </div>
    );
}