"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Search, Shield, CheckCircle, XCircle, MoreHorizontal, Loader2, Network } from "lucide-react";
import AddAgentModal from "@/components/admin/modals/AddAgentModal";
import InvestorPropertyGraph from "@/components/admin/InvestorPropertyGraph";

interface Agent {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_approved: boolean;
    has_centurion_access: boolean;
    created_at: string;
}

interface AgentForm {
    full_name: string;
    email: string;
    role: string;
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showGraph, setShowGraph] = useState(false);
    const [addForm, setAddForm] = useState<AgentForm>({ full_name: '', email: '', role: 'agent' });
    const [addError, setAddError] = useState<string | null>(null);
    const [addLoading, setAddLoading] = useState(false);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const token = localStorage.getItem('insforge_token');
                const res = await fetch('/api/agents', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    setAgents(data.agents || []);
                } else {
                    // Fallback: fetch from user_profiles
                    const profileRes = await fetch('/api/admin/agents', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        setAgents(profileData.agents || []);
                    }
                }
            } catch (err) {
                console.error('Error fetching agents:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAgents();
    }, []);

    const handleApprove = async (id: string) => {
        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch(`/api/admin/agents/${id}/approve`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setAgents(prev => prev.map(a => a.id === id ? { ...a, is_approved: true } : a));
            }
        } catch (err) {
            console.error('Error approving agent:', err);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres rechazar este agente?')) return;

        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch(`/api/admin/agents/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setAgents(prev => prev.filter(a => a.id !== id));
            }
        } catch (err) {
            console.error('Error rejecting agent:', err);
        }
    };

    const handleAddAgent = async () => {
        if (!addForm.full_name || !addForm.email) {
            setAddError('Nombre y email son obligatorios');
            return;
        }
        setAddLoading(true);
        setAddError(null);
        try {
            const token = localStorage.getItem('insforge_token');
            const res = await fetch('/api/admin/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(addForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error creando agente');
            setAgents(prev => [...prev, data.agent]);
            setShowAddModal(false);
            setAddForm({ full_name: '', email: '', role: 'agent' });
        } catch (err: any) {
            setAddError(err.message);
        } finally {
            setAddLoading(false);
        }
    };

    const filteredAgents = agents.filter(agent => {
        const matchesSearch = agent.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            agent.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || 
                            (filter === 'pending' && !agent.is_approved) ||
                            (filter === 'approved' && agent.is_approved);
        return matchesSearch && matchesFilter;
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
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-medium">Control de Agentes</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gestionar usuarios, agentes y permisos del sistema</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowGraph(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20 rounded-xl hover:bg-[#c5a059]/20 transition-all text-sm font-medium"
                    >
                        <Network size={16} />
                        <span>Red Inversor↔Activos</span>
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition-all"
                    >
                        <Plus size={18} />
                        <span className="text-sm font-medium">Nuevo Agente</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 max-w-md flex items-center space-x-2 bg-card border border-border rounded-xl px-4 py-2">
                    <Search size={18} className="text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Buscar agentes..." 
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}
                    >
                        Todos ({agents.length})
                    </button>
                    <button 
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'pending' ? 'bg-amber-500 text-white' : 'bg-muted hover:bg-muted/80'}`}
                    >
                        Pendientes ({agents.filter(a => !a.is_approved).length})
                    </button>
                    <button 
                        onClick={() => setFilter('approved')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'approved' ? 'bg-green-500 text-white' : 'bg-muted hover:bg-muted/80'}`}
                    >
                        Aprobados ({agents.filter(a => a.is_approved).length})
                    </button>
                </div>
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgents.map(agent => (
                    <div key={agent.id} className="p-6 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-serif text-lg">
                                    {agent.full_name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-medium">{agent.full_name || 'Sin nombre'}</h3>
                                        {agent.role === 'admin' && (
                                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-bold rounded-md uppercase">
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{agent.email}</p>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <MoreHorizontal size={16} className="text-muted-foreground" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <div className="flex items-center space-x-2">
                                {agent.is_approved ? (
                                    <span className="flex items-center space-x-1 text-xs text-green-500">
                                        <CheckCircle size={14} />
                                        <span>Aprobado</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center space-x-1 text-xs text-amber-500">
                                        <XCircle size={14} />
                                        <span>Pendiente</span>
                                    </span>
                                )}
                            </div>
                            {!agent.is_approved ? (
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={() => handleApprove(agent.id)}
                                        className="px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-all"
                                    >
                                        Aprobar
                                    </button>
                                    <button 
                                        onClick={() => handleReject(agent.id)}
                                        className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-all"
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-1">
                                    {agent.has_centurion_access && (
                                        <span className="flex items-center space-x-1 px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-bold uppercase">
                                            <Shield size={12} />
                                            <span>Centurión</span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredAgents.length === 0 && (
                <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No se encontraron agentes</p>
                </div>
            )}

            {/* Add Agent Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-[#111] border border-[#c5a059]/20 rounded-3xl shadow-2xl p-8 w-full max-w-md">
                        <h2 className="font-serif text-xl text-[#c5a059] mb-1">Dar de Alta Agente</h2>
                        <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-6 italic">Registro manual de nuevo miembro del equipo</p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase tracking-widest font-black text-white/40 block mb-1.5 px-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Alberto Gala"
                                    value={addForm.full_name}
                                    onChange={e => setAddForm(p => ({ ...p, full_name: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#c5a059]/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-widest font-black text-white/40 block mb-1.5 px-1">Email Profesional</label>
                                <input
                                    type="email"
                                    placeholder="correo@aleasignature.com"
                                    value={addForm.email}
                                    onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#c5a059]/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-widest font-black text-white/40 block mb-1.5 px-1">Rol Asignado</label>
                                <select
                                    value={addForm.role}
                                    onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#c5a059]/50 transition-all appearance-none"
                                >
                                    <option value="agent">Agente</option>
                                    <option value="admin">Administrador</option>
                                    <option value="collaborator">Colaborador</option>
                                </select>
                            </div>
                        </div>
                        {addError && <p className="mt-3 text-xs text-red-400">{addError}</p>}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddAgent}
                                disabled={addLoading}
                                className="flex-1 px-4 py-2.5 bg-[#c5a059] text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                {addLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Confirmar Alta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Investor-Property Graph */}
            <InvestorPropertyGraph isOpen={showGraph} onClose={() => setShowGraph(false)} />
        </div>
    );
}