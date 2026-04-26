"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Loader2,
    AlertCircle,
    CheckCircle,
    ExternalLink,
    RefreshCw,
    ChevronRight,
    X,
    Globe,
    Link,
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Calendar,
    Sparkles,
    Shield,
    Zap,
    Eye,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";

type Profile = {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    company_name?: string;
    job_title?: string;
    location?: string;
    linkedin_url?: string;
    twitter_url?: string;
    website_url?: string;
    scrape_status?: 'pending' | 'running' | 'completed' | 'failed';
    personality_summary?: string;
    scrape_data?: any;
    created_at?: string;
    updated_at?: string;
};

export default function CenturionOSINTPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [scrapeModalOpen, setScrapeModalOpen] = useState(false);
    const [scrapeForm, setScrapeForm] = useState({ name: "", company: "", email: "" });
    const [scrapeLoading, setScrapeLoading] = useState(false);
    const [scrapeStatus, setScrapeStatus] = useState<Record<string, string>>({});
    const [filterStatus, setFilterStatus] = useState<string>("all");

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

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch('/api/centurion', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setProfiles(data.profiles || []);
        } catch (error) {
            console.error('Error fetching profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authChecked) fetchProfiles();
    }, [authChecked]);

    const triggerScrape = async () => {
        if (!scrapeForm.name) return;
        setScrapeLoading(true);

        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch('/api/centurion-scrape', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: scrapeForm.name,
                    company: scrapeForm.company,
                    email: scrapeForm.email
                })
            });
            const data = await res.json();

            if (data.jobId) {
                setScrapeStatus(prev => ({ ...prev, [scrapeForm.name]: 'running' }));
                pollScrapeStatus(data.jobId, scrapeForm.name);
            }

            setScrapeModalOpen(false);
            setScrapeForm({ name: "", company: "", email: "" });
            fetchProfiles();
        } catch (error) {
            console.error('Error triggering scrape:', error);
        } finally {
            setScrapeLoading(false);
        }
    };

    const pollScrapeStatus = async (jobId: string, name: string) => {
        const checkStatus = async () => {
            try {
                const token = localStorage.getItem('insforge_token');
                const res = await fetch(`/api/centurion-scrape?jobId=${jobId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.status === 'completed') {
                    setScrapeStatus(prev => ({ ...prev, [name]: 'completed' }));
                    fetchProfiles();
                } else if (data.status === 'failed') {
                    setScrapeStatus(prev => ({ ...prev, [name]: 'failed' }));
                } else {
                    setTimeout(checkStatus, 5000);
                }
            } catch (error) {
                console.error('Error polling status:', error);
            }
        };
        checkStatus();
    };

    const filteredProfiles = profiles.filter(p => {
        const matchesSearch = !searchTerm || 
            p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || p.scrape_status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        all: profiles.length,
        pending: profiles.filter(p => p.scrape_status === 'pending').length,
        running: profiles.filter(p => p.scrape_status === 'running').length,
        completed: profiles.filter(p => p.scrape_status === 'completed').length,
        failed: profiles.filter(p => p.scrape_status === 'failed').length
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 size={16} className="text-green-500" />;
            case 'running':
                return <Loader2 size={16} className="text-blue-500 animate-spin" />;
            case 'failed':
                return <XCircle size={16} className="text-red-500" />;
            case 'pending':
                return <Clock size={16} className="text-yellow-500" />;
            default:
                return <AlertCircle size={16} className="text-muted-foreground" />;
        }
    };

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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <Shield className="text-purple-500" size={24} />
                            </div>
                            <h1 className="text-2xl font-serif font-medium">Centurion OSINT</h1>
                        </div>
                        <button
                            onClick={() => setScrapeModalOpen(true)}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-2"
                        >
                            <Zap size={16} />
                            New Scan
                        </button>
                    </div>
                    <p className="text-muted-foreground">
                        Web intelligence gathering — LinkedIn, Twitter, web presence, personality analysis
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-4 mb-8">
                    {[
                        { key: 'all', label: 'Total', icon: Globe, color: 'text-muted-foreground' },
                        { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-500' },
                        { key: 'running', label: 'Running', icon: Loader2, color: 'text-blue-500' },
                        { key: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-500' },
                        { key: 'failed', label: 'Failed', icon: XCircle, color: 'text-red-500' }
                    ].map(({ key, label, icon: Icon, color }) => (
                        <div 
                            key={key}
                            onClick={() => setFilterStatus(key)}
                            className={`bg-card rounded-2xl border border-border/50 p-4 cursor-pointer transition-all hover:border-primary/30 ${
                                filterStatus === key ? 'border-primary/50 bg-primary/5' : ''
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Icon size={16} className={color} />
                                <span className="text-xs text-muted-foreground">{label}</span>
                            </div>
                            <p className="text-2xl font-bold">{statusCounts[key as keyof typeof statusCounts]}</p>
                        </div>
                    ))}
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
                    <button
                        onClick={fetchProfiles}
                        className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm flex items-center gap-2"
                    >
                        <RefreshCw size={14} />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profile List */}
                    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50 bg-muted/30">
                            <h2 className="font-medium flex items-center gap-2">
                                <Globe size={18} />
                                Profiles ({filteredProfiles.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Cargando...</p>
                                </div>
                            ) : filteredProfiles.length === 0 ? (
                                <div className="p-8 text-center">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">No hay perfiles</p>
                                </div>
                            ) : (
                                filteredProfiles.map(profile => (
                                    <div
                                        key={profile.id}
                                        onClick={() => setSelectedProfile(profile)}
                                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                                            selectedProfile?.id === profile.id ? 'bg-primary/5' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                    <User size={18} className="text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{profile.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">{profile.job_title || profile.company_name || '—'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(profile.scrape_status)}
                                                <ChevronRight size={16} className="text-muted-foreground" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs flex-wrap">
                                            {profile.linkedin_url && (
                                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full flex items-center gap-1">
                                                    <Link size={10} /> LinkedIn
                                                </span>
                                            )}
                                            {profile.twitter_url && (
                                                <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 rounded-full flex items-center gap-1">
                                                    <X size={10} /> Twitter
                                                </span>
                                            )}
                                            {profile.website_url && (
                                                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full flex items-center gap-1">
                                                    <Globe size={10} /> Web
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
                                <Eye size={18} />
                                Profile Details
                            </h2>
                        </div>
                        <div className="p-6">
                            {!selectedProfile ? (
                                <div className="text-center py-12">
                                    <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                                    <p className="text-muted-foreground">Selecciona un perfil para ver detalles</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Status Banner */}
                                    <div className={`p-4 rounded-xl flex items-center justify-between ${
                                        selectedProfile.scrape_status === 'completed' ? 'bg-green-500/10' :
                                        selectedProfile.scrape_status === 'running' ? 'bg-blue-500/10' :
                                        selectedProfile.scrape_status === 'failed' ? 'bg-red-500/10' :
                                        'bg-yellow-500/10'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(selectedProfile.scrape_status)}
                                            <span className="text-sm font-medium capitalize">
                                                {selectedProfile.scrape_status || 'Unknown'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setScrapeForm({
                                                    name: selectedProfile.full_name,
                                                    company: selectedProfile.company_name || "",
                                                    email: selectedProfile.email || ""
                                                });
                                                setScrapeModalOpen(true);
                                            }}
                                            className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-medium flex items-center gap-1"
                                        >
                                            <RefreshCw size={12} />
                                            Re-scan
                                        </button>
                                    </div>

                                    {/* Basic Info */}
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                                                <User size={32} className="text-muted-foreground" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-medium">{selectedProfile.full_name}</h3>
                                                {selectedProfile.job_title && (
                                                    <p className="text-sm text-muted-foreground">{selectedProfile.job_title}</p>
                                                )}
                                                {selectedProfile.company_name && (
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Building2 size={12} /> {selectedProfile.company_name}
                                                    </p>
                                                )}
                                                {selectedProfile.location && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <MapPin size={12} /> {selectedProfile.location}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Contact */}
                                        <div className="grid grid-cols-1 gap-2">
                                            {selectedProfile.email && (
                                                <a href={`mailto:${selectedProfile.email}`} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                                    <Mail size={14} className="text-muted-foreground" />
                                                    <span className="text-sm">{selectedProfile.email}</span>
                                                </a>
                                            )}
                                            {selectedProfile.phone && (
                                                <a href={`tel:${selectedProfile.phone}`} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                                    <Phone size={14} className="text-muted-foreground" />
                                                    <span className="text-sm">{selectedProfile.phone}</span>
                                                </a>
                                            )}
                                        </div>

                                        {/* Social Links */}
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProfile.linkedin_url && (
                                                <a href={selectedProfile.linkedin_url} target="_blank" rel="noopener noreferrer" 
                                                   className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-500/20 transition-colors">
                                                    <Link size={14} /> LinkedIn
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                            {selectedProfile.twitter_url && (
                                                <a href={selectedProfile.twitter_url} target="_blank" rel="noopener noreferrer"
                                                   className="px-4 py-2 bg-sky-500/10 text-sky-500 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-sky-500/20 transition-colors">
                                                    <X size={14} /> Twitter
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                            {selectedProfile.website_url && (
                                                <a href={selectedProfile.website_url} target="_blank" rel="noopener noreferrer"
                                                   className="px-4 py-2 bg-green-500/10 text-green-500 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-green-500/20 transition-colors">
                                                    <Globe size={14} /> Website
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>

                                        {/* Personality Summary */}
                                        {selectedProfile.personality_summary && (
                                            <div className="p-4 bg-muted/50 rounded-xl">
                                                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                    <Sparkles size={12} /> Personality Analysis
                                                </p>
                                                <p className="text-sm">{selectedProfile.personality_summary}</p>
                                            </div>
                                        )}

                                        {/* Timestamps */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            {selectedProfile.created_at && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    Created: {new Date(selectedProfile.created_at).toLocaleDateString()}
                                                </span>
                                            )}
                                            {selectedProfile.updated_at && (
                                                <span className="flex items-center gap-1">
                                                    <RefreshCw size={12} />
                                                    Updated: {new Date(selectedProfile.updated_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scrape Modal */}
                <AnimatePresence>
                    {scrapeModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                            onClick={() => setScrapeModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-card rounded-2xl border border-border/50 w-full max-w-md p-6"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                    <Shield className="text-purple-500" size={20} />
                                    OSINT Scan
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-muted-foreground mb-1 block">Nombre completo *</label>
                                        <input
                                            type="text"
                                            value={scrapeForm.name}
                                            onChange={e => setScrapeForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Juan García López"
                                            className="w-full px-4 py-2 bg-muted rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-muted-foreground mb-1 block">Empresa</label>
                                        <input
                                            type="text"
                                            value={scrapeForm.company}
                                            onChange={e => setScrapeForm(prev => ({ ...prev, company: e.target.value }))}
                                            placeholder="Family Office Madrid"
                                            className="w-full px-4 py-2 bg-muted rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                                        <input
                                            type="email"
                                            value={scrapeForm.email}
                                            onChange={e => setScrapeForm(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="juan@familyoffice.es"
                                            className="w-full px-4 py-2 bg-muted rounded-xl text-sm"
                                        />
                                    </div>

                                    <div className="p-4 bg-muted/50 rounded-xl">
                                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                            <Globe size={12} /> ¿Qué haremos?
                                        </p>
                                        <ul className="space-y-1 text-xs text-muted-foreground">
                                            <li>• Búsqueda en LinkedIn, Twitter, web</li>
                                            <li>• Detección de presencia online</li>
                                            <li>• Análisis de personalidad</li>
                                            <li>• Extracción de datos de contacto</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setScrapeModalOpen(false)}
                                        className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={triggerScrape}
                                        disabled={!scrapeForm.name || scrapeLoading}
                                        className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {scrapeLoading ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Scanning...
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={14} />
                                                Scan
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
