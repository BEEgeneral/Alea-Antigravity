"use client";

import { useEffect, useState } from "react";
import { Mail, Bell, Search, CheckCircle, XCircle, Eye, Loader2, RefreshCw } from "lucide-react";

interface EmailSuggestion {
    id: string;
    original_email_subject: string;
    sender_email: string;
    extracted_data: any;
    ai_interpretation: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export default function EmailsPage() {
    const [suggestions, setSuggestions] = useState<EmailSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSuggestion, setSelectedSuggestion] = useState<EmailSuggestion | null>(null);

    const fetchSuggestions = async () => {
        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch('/api/iai-inbox', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.suggestions || []);
            } else {
                setSuggestions([
                    { id: '1', original_email_subject: 'Oportunidad de Inversión - Chueca', sender_email: 'test@example.com', extracted_data: { title: 'Chueca Project', price: 1800000 }, ai_interpretation: 'Inversor interesado en property', status: 'pending', created_at: new Date().toISOString() },
                    { id: '2', original_email_subject: ' property en venta', sender_email: 'vendor@test.com', extracted_data: { title: 'Palacio Gran Vía', price: 4500000 }, ai_interpretation: 'Nuevo lead property', status: 'approved', created_at: new Date().toISOString() },
                    { id: '3', original_email_subject: 'Contacto Mandatario', sender_email: 'mandatario@test.com', extracted_data: { title: 'Mandatario Legal', price: 0 }, ai_interpretation: 'Nuevo mandatado', status: 'rejected', created_at: new Date().toISOString() },
                ]);
            }
        } catch (err) {
            console.error('Error fetching suggestions:', err);
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch('/api/imap-polling');
            await fetchSuggestions();
        } catch (err) {
            console.error('Error syncing:', err);
        } finally {
            setSyncing(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch(`/api/iai-inbox/${id}/approve`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
            }
        } catch (err) {
            console.error('Error approving:', err);
        }
    };

    const handleReject = async (id: string) => {
        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch(`/api/iai-inbox/${id}/reject`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' } : s));
            }
        } catch (err) {
            console.error('Error rejecting:', err);
        }
    };

    const filteredSuggestions = suggestions.filter(s => {
        const matchesFilter = filter === 'all' || s.status === filter;
        const matchesSearch = s.original_email_subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.sender_email?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-medium">Email Intelligence (IAI)</h1>
                    <p className="text-sm text-muted-foreground mt-1">Bandeja de entrada de sugerencias de IA</p>
                </div>
                <button 
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                    <span className="text-sm">{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                    <p className="text-2xl font-serif">{suggestions.length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pendientes</p>
                    <p className="text-2xl font-serif text-amber-500">{suggestions.filter(s => s.status === 'pending').length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Aprobados</p>
                    <p className="text-2xl font-serif text-green-500">{suggestions.filter(s => s.status === 'approved').length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rechazados</p>
                    <p className="text-2xl font-serif text-red-500">{suggestions.filter(s => s.status === 'rejected').length}</p>
                </div>
            </div>

            <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 max-w-md flex items-center space-x-2 bg-card border border-border rounded-xl px-4 py-2">
                    <Search size={18} className="text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Buscar emails..." 
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}
                        >
                            {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filteredSuggestions.map(suggestion => (
                    <div key={suggestion.id} className="p-6 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${suggestion.status === 'pending' ? 'bg-amber-500/10' : suggestion.status === 'approved' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    {suggestion.status === 'pending' ? (
                                        <Bell size={20} className="text-amber-500" />
                                    ) : suggestion.status === 'approved' ? (
                                        <CheckCircle size={20} className="text-green-500" />
                                    ) : (
                                        <XCircle size={20} className="text-red-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium mb-1">{suggestion.original_email_subject || 'Sin asunto'}</h3>
                                    <p className="text-sm text-muted-foreground mb-2">De: {suggestion.sender_email}</p>
                                    {suggestion.extracted_data?.title && (
                                        <p className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full inline-block">
                                            Detectado: {suggestion.extracted_data.title}
                                        </p>
                                    )}
                                    {suggestion.ai_interpretation && (
                                        <p className="text-sm text-muted-foreground mt-2 italic">"{suggestion.ai_interpretation}"</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                                    suggestion.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                    suggestion.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                    'bg-red-500/10 text-red-500'
                                }`}>
                                    {suggestion.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                            <p className="text-xs text-muted-foreground">
                                Recibido: {new Date(suggestion.created_at).toLocaleString('es-ES')}
                            </p>
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={() => setSelectedSuggestion(suggestion)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-all text-sm"
                                >
                                    <Eye size={16} />
                                    <span>Ver</span>
                                </button>
                                {suggestion.status === 'pending' && (
                                    <>
                                        <button 
                                            onClick={() => handleApprove(suggestion.id)}
                                            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all text-sm"
                                        >
                                            <CheckCircle size={16} />
                                            <span>Aprobar</span>
                                        </button>
                                        <button 
                                            onClick={() => handleReject(suggestion.id)}
                                            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all text-sm"
                                        >
                                            <XCircle size={16} />
                                            <span>Rechazar</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredSuggestions.length === 0 && (
                <div className="text-center py-12">
                    <Mail size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No se encontraron sugerencias</p>
                </div>
            )}

            {selectedSuggestion && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-50 flex items-center justify-center p-8">
                    <div className="bg-card border border-border rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-serif text-xl">Detalle de Email</h2>
                            <button onClick={() => setSelectedSuggestion(null)} className="p-2 hover:bg-muted rounded-xl">
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wider">Asunto</label>
                                <p className="font-medium">{selectedSuggestion.original_email_subject}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wider">Remitente</label>
                                <p>{selectedSuggestion.sender_email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wider">Datos Extraídos</label>
                                <pre className="p-4 bg-muted rounded-xl text-sm overflow-x-auto">
                                    {JSON.stringify(selectedSuggestion.extracted_data, null, 2)}
                                </pre>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wider">Interpretación IA</label>
                                <p className="p-4 bg-muted rounded-xl">{selectedSuggestion.ai_interpretation}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}