"use client";

import { useState, useEffect } from "react";
import { Zap, Play, Pause, Settings, Users, Activity, Clock, DollarSign, AlertCircle, CheckCircle, RefreshCw, Terminal, Loader2 } from "lucide-react";
import { insforge } from "@/lib/insforge-client";

interface Agent {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'busy' | 'sleeping';
    lastHeartbeat?: string;
    runsToday: number;
    costToday: number;
}

interface Task {
    id: string;
    agentId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    prompt: string;
    output?: string;
    cost?: number;
    duration?: number;
    createdAt: string;
}

export default function PaperclipPage() {
    const [agents, setAgents] = useState<Agent[]>([
        { id: 'pelayo', name: 'Pelayo', status: 'online', runsToday: 23, costToday: 1.45 },
        { id: 'centurion', name: 'Centurion', status: 'online', runsToday: 12, costToday: 0.89 },
        { id: 'aleai_iai', name: 'Alea IAI', status: 'sleeping', lastHeartbeat: new Date().toISOString(), runsToday: 45, costToday: 2.10 },
    ]);
    const [recentTasks, setRecentTasks] = useState<Task[]>([
        { id: '1', agentId: 'pelayo', status: 'completed', prompt: 'Show Madrid hotels to juan@ejemplo.com', cost: 0.05, duration: 12, createdAt: new Date().toISOString() },
        { id: '2', agentId: 'centurion', status: 'completed', prompt: 'Enrich lead: Carlos Ruiz', cost: 0.08, duration: 25, createdAt: new Date().toISOString() },
        { id: '3', agentId: 'pelayo', status: 'running', prompt: 'Calculate Vp for Palacio Gran Via', createdAt: new Date().toISOString() },
        { id: '4', agentId: 'aleai_iai', status: 'pending', prompt: 'Analyze email for opportunity', createdAt: new Date().toISOString() },
    ]);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'agents' | 'tasks' | 'logs'>('agents');

    const getStatusColor = (status: Agent['status']) => {
        switch (status) {
            case 'online': return 'text-emerald-500';
            case 'busy': return 'text-amber-500';
            case 'sleeping': return 'text-blue-500';
            case 'offline': return 'text-gray-400';
        }
    };

    const getStatusBg = (status: Agent['status']) => {
        switch (status) {
            case 'online': return 'bg-emerald-500/10';
            case 'busy': return 'bg-amber-500/10';
            case 'sleeping': return 'bg-blue-500/10';
            case 'offline': return 'bg-gray-500/10';
        }
    };

    const getTaskStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'completed': return 'text-emerald-500';
            case 'running': return 'text-amber-500';
            case 'failed': return 'text-red-500';
            case 'pending': return 'text-gray-400';
        }
    };

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch('/api/paperclip?action=status', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.agents) setAgents(data.agents);
                if (data.tasks) setRecentTasks(data.tasks);
            }
        } catch (err) {
            console.error('Error refreshing paperclip:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAgent = async (agentId: string) => {
        setAgents(prev => prev.map(a => {
            if (a.id === agentId) {
                const newStatus = a.status === 'online' ? 'offline' : 'online';
                return { ...a, status: newStatus };
            }
            return a;
        }));
    };

    const totalCost = agents.reduce((acc, a) => acc + a.costToday, 0);
    const totalRuns = agents.reduce((acc, a) => acc + a.runsToday, 0);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-medium">Paperclip Agent Control</h1>
                    <p className="text-sm text-muted-foreground mt-1">Sistema de agentes IA y orquestación de tareas</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-all"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        <span className="text-sm">Actualizar</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition-all">
                        <Zap size={18} />
                        <span className="text-sm font-medium">Nuevo Agente</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-card border border-border rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <CheckCircle size={16} className="text-emerald-500" />
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Activos</p>
                    </div>
                    <p className="text-2xl font-serif">{agents.filter(a => a.status === 'online').length}/{agents.length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                            <Activity size={16} className="text-amber-500" />
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Ejecuciones Hoy</p>
                    </div>
                    <p className="text-2xl font-serif">{totalRuns}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <DollarSign size={16} className="text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Costo Total</p>
                    </div>
                    <p className="text-2xl font-serif">${totalCost.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                            <Terminal size={16} className="text-green-500" />
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Tasks Pendientes</p>
                    </div>
                    <p className="text-2xl font-serif">{recentTasks.filter(t => t.status === 'pending' || t.status === 'running').length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center space-x-4 mb-6">
                {(['agents', 'tasks', 'logs'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}
                    >
                        {tab === 'agents' ? 'Agentes' : tab === 'tasks' ? 'Tareas' : 'Logs'}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'agents' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {agents.map(agent => (
                        <div key={agent.id} className="p-6 bg-card border border-border rounded-2xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-12 h-12 ${getStatusBg(agent.status)} rounded-xl flex items-center justify-center`}>
                                        <Users size={20} className={getStatusColor(agent.status)} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{agent.name}</h3>
                                        <span className={`text-xs font-medium ${getStatusColor(agent.status)}`}>
                                            {agent.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toggleAgent(agent.id)}
                                    className={`p-2 rounded-lg transition-colors ${agent.status === 'online' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                                >
                                    {agent.status === 'online' ? <Pause size={16} /> : <Play size={16} />}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                <div>
                                    <p className="text-xs text-muted-foreground">Runs hoy</p>
                                    <p className="text-lg font-serif">{agent.runsToday}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Costo hoy</p>
                                    <p className="text-lg font-serif">${agent.costToday.toFixed(2)}</p>
                                </div>
                            </div>
                            {agent.lastHeartbeat && (
                                <p className="text-xs text-muted-foreground mt-3">
                                    Último heartbeat: {new Date(agent.lastHeartbeat).toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Agente</th>
                                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Prompt</th>
                                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Estado</th>
                                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Costo</th>
                                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Duración</th>
                                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTasks.map(task => (
                                <tr key={task.id} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">
                                            {task.agentId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm max-w-xs truncate">{task.prompt}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold uppercase ${getTaskStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm">{task.cost ? `$${task.cost.toFixed(3)}` : '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm">{task.duration ? `${task.duration}s` : '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(task.createdAt).toLocaleTimeString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-card border border-border rounded-2xl p-6 font-mono text-sm">
                    <div className="space-y-2">
                        {[
                            `[${new Date().toISOString()}] INFO: Paperclip system initialized`,
                            `[${new Date().toISOString()}] INFO: Agent pelayo connected`,
                            `[${new Date().toISOString()}] INFO: Agent centurion connected`,
                            `[${new Date().toISOString()}] INFO: 3 agents online`,
                            `[${new Date().toISOString()}] TASK: New task assigned to pelayo`,
                            `[${new Date().toISOString()}] COMPLETED: Task pelayo-1234 in 1.2s`,
                        ].map((log, i) => (
                            <p key={i} className="text-muted-foreground">{log}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}