'use client';

import { useState, useEffect } from 'react';
import { 
    Bot, Play, Pause, Settings, Users, Activity, 
    Clock, DollarSign, AlertCircle, CheckCircle, 
    Loader2, RefreshCw, Terminal, MessageSquare
} from 'lucide-react';

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

export default function PaperclipDashboard() {
    const [agents, setAgents] = useState<Agent[]>([
        { id: 'pelayo', name: 'Pelayo', status: 'online', runsToday: 23, costToday: 1.45 },
        { id: 'centurion', name: 'Centurion', status: 'online', runsToday: 12, costToday: 0.89 },
        { id: 'aleai_iai', name: 'Alea IAI', status: 'sleeping', lastHeartbeat: '2026-04-10T22:00:00Z', runsToday: 45, costToday: 2.10 },
    ]);
    const [recentTasks, setRecentTasks] = useState<Task[]>([
        { id: '1', agentId: 'pelayo', status: 'completed', prompt: 'Show Madrid hotels to juan@ejemplo.com', cost: 0.05, duration: 12, createdAt: '2026-04-11T10:30:00Z' },
        { id: '2', agentId: 'centurion', status: 'completed', prompt: 'Enrich lead: Carlos Ruiz', cost: 0.08, duration: 25, createdAt: '2026-04-11T10:15:00Z' },
        { id: '3', agentId: 'pelayo', status: 'running', prompt: 'Calculate Vp for Palacio Gran Via', createdAt: '2026-04-11T10:32:00Z' },
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
            case 'online': return 'bg-emerald-500/10 border-emerald-500/30';
            case 'busy': return 'bg-amber-500/10 border-amber-500/30';
            case 'sleeping': return 'bg-blue-500/10 border-blue-500/30';
            case 'offline': return 'bg-gray-500/10 border-gray-500/30';
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const totalCost = agents.reduce((sum, a) => sum + a.costToday, 0);
    const totalRuns = agents.reduce((sum, a) => sum + a.runsToday, 0);

    return (
        <div className="max-w-7xl mx-auto w-full p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-serif font-medium flex items-center gap-3">
                        <Bot className="w-8 h-8 text-primary" />
                        Paperclip Control Center
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Orchestration de AI Agents - Alea Signature
                    </p>
                </div>
                <button
                    onClick={() => setIsLoading(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-2"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Agents Online</p>
                            <p className="text-3xl font-serif mt-1">
                                {agents.filter(a => a.status !== 'offline').length}/{agents.length}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Bot className="w-6 h-6 text-emerald-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Runs Today</p>
                            <p className="text-3xl font-serif mt-1">{totalRuns}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Cost Today</p>
                            <p className="text-3xl font-serif mt-1">€{totalCost.toFixed(2)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-amber-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Active Tasks</p>
                            <p className="text-3xl font-serif mt-1">
                                {recentTasks.filter(t => t.status === 'running').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Terminal className="w-6 h-6 text-purple-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-border">
                <button
                    onClick={() => setActiveTab('agents')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'agents' 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Bot className="w-4 h-4 inline mr-2" />
                    Agents
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'tasks' 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Terminal className="w-4 h-4 inline mr-2" />
                    Tasks
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'logs' 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Activity className="w-4 h-4 inline mr-2" />
                    Logs
                </button>
            </div>

            {activeTab === 'agents' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {agents.map(agent => (
                        <div 
                            key={agent.id}
                            className={`bg-card border rounded-2xl p-6 transition-all cursor-pointer hover:border-primary/30 ${
                                selectedAgent === agent.id ? 'border-primary/50' : 'border-border'
                            }`}
                            onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        agent.id === 'pelayo' ? 'bg-emerald-500/10' :
                                        agent.id === 'centurion' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                                    }`}>
                                        <Bot className={`w-5 h-5 ${
                                            agent.id === 'pelayo' ? 'text-emerald-500' :
                                            agent.id === 'centurion' ? 'text-blue-500' : 'text-purple-500'
                                        }`} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{agent.name}</h3>
                                        <p className="text-xs text-muted-foreground capitalize">{agent.id}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                    agent.status === 'online' ? 'bg-emerald-500/10 text-emerald-500' :
                                    agent.status === 'busy' ? 'bg-amber-500/10 text-amber-500' :
                                    agent.status === 'sleeping' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-gray-500/10 text-gray-400'
                                }`}>
                                    {agent.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs">Runs Today</p>
                                    <p className="font-medium">{agent.runsToday}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Cost Today</p>
                                    <p className="font-medium">€{agent.costToday.toFixed(2)}</p>
                                </div>
                            </div>

                            {agent.lastHeartbeat && (
                                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                                    <Clock size={12} />
                                    Last heartbeat: {formatDate(agent.lastHeartbeat)}
                                </p>
                            )}

                            {selectedAgent === agent.id && (
                                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                                    <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                                        <Play size={12} />
                                        Run Task
                                    </button>
                                    <button className="flex-1 px-3 py-2 bg-muted rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                                        <Settings size={12} />
                                        Config
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className="space-y-4">
                    {recentTasks.map(task => (
                        <div key={task.id} className="bg-card border border-border rounded-2xl p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                                            {task.agentId}
                                        </span>
                                        <span className={`flex items-center gap-1 text-xs ${
                                            task.status === 'completed' ? 'text-emerald-500' :
                                            task.status === 'running' ? 'text-amber-500' :
                                            task.status === 'failed' ? 'text-red-500' :
                                            'text-gray-400'
                                        }`}>
                                            {task.status === 'completed' && <CheckCircle size={12} />}
                                            {task.status === 'running' && <Loader2 size={12} className="animate-spin" />}
                                            {task.status === 'failed' && <AlertCircle size={12} />}
                                            {task.status}
                                        </span>
                                    </div>
                                    <p className="text-sm">{task.prompt}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {formatDate(task.createdAt)}
                                    </p>
                                </div>
                                <div className="text-right text-sm">
                                    {task.cost && <p className="text-muted-foreground">€{task.cost.toFixed(2)}</p>}
                                    {task.duration && <p className="text-xs text-muted-foreground">{task.duration}s</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-card border border-border rounded-2xl p-4 font-mono text-xs">
                    <div className="space-y-1">
                        <p className="text-muted-foreground">[10:32:00] pelayo: Task started - Calculate Vp for Palacio Gran Via</p>
                        <p className="text-muted-foreground">[10:32:01] pelayo: Loading investor memory...</p>
                        <p className="text-muted-foreground">[10:32:02] pelayo: Query InsForge for property data...</p>
                        <p className="text-emerald-500">[10:32:05] pelayo: Task completed - Cost: €0.03</p>
                        <p className="text-muted-foreground">[10:30:00] centurion: Task started - Enrich lead Carlos Ruiz</p>
                        <p className="text-blue-500">[10:30:25] centurion: Task completed - 3 contacts found</p>
                    </div>
                </div>
            )}

            {/* Org Chart */}
            <div className="mt-8 bg-card border border-border rounded-2xl p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Users size={18} className="text-primary" />
                    Org Chart - Alea Signature
                </h3>
                <div className="flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">👤</span>
                        </div>
                        <p className="font-medium">CEO</p>
                        <p className="text-xs text-muted-foreground">Alberto Gala</p>
                    </div>
                </div>
                <div className="flex justify-center mt-4">
                    <div className="w-px h-8 bg-border" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                            <Bot className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="font-medium text-sm">Pelayo</p>
                        <p className="text-xs text-muted-foreground">Sales Agent</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                            <Bot className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="font-medium text-sm">Centurion</p>
                        <p className="text-xs text-muted-foreground">Lead Intel</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                            <Bot className="w-6 h-6 text-purple-500" />
                        </div>
                        <p className="font-medium text-sm">Alea IAI</p>
                        <p className="text-xs text-muted-foreground">Email Inbox</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
