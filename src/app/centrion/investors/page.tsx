"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Search,
    Loader2,
    AlertCircle,
    CheckCircle,
    Sparkles,
    ExternalLink,
    RefreshCw,
    ChevronRight,
    Shield,
    TrendingUp,
    User,
    Building2,
    Target,
    MessageSquare,
    Clock,
    Zap,
    Brain
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { PIEDRAS_PRECIOSAS, INVESTOR_TYPES, type InvestorClassification } from "@/lib/investor-personality";

type InvestorWithClassification = {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    company_name?: string;
    investor_type?: string;
    ticket_size?: string;
    budget_min?: number;
    budget_max?: number;
    piedra_personalidad?: string;
    disc_profile?: string;
    risk_profile?: string;
    created_at?: string;
    classification_data?: InvestorClassification;
};

const PIEDRA_COLORS: Record<string, string> = {
    ZAFIRO: "from-blue-400 to-blue-600",
    PERLA: "from-purple-400 to-purple-600",
    ESMERALDA: "from-green-400 to-green-600",
    RUBI: "from-red-400 to-red-600"
};

const PIEDRA_EMOJI: Record<string, string> = {
    ZAFIRO: "💎",
    PERLA: "🔮",
    ESMERALDA: "💚",
    RUBI: "❤️"
};

const DISC_COLORS: Record<string, string> = {
    D: "bg-red-500/10 text-red-500 border-red-500/20",
    I: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    S: "bg-green-500/10 text-green-500 border-green-500/20",
    C: "bg-blue-500/10 text-blue-500 border-blue-500/20"
};

const DISC_LABELS: Record<string, string> = {
    D: "Dominancia",
    I: "Influencia",
    S: "Estabilidad",
    C: "Cumplimiento"
};

export default function InvestorClassificationPage() {
    const router = useRouter();
    const [investors, setInvestors] = useState<InvestorWithClassification[]>([]);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedInvestor, setSelectedInvestor] = useState<InvestorWithClassification | null>(null);
    const [classifying, setClassifying] = useState(false);
    const [classificationResult, setClassificationResult] = useState<InvestorClassification | null>(null);
    const [filterPiedra, setFilterPiedra] = useState<string>("all");
    const [showClassificationModal, setShowClassificationModal] = useState(false);
    const [classificationForm, setClassificationForm] = useState({
        communicationStyle: "",
        budgetMin: 0,
        budgetMax: 0,
        notes: ""
    });

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('insforge_token');
            if (!token) {
                router.push('/login');
                return;
            }
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                router.push('/login');
                return;
            }
            setAuthChecked(true);
        };
        checkAuth();
    }, [router]);

    const fetchInvestors = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch('/api/investors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setInvestors(data.investors || []);
        } catch (error) {
            console.error('Error fetching investors:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authChecked) fetchInvestors();
    }, [authChecked]);

    const classifyInvestor = async () => {
        if (!selectedInvestor) return;
        setClassifying(true);

        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch('/api/classify-investor', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    investorId: selectedInvestor.id,
                    name: selectedInvestor.full_name,
                    company: selectedInvestor.company_name,
                    email: selectedInvestor.email,
                    communicationStyle: classificationForm.communicationStyle,
                    budgetMin: classificationForm.budgetMin,
                    budgetMax: classificationForm.budgetMax
                })
            });
            const data = await res.json();
            if (data.classification) {
                setClassificationResult(data.classification);
                setInvestors(prev => prev.map(inv => 
                    inv.id === selectedInvestor.id 
                        ? { ...inv, ...data.classification, classification_data: data.classification }
                        : inv
                ));
            }
        } catch (error) {
            console.error('Error classifying investor:', error);
        } finally {
            setClassifying(false);
        }
    };

    const triggerOSINT = async (investor: InvestorWithClassification) => {
        const token = localStorage.getItem('insforge_token');
        try {
            await fetch('/api/classify-investor', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    investorId: investor.id,
                    name: investor.full_name,
                    company: investor.company_name,
                    email: investor.email,
                    triggerOSINT: true
                })
            });
            alert('OSINT triggered. The profile will be enriched automatically.');
        } catch (error) {
            console.error('Error triggering OSINT:', error);
        }
    };

    const filteredInvestors = investors.filter(inv => {
        const matchesSearch = !searchTerm || 
            inv.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPiedra = filterPiedra === "all" || inv.piedra_personalidad === filterPiedra;
        return matchesSearch && matchesPiedra;
    });

    const classifiedCount = investors.filter(i => i.piedra_personalidad).length;
    const unclassifiedCount = investors.length - classifiedCount;

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
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-500/10 rounded-xl">
                            <Brain className="text-amber-500" size={24} />
                        </div>
                        <h1 className="text-2xl font-serif font-medium">Clasificación de Inversores</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Sistema de personalidad Piedras Preciosas + DISC — Alea Signature
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-card rounded-2xl border border-border/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={18} className="text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Total</span>
                        </div>
                        <p className="text-2xl font-bold">{investors.length}</p>
                    </div>
                    <div className="bg-card rounded-2xl border border-border/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span className="text-sm text-muted-foreground">Clasificados</span>
                        </div>
                        <p className="text-2xl font-bold text-green-500">{classifiedCount}</p>
                    </div>
                    <div className="bg-card rounded-2xl border border-border/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={18} className="text-yellow-500" />
                            <span className="text-sm text-muted-foreground">Sin clasificar</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-500">{unclassifiedCount}</p>
                    </div>
                    <div className="bg-card rounded-2xl border border-border/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={18} className="text-purple-500" />
                            <span className="text-sm text-muted-foreground">Confidence avg</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-500">
                            {classificationResult?.confidence 
                                ? `${Math.round(classificationResult.confidence * 100)}%`
                                : '—'}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, empresa o email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-card border border-border/50 rounded-xl text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        {["all", "ZAFIRO", "PERLA", "ESMERALDA", "RUBI"].map(piedra => (
                            <button
                                key={piedra}
                                onClick={() => setFilterPiedra(piedra)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                    filterPiedra === piedra
                                        ? piedra === "all" ? "bg-primary text-primary-foreground" : `bg-gradient-to-r ${PIEDRA_COLORS[piedra]} text-white`
                                        : "bg-muted hover:bg-muted/80"
                                }`}
                            >
                                {piedra === "all" ? "Todos" : `${PIEDRA_EMOJI[piedra]} ${piedra}`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Investor List */}
                    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50 bg-muted/30">
                            <h2 className="font-medium flex items-center gap-2">
                                <Users size={18} />
                                Inversores ({filteredInvestors.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Cargando...</p>
                                </div>
                            ) : filteredInvestors.length === 0 ? (
                                <div className="p-8 text-center">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">No hay inversores</p>
                                </div>
                            ) : (
                                filteredInvestors.map(investor => (
                                    <div
                                        key={investor.id}
                                        onClick={() => {
                                            setSelectedInvestor(investor);
                                            setClassificationResult(investor.classification_data || null);
                                        }}
                                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                                            selectedInvestor?.id === investor.id ? 'bg-primary/5' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {investor.piedra_personalidad ? (
                                                    <span className={`text-lg bg-gradient-to-br ${PIEDRA_COLORS[investor.piedra_personalidad]} text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm`}>
                                                        {PIEDRA_EMOJI[investor.piedra_personalidad]}
                                                    </span>
                                                ) : (
                                                    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
                                                        ?
                                                    </span>
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm">{investor.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">{investor.company_name || '—'}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-muted-foreground" />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            {investor.piedra_personalidad && (
                                                <span className="px-2 py-0.5 bg-muted rounded-full">
                                                    {investor.piedra_personalidad}
                                                </span>
                                            )}
                                            {investor.disc_profile && (
                                                <span className={`px-2 py-0.5 rounded-full border ${DISC_COLORS[investor.disc_profile] || 'bg-muted'}`}>
                                                    {investor.disc_profile}
                                                </span>
                                            )}
                                            {investor.investor_type && (
                                                <span className="px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                                                    {investor.investor_type.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Detail Panel */}
                    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50 bg-muted/30">
                            <h2 className="font-medium flex items-center gap-2">
                                <Target size={18} />
                                Perfil de Clasificación
                            </h2>
                        </div>
                        <div className="p-6">
                            {!selectedInvestor ? (
                                <div className="text-center py-12">
                                    <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                                    <p className="text-muted-foreground">Selecciona un inversor para ver su clasificación</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Investor Info */}
                                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                                        {selectedInvestor.piedra_personalidad ? (
                                            <span className={`text-3xl bg-gradient-to-br ${PIEDRA_COLORS[selectedInvestor.piedra_personalidad]} text-white w-14 h-14 rounded-xl flex items-center justify-center font-bold`}>
                                                {PIEDRA_EMOJI[selectedInvestor.piedra_personalidad]}
                                            </span>
                                        ) : (
                                            <span className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl">?</span>
                                        )}
                                        <div>
                                            <p className="font-medium text-lg">{selectedInvestor.full_name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedInvestor.company_name || '—'}</p>
                                            <p className="text-xs text-muted-foreground">{selectedInvestor.email}</p>
                                        </div>
                                    </div>

                                    {/* Classification Result */}
                                    {classificationResult ? (
                                        <div className="space-y-4">
                                            {/* Primary Stone */}
                                            <div className={`p-4 rounded-xl bg-gradient-to-r ${PIEDRA_COLORS[classificationResult.piedraPrimaria]} text-white`}>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-3xl">{PIEDRA_EMOJI[classificationResult.piedraPrimaria]}</span>
                                                    <div>
                                                        <p className="font-bold text-lg">{classificationResult.piedraPrimaria}</p>
                                                        <p className="text-sm opacity-80">{PIEDRAS_PRECIOSAS[classificationResult.piedraPrimaria].description}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* DISC */}
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${DISC_COLORS[classificationResult.discProfile]}`}>
                                                    {classificationResult.discProfile} — {DISC_LABELS[classificationResult.discProfile]}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Confidence: {Math.round((classificationResult.confidence || 0) * 100)}%
                                                </span>
                                            </div>

                                            {/* Info Grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                                                    <p className="text-sm font-medium">
                                                        {INVESTOR_TYPES[classificationResult.investorType]?.name || classificationResult.investorType}
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <p className="text-xs text-muted-foreground mb-1">Risk</p>
                                                    <p className="text-sm font-medium capitalize">{classificationResult.riskProfile}</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <p className="text-xs text-muted-foreground mb-1">Budget</p>
                                                    <p className="text-sm font-medium">
                                                        {classificationResult.budgetRange.min / 1000000}M€ — {classificationResult.budgetRange.max / 1000000}M€
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <p className="text-xs text-muted-foreground mb-1">Decision Time</p>
                                                    <p className="text-sm font-medium">{classificationResult.estimatedDecisionTime}</p>
                                                </div>
                                            </div>

                                            {/* Closing Strategy */}
                                            <div className="p-4 bg-muted/50 rounded-xl">
                                                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                                    <TrendingUp size={14} />
                                                    Estrategia de Cierre
                                                </p>
                                                <ul className="space-y-1">
                                                    {classificationResult.closingStrategy.map((strategy, i) => (
                                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                            <span className="text-primary">•</span>
                                                            {strategy}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Follow Up Priority */}
                                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={16} className="text-muted-foreground" />
                                                    <span className="text-sm">Follow-up Priority</span>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    classificationResult.followUpPriority === 'high' ? 'bg-red-500/10 text-red-500' :
                                                    classificationResult.followUpPriority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-green-500/10 text-green-500'
                                                }`}>
                                                    {classificationResult.followUpPriority.toUpperCase()}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => setShowClassificationModal(true)}
                                                    className="flex-1 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                                                >
                                                    <RefreshCw size={14} />
                                                    Re-clasificar
                                                </button>
                                                <button
                                                    onClick={() => triggerOSINT(selectedInvestor)}
                                                    className="flex-1 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                                                >
                                                    <Zap size={14} />
                                                    OSINT
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
                                            <p className="text-muted-foreground mb-4">Este inversor aún no ha sido clasificado</p>
                                            <button
                                                onClick={() => setShowClassificationModal(true)}
                                                className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-2 mx-auto"
                                            >
                                                <Sparkles size={16} />
                                                Clasificar Ahora
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Classification Modal */}
                <AnimatePresence>
                    {showClassificationModal && selectedInvestor && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                            onClick={() => setShowClassificationModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-card rounded-2xl border border-border/50 w-full max-w-lg p-6"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                    <Brain size={20} className="text-amber-500" />
                                    Clasificar: {selectedInvestor.full_name}
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-muted-foreground mb-1 block">
                                            Estilo de comunicación observado
                                        </label>
                                        <input
                                            type="text"
                                            value={classificationForm.communicationStyle}
                                            onChange={e => setClassificationForm(prev => ({ ...prev, communicationStyle: e.target.value }))}
                                            placeholder="Ej: Detail oriented, fast decisions, analytical..."
                                            className="w-full px-4 py-2 bg-muted rounded-xl text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Palabras clave: rápido, detalle, ayudar, sociable
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-muted-foreground mb-1 block">
                                                Budget mínimo (€)
                                            </label>
                                            <input
                                                type="number"
                                                value={classificationForm.budgetMin}
                                                onChange={e => setClassificationForm(prev => ({ ...prev, budgetMin: parseInt(e.target.value) || 0 }))}
                                                placeholder="500000"
                                                className="w-full px-4 py-2 bg-muted rounded-xl text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-muted-foreground mb-1 block">
                                                Budget máximo (€)
                                            </label>
                                            <input
                                                type="number"
                                                value={classificationForm.budgetMax}
                                                onChange={e => setClassificationForm(prev => ({ ...prev, budgetMax: parseInt(e.target.value) || 0 }))}
                                                placeholder="2000000"
                                                className="w-full px-4 py-2 bg-muted rounded-xl text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-muted-foreground mb-1 block">
                                            Notas adicionales
                                        </label>
                                        <textarea
                                            value={classificationForm.notes}
                                            onChange={e => setClassificationForm(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="Observaciones sobre el inversor..."
                                            rows={3}
                                            className="w-full px-4 py-2 bg-muted rounded-xl text-sm resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowClassificationModal(false)}
                                        className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => {
                                            classifyInvestor();
                                            setShowClassificationModal(false);
                                        }}
                                        disabled={classifying}
                                        className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {classifying ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Clasificando...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={14} />
                                                Clasificar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
