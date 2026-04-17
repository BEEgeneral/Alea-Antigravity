"use client";

import { useEffect, useState } from "react";
import { Activity, Brain, Zap, RefreshCw, Settings, CheckCircle, AlertCircle, Loader2, TrendingUp } from "lucide-react";

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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        // Mock data for AI services
        setAiServices([
            { name: 'MiniMax - Text Analysis', status: 'active', provider: 'MiniMax', lastUsed: new Date().toISOString(), requestsToday: 147, avgResponseTime: '1.2s' },
            { name: 'MiniMax - Vision', status: 'active', provider: 'MiniMax', lastUsed: new Date().toISOString(), requestsToday: 23, avgResponseTime: '2.1s' },
            { name: 'Pelayo Chat', status: 'active', provider: 'MiniMax', lastUsed: new Date().toISOString(), requestsToday: 89, avgResponseTime: '0.8s' },
            { name: 'Email Parser', status: 'active', provider: 'MiniMax', lastUsed: new Date().toISOString(), requestsToday: 12, avgResponseTime: '3.5s' },
            { name: 'PDF Analyzer', status: 'active', provider: 'MiniMax', lastUsed: new Date().toISOString(), requestsToday: 8, avgResponseTime: '4.2s' },
        ]);
        setLoading(false);
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setRefreshing(false);
    };

    const totalRequests = aiServices.reduce((acc, s) => acc + s.requestsToday, 0);

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
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                            <CheckCircle size={20} className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Estado General</p>
                            <p className="text-lg font-serif font-medium text-green-500">Operativo</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Todos los servicios activos</p>
                </div>
                <div className="p-6 bg-card border border-border rounded-2xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Brain size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Servicios Activos</p>
                            <p className="text-lg font-serif font-medium">{aiServices.filter(s => s.status === 'active').length}/{aiServices.length}</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Modelos en uso</p>
                </div>
                <div className="p-6 bg-card border border-border rounded-2xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <Zap size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Solicitudes Hoy</p>
                            <p className="text-lg font-serif font-medium">{totalRequests}</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">+23% vs ayer</p>
                </div>
                <div className="p-6 bg-card border border-border rounded-2xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Tiempo Medio</p>
                            <p className="text-lg font-serif font-medium">1.8s</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Respuesta promedio</p>
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