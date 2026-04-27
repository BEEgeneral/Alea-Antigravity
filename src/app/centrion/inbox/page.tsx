"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mail,
    CheckCircle,
    XCircle,
    AlertCircle,
    Building2,
    User,
    TrendingUp,
    Eye,
    Plus,
    ChevronLeft,
    RefreshCw,
    Loader2,
    ArrowRight,
    Sparkles
} from "lucide-react";
import Navbar from "@/components/Navbar";

type SuggestionType = 'property' | 'investor' | 'lead' | 'mandatario' | 'collaborator';
type SuggestionStatus = 'pending' | 'approved' | 'rejected';

interface IAISuggestion {
    id: string;
    suggestion_type: SuggestionType;
    status: SuggestionStatus;
    original_email_subject: string;
    original_email_body?: string;
    sender_email: string;
    ai_interpretation?: string;
    extracted_data?: Record<string, any>;
    created_at: string;
}

const TYPE_ICONS: Record<SuggestionType, React.ReactNode> = {
    property: <Building2 size={18} />,
    investor: <User size={18} />,
    lead: <TrendingUp size={18} />,
    mandatario: <User size={18} />,
    collaborator: <User size={18} />,
};

const STATUS_COLORS: Record<SuggestionStatus, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function IAIMboxPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [suggestions, setSuggestions] = useState<IAISuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSuggestion, setSelectedSuggestion] = useState<IAISuggestion | null>(null);
    const [interpreting, setInterpreting] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("pending");
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/login');
            return;
        }
        if (status === "authenticated") {
            setAuthChecked(true);
        }
    }, [status, router]);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('insforge_token');
            const params = new URLSearchParams();
            if (filterStatus !== 'all') params.set('status', filterStatus);
            params.set('limit', '50');

            const res = await fetch(`/api/iai-inbox?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setSuggestions(data.suggestions || []);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authChecked) fetchSuggestions();
    }, [authChecked, filterStatus]);

    const interpretEmail = async (suggestion: IAISuggestion) => {
        setInterpreting(suggestion.id);
        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch('/api/interpret-email', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    suggestion_id: suggestion.id,
                    email_body: suggestion.original_email_body || '',
                    email_subject: suggestion.original_email_subject,
                    sender_email: suggestion.sender_email,
                })
            });
            const data = await res.json();
            if (data.interpretation) {
                setSuggestions(prev => prev.map(s =>
                    s.id === suggestion.id
                        ? { ...s, ai_interpretation: data.interpretation }
                        : s
                ));
                if (selectedSuggestion?.id === suggestion.id) {
                    setSelectedSuggestion(prev => prev ? { ...prev, ai_interpretation: data.interpretation } : null);
                }
            }
        } catch (error) {
            console.error('Error interpreting email:', error);
        } finally {
            setInterpreting(null);
        }
    };

    const updateStatus = async (id: string, status: SuggestionStatus) => {
        setActionLoading(id);
        try {
            const token = localStorage.getItem('insforge_token');
            await fetch(`/api/iai-inbox/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            await fetchSuggestions();
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const createToCRM = async (suggestion: IAISuggestion, action: 'create_lead' | 'create_property' | 'create_investor') => {
        setActionLoading(suggestion.id);
        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch(`/api/iai-inbox/${suggestion.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Creado: ${action} → ID: ${data[action.replace('create_', '')]?.id}`);
                setSelectedSuggestion(null);
                await fetchSuggestions();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creating to CRM:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const pendingCount = suggestions.filter(s => s.status === 'pending').length;

    if (!authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <Sparkles className="text-purple-500" size={24} />
                            </div>
                            <h1 className="text-2xl font-serif font-medium">IAI Inbox</h1>
                            {pendingCount > 0 && (
                                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-medium">
                                    {pendingCount} pendientes
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground">
                            Email Intelligence — Analiza emails y crea registros CRM automáticamente
                        </p>
                    </div>
                    <button
                        onClick={fetchSuggestions}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        Refrescar
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    {['all', 'pending', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                filterStatus === status
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                            }`}
                        >
                            {status === 'all' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Suggestions List */}
                    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50 bg-muted/30">
                            <h2 className="font-medium flex items-center gap-2">
                                <Mail size={18} />
                                Sugerencias ({suggestions.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Cargando...</p>
                                </div>
                            ) : suggestions.length === 0 ? (
                                <div className="p-8 text-center">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">No hay sugerencias</p>
                                </div>
                            ) : (
                                suggestions.map(suggestion => (
                                    <div
                                        key={suggestion.id}
                                        onClick={() => setSelectedSuggestion(suggestion)}
                                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                                            selectedSuggestion?.id === suggestion.id ? 'bg-primary/5' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`p-1.5 rounded-lg border ${STATUS_COLORS[suggestion.status]}`}>
                                                    {TYPE_ICONS[suggestion.suggestion_type]}
                                                </span>
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {suggestion.suggestion_type}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(suggestion.created_at).toLocaleDateString('es-ES')}
                                            </span>
                                        </div>
                                        <h3 className="font-medium text-sm mb-1 line-clamp-1">
                                            {suggestion.original_email_subject || '(Sin asunto)'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {suggestion.sender_email}
                                        </p>
                                        {suggestion.ai_interpretation && (
                                            <div className="mt-2 p-2 bg-muted/50 rounded-lg text-xs">
                                                <p className="line-clamp-2">{suggestion.ai_interpretation}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Detail Panel */}
                    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50 bg-muted/30">
                            <h2 className="font-medium flex items-center gap-2">
                                <Eye size={18} />
                                Detalle
                            </h2>
                        </div>
                        <div className="p-6">
                            {!selectedSuggestion ? (
                                <div className="text-center py-12">
                                    <Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                                    <p className="text-muted-foreground">Selecciona una sugerencia para ver detalles</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Status Badge */}
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[selectedSuggestion.status]}`}>
                                            {selectedSuggestion.status.toUpperCase()}
                                        </span>
                                        <span className="text-sm text-muted-foreground capitalize">
                                            {selectedSuggestion.suggestion_type}
                                        </span>
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase tracking-wider">Asunto</label>
                                        <p className="font-medium">{selectedSuggestion.original_email_subject || '(Sin asunto)'}</p>
                                    </div>

                                    {/* Sender */}
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase tracking-wider">Remitente</label>
                                        <p className="text-sm">{selectedSuggestion.sender_email}</p>
                                    </div>

                                    {/* AI Interpretation */}
                                    {selectedSuggestion.ai_interpretation ? (
                                        <div>
                                            <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-2">
                                                <Sparkles size={12} />
                                                Interpretación IA
                                            </label>
                                            <div className="p-4 bg-muted/50 rounded-xl text-sm whitespace-pre-wrap">
                                                {selectedSuggestion.ai_interpretation}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-muted/50 rounded-xl text-center">
                                            <p className="text-sm text-muted-foreground mb-3">
                                                Esta sugerencia aún no ha sido interpretada por IA
                                            </p>
                                            <button
                                                onClick={() => interpretEmail(selectedSuggestion)}
                                                disabled={interpreting === selectedSuggestion.id}
                                                className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-xl text-sm font-medium flex items-center gap-2 mx-auto"
                                            >
                                                {interpreting === selectedSuggestion.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Sparkles size={16} />
                                                )}
                                                Analizar con IA
                                            </button>
                                        </div>
                                    )}

                                    {/* Extracted Data */}
                                    {selectedSuggestion.extracted_data && Object.keys(selectedSuggestion.extracted_data).length > 0 && (
                                        <div>
                                            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                                                Datos Extraídos
                                            </label>
                                            <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                                                {Object.entries(selectedSuggestion.extracted_data).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">{key}:</span>
                                                        <span className="font-medium">{String(value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {selectedSuggestion.status === 'pending' && (
                                        <div className="pt-4 border-t border-border/50 space-y-3">
                                            <p className="text-sm font-medium mb-3">Acciones Rápidas</p>
                                            
                                            <button
                                                onClick={() => updateStatus(selectedSuggestion.id, 'approved')}
                                                disabled={actionLoading === selectedSuggestion.id}
                                                className="w-full flex items-center justify-between px-4 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-xl transition-colors disabled:opacity-50"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <CheckCircle size={18} />
                                                    Aprobar
                                                </span>
                                                <ArrowRight size={16} />
                                            </button>

                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => createToCRM(selectedSuggestion, 'create_lead')}
                                                    disabled={actionLoading === selectedSuggestion.id}
                                                    className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                                                >
                                                    <Plus size={14} />
                                                    Lead
                                                </button>
                                                <button
                                                    onClick={() => createToCRM(selectedSuggestion, 'create_property')}
                                                    disabled={actionLoading === selectedSuggestion.id}
                                                    className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-xl text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                                                >
                                                    <Plus size={14} />
                                                    Property
                                                </button>
                                                <button
                                                    onClick={() => createToCRM(selectedSuggestion, 'create_investor')}
                                                    disabled={actionLoading === selectedSuggestion.id}
                                                    className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                                                >
                                                    <Plus size={14} />
                                                    Investor
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => updateStatus(selectedSuggestion.id, 'rejected')}
                                                disabled={actionLoading === selectedSuggestion.id}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-medium disabled:opacity-50"
                                            >
                                                <XCircle size={16} />
                                                Rechazar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
