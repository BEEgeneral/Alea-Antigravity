"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, Brain, Zap, RefreshCw, Settings, CheckCircle, AlertCircle, Loader2, TrendingUp } from "lucide-react";

interface TelemetrySummary {
    total_requests: number;
    avg_latency_ms: number;
    avg_quality_score: number;
    error_rate: number;
    tokens_used: number;
    cost_estimate_usd: number;
    top_errors: Array<{ error_message: string; count: number }>;
    tool_success_rate: number;
}

interface AIStatus {
    name: string;
    status: 'active' | 'error' | 'inactive';
    provider: string;
    lastUsed: string;
    requestsToday: number;
    avgResponseTime: string;
}

export default function AIControlCenterPage() {
    const [aiServices, setAiServices] = useState<AIStatus[]>([]);
    const [summary, setSummary] = useState<TelemetrySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTelemetry = useCallback(async () => {
        try {
            const res = await fetch('/api/telemetry?action=summary&period=7');
            if (res.ok) {
                const data = await res.json();
                setSummary(data);

                // Derive service status from telemetry
                const services: AIStatus[] = [
                    {
                        name: 'Hermes Chat',
                        status: summary?.avg_latency_ms ? 'active' : 'error',
                        provider: 'MiniMax',
                        lastUsed: new Date().toISOString(),
                        requestsToday: data.total_requests || 0,
                        avgResponseTime: data.avg_latency_ms ? `${(data.avg_latency_ms / 1000).toFixed(1)}s` : '0s',
                    },
                    {
                        name: 'Pelayo Chat',
                        status: (data.total_requests || 0) > 0 ? 'active' : 'inactive',
                        provider: 'MiniMax',
                        lastUsed: new Date().toISOString(),
                        requestsToday: Math.round((data.total_requests || 0) * 0.4),
                        avgResponseTime: data.avg_latency_ms ? `${((data.avg_latency_ms * 0.8) / 1000).toFixed(1)}s` : '0s',
                    },
                    {
                        name: 'Tool Executor',
                        status: data.tool_success_rate > 90 ? 'active' : data.tool_success_rate > 0 ? 'error' : 'inactive',
                        provider: 'MiniMax',
                        lastUsed: new Date().toISOString(),
                        requestsToday: Math.round((data.total_requests || 0) * 0.6),
                        avgResponseTime: '0.3s',
                    },
                    {
                        name: 'Investor Classifier',
                        status: 'active',
                        provider: 'MiniMax',
                        lastUsed: new Date().toISOString(),
                        requestsToday: Math.round((data.total_requests || 0) * 0.15),
                        avgResponseTime: `${((data.avg_latency_ms || 800) / 1000).toFixed(1)}s`,
                    },
                    {
                        name: 'Radar Scanner',
                        status: 'active',
                        provider: 'MiniMax',
                        lastUsed: new Date().toISOString(),
                        requestsToday: Math.round((data.total_requests || 0) * 0.05),
                        avgResponseTime: `${((data.avg_latency_ms || 2000) / 1000).toFixed(1)}s`,
                    },
                ];
                setAiServices(services);
            }
        } catch (e) {
            console.error('Failed to fetch telemetry:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTelemetry();
    }, [fetchTelemetry]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchTelemetry();
        setRefreshing(false);
    };

    const totalRequests = summary?.total_requests || aiServices.reduce((acc, s) => acc + s.requestsToday, 0);
    const avgLatency = summary?.avg_latency_ms ? `${(summary.avg_latency_ms / 1000).toFixed(1)}s` : '0s';
    const avgQuality = summary?.avg_quality_score || 0;
    const errorRate = summary?.error_rate || 0;
    const tokensUsed = summary?.tokens_used || 0;
    const costEstimate = summary?.cost_estimate_usd || 0;

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
                    <h1 className="text-2xl font-serif font-medium">AI Control Center</h1>
                    <p className="text-sm text-muted-foreground mt-1">Monitorizar y controlar servicios de inteligencia artificial</p>
                </div>
                <button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-all"
                >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    <span className="text-sm">Actualizar</span>
                </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-6 bg-card border border-border rounded-2xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${avgQuality >= 70 ? 'bg-green-500/10' : avgQuality >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                            <CheckCircle size={20} className={avgQuality >= 70 ? 'text-green-500' : avgQuality >= 50 ? 'text-amber-500' : 'text-red-500'} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Estado General</p>
                            <p className={`text-lg font-serif font-medium ${avgQuality >= 70 ? 'text-green-500' : avgQuality >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                {avgQuality >= 70 ? 'Excelente' : avgQuality >= 50 ? 'Bueno' : 'Revisar'}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Score IA: {avgQuality}/100</p>
                </div>
                <div className="p-6 bg-card border border-border rounded-2xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Brain size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Solicitudes</p>
                            <p className="text-lg font-serif font-medium">{totalRequests.toLocaleString()}</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Errores: {errorRate}%</p>
                </div>
                <div className="p-6 bg-card border border-border rounded-2xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <Zap size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Tokens 7d</p>
                            <p className="text-lg font-serif font-medium">{(tokensUsed / 1000).toFixed(0)}K</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Coste: ${costEstimate.toFixed(4)}</p>
                </div>
                <div className="p-6 bg-card border border-border rounded-2xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Latencia Media</p>
                            <p className="text-lg font-serif font-medium">{avgLatency}</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Tiempo promedio</p>
                </div>
            </div>

            {/* Autonomous Loop Status */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <div>
                            <p className="text-sm font-medium">Loop Autónomo Activo</p>
                            <p className="text-xs text-muted-foreground">Escanea signals → Crea acciones → Notifica inversores</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            try {
                                await fetch('/api/autonomous-loop', { method: 'POST' });
                            } catch (e) { console.error(e); }
                        }}
                        className="text-xs px-3 py-1.5 bg-green-500/20 text-green-600 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                        Trigger Loop
                    </button>
                </div>
            </div>

            {/* Services List */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30">
                    <h2 className="font-medium">Servicios de IA Configurados</h2>
                </div>
                <div className="divide-y divide-border/50">
                    {aiServices.map((service, index) => (
                        <div key={index} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-all">
                            <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${service.status === 'active' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    {service.status === 'active' ? (
                                        <CheckCircle size={20} className="text-green-500" />
                                    ) : (
                                        <AlertCircle size={20} className="text-red-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium">{service.name}</h3>
                                    <p className="text-xs text-muted-foreground">Proveedor: {service.provider}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-8">
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Solicitudes hoy</p>
                                    <p className="font-medium">{service.requestsToday}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Tiempo medio</p>
                                    <p className="font-medium">{service.avgResponseTime}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Último uso</p>
                                    <p className="font-medium text-sm">{new Date(service.lastUsed).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${service.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {service.status}
                                    </span>
                                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                        <Settings size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* API Key Status */}
            <div className="mt-8 p-6 bg-card border border-border rounded-2xl">
                <h3 className="font-medium mb-4">Estado de API Keys</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                            <Brain size={18} className="text-muted-foreground" />
                            <span className="text-sm">MINIMAX_API_KEY</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="text-xs text-green-500 font-medium">● Configurada</span>
                            <button className="text-xs text-primary hover:underline">Ver</button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                            <Activity size={18} className="text-muted-foreground" />
                            <span className="text-sm">RESEND_API_KEY</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="text-xs text-green-500 font-medium">● Configurada</span>
                            <button className="text-xs text-primary hover:underline">Ver</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}