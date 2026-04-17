"use client";

import { useEffect, useState } from "react";
import { Webhook, Plus, Search, Trash2, RefreshCw, Loader2, CheckCircle, AlertCircle, Edit2, Copy, ExternalLink } from "lucide-react";

interface WebhookConfig {
    id: string;
    name: string;
    url: string;
    events: string[];
    active: boolean;
    lastTrigger?: string;
    successCount: number;
    errorCount: number;
}

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        setWebhooks([
            { 
                id: '1', 
                name: 'Resend Email Webhook', 
                url: 'https://if8rkq6j.insforge.app/api/webhook/email',
                events: ['email.received'],
                active: true,
                lastTrigger: new Date().toISOString(),
                successCount: 147,
                errorCount: 2
            },
            { 
                id: '2', 
                name: 'Pelayo Notification Webhook', 
                url: 'https://if8rkq6j.insforge.app/api/webhook/pelayo',
                events: ['notification.created'],
                active: true,
                successCount: 89,
                errorCount: 0
            },
            { 
                id: '3', 
                name: 'Storage Upload Webhook', 
                url: 'https://if8rkq6j.insforge.app/api/webhook/storage',
                events: ['file.uploaded'],
                active: false,
                successCount: 23,
                errorCount: 1
            },
        ]);
        setLoading(false);
    }, []);

    const filteredWebhooks = webhooks.filter(w => 
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggle = (id: string) => {
        setWebhooks(prev => prev.map(w => 
            w.id === id ? { ...w, active: !w.active } : w
        ));
    };

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
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
                    <h1 className="text-2xl font-serif font-medium">Webhooks & Integrations</h1>
                    <p className="text-sm text-muted-foreground mt-1">Configurar y monitorizar webhooks del sistema</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition-all">
                    <Plus size={18} />
                    <span className="text-sm font-medium">Nuevo Webhook</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Webhooks</p>
                    <p className="text-2xl font-serif">{webhooks.length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Activos</p>
                    <p className="text-2xl font-serif text-green-500">{webhooks.filter(w => w.active).length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Disparos Éxito</p>
                    <p className="text-2xl font-serif">{webhooks.reduce((acc, w) => acc + w.successCount, 0)}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Errores</p>
                    <p className="text-2xl font-serif text-red-500">{webhooks.reduce((acc, w) => acc + w.errorCount, 0)}</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 max-w-md flex items-center space-x-2 bg-card border border-border rounded-xl px-4 py-2">
                    <Search size={18} className="text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Buscar webhooks..." 
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-all">
                    <RefreshCw size={18} />
                    <span className="text-sm">Sincronizar</span>
                </button>
            </div>

            {/* Webhooks List */}
            <div className="space-y-4">
                {filteredWebhooks.map(webhook => (
                    <div key={webhook.id} className="p-6 bg-card border border-border rounded-2xl">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${webhook.active ? 'bg-green-500/10' : 'bg-muted'}`}>
                                    {webhook.active ? (
                                        <CheckCircle size={24} className="text-green-500" />
                                    ) : (
                                        <Webhook size={24} className="text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium mb-1">{webhook.name}</h3>
                                    <div className="flex items-center space-x-2">
                                        <code className="text-xs bg-muted px-2 py-1 rounded">{webhook.url}</code>
                                        <button 
                                            onClick={() => handleCopy(webhook.url)}
                                            className="p-1 hover:bg-muted rounded transition-colors"
                                        >
                                            <Copy size={14} className="text-muted-foreground" />
                                        </button>
                                        <a 
                                            href={webhook.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 hover:bg-muted rounded transition-colors"
                                        >
                                            <ExternalLink size={14} className="text-muted-foreground" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button 
                                    onClick={() => handleToggle(webhook.id)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${webhook.active ? 'bg-green-500' : 'bg-muted'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${webhook.active ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-4">
                            <div className="flex items-center space-x-2">
                                {webhook.events.map(event => (
                                    <span key={event} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">
                                        {event}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <div className="flex items-center space-x-6">
                                <div>
                                    <p className="text-xs text-muted-foreground">Último disparo</p>
                                    <p className="text-sm font-medium">
                                        {webhook.lastTrigger ? new Date(webhook.lastTrigger).toLocaleString('es-ES') : 'Nunca'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Éxitos</p>
                                    <p className="text-sm font-medium text-green-500">{webhook.successCount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Errores</p>
                                    <p className="text-sm font-medium text-red-500">{webhook.errorCount}</p>
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
            </div>

            {filteredWebhooks.length === 0 && (
                <div className="text-center py-12">
                    <Webhook size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No se encontraron webhooks</p>
                </div>
            )}
        </div>
    );
}