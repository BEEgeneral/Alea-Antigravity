"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Shield, CheckCircle, XCircle,
    UserPlus, AlertCircle, Loader2,
    User, ChevronLeft
} from "lucide-react";
import Link from "next/link";

interface UserProfile {
    id: string;
    role: string;
    is_active: boolean;
    is_approved: boolean;
    email: string;
    name: string;
    created_at: string;
}

interface InviteForm {
    email: string;
    name: string;
    role: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState('agent');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [inviteError, setInviteError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/auth/users');
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (e) {
            console.error('Error fetching users:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvitations = async () => {
        // No longer needed — invitations are now immediate user creations
    };

    const handleRevoke = async (id: string) => {
        try {
            const res = await fetch('/api/auth/users/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id })
            });
            if (res.ok) {
                setUsers(users.map(u =>
                    u.id === id ? { ...u, is_active: false } : u
                ));
            }
        } catch (e) {
            console.error('Error revoking user:', e);
        }
    };

    const handleActivate = async (id: string) => {
        try {
            const res = await fetch('/api/auth/users/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id })
            });
            if (res.ok) {
                setUsers(users.map(u =>
                    u.id === id ? { ...u, is_active: true } : u
                ));
            }
        } catch (e) {
            console.error('Error activating user:', e);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setInviteLoading(true);
        setInviteError(null);
        setInviteSuccess(null);

        try {
            const res = await fetch('/api/auth/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
            });
            const data = await res.json();

            if (!res.ok) {
                setInviteError(data.error || 'Error al crear usuario');
                return;
            }

            setInviteSuccess(`Usuario creado: ${data.email}. Se han enviado las credenciales a su email.`);
            setInviteEmail('');
            setInviteName('');
            setInviteRole('agent');
            fetchUsers();
        } catch (e) {
            setInviteError('Error de conexión');
        } finally {
            setInviteLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/praetorium" className="flex items-center text-muted-foreground hover:text-foreground mb-4 text-sm">
                        <ChevronLeft size={16} className="mr-1" />
                        Volver al Dashboard
                    </Link>
                    <h2 className="text-2xl font-serif">Gestión de Usuarios</h2>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'users' 
                                ? 'bg-foreground text-background' 
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Users size={16} className="inline mr-2" />
                        Usuarios
                    </button>
                    <button
                        onClick={() => setActiveTab('invitations')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'invitations'
                                ? 'bg-foreground text-background'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <UserPlus size={16} className="inline mr-2" />
                        Crear Agente
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'users' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden">
                            <div className="p-6 border-b border-border/50">
                                <h3 className="font-medium">Usuarios Registrados ({users.length})</h3>
                            </div>
                            <div className="divide-y divide-border/50">
                                {users.map((user) => (
                                    <div key={user.id} className="p-6 flex items-center justify-between hover:bg-muted/20 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                <User size={18} className="text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">{user.name || 'Sin nombre'}</span>
                                                    {user.role === 'admin' && (
                                                        <Shield size={14} className="text-primary" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                user.role === 'admin' ? 'bg-primary/20 text-primary' :
                                                user.role === 'agent' ? 'bg-blue-500/20 text-blue-500' :
                                                'bg-emerald-500/20 text-emerald-500'
                                            }`}>
                                                {user.role === 'admin' ? 'Admin' : 
                                                 user.role === 'agent' ? 'Agente' : 'Inversor'}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                                                user.is_active 
                                                    ? 'bg-emerald-500/20 text-emerald-500' 
                                                    : 'bg-red-500/20 text-red-500'
                                            }`}>
                                                {user.is_active ? (
                                                    <><CheckCircle size={12} className="mr-1" /> Activo</>
                                                ) : (
                                                    <><XCircle size={12} className="mr-1" /> Revocado</>
                                                )}
                                            </span>
                                            {user.role !== 'admin' && (
                                                <div className="flex items-center space-x-2">
                                                    {user.is_active ? (
                                                        <button
                                                            onClick={() => handleRevoke(user.id)}
                                                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500"
                                                            title="Revocar acceso"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleActivate(user.id)}
                                                            className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors text-emerald-500"
                                                            title="Activar acceso"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {users.length === 0 && (
                                    <div className="p-12 text-center text-muted-foreground">
                                        No hay usuarios registrados
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'invitations' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-medium">Crear Nuevo Agente</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">Se enviarán las credenciales de acceso al email indicado.</p>
                                </div>
                            </div>
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-black text-white/40 block mb-1.5">Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={inviteName}
                                            onChange={(e) => setInviteName(e.target.value)}
                                            placeholder="Ej: María García"
                                            className="w-full bg-muted/30 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-black text-white/40 block mb-1.5">Email *</label>
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="email@ejemplo.com"
                                            className="w-full bg-muted/30 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-black text-white/40 block mb-1.5">Rol</label>
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            className="w-full bg-muted/30 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 appearance-none"
                                        >
                                            <option value="agent">Agente</option>
                                            <option value="collaborator">Colaborador</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={inviteLoading}
                                        className="bg-foreground text-background px-6 py-3 rounded-xl font-medium flex items-center space-x-2 hover:-translate-y-0.5 transition-transform disabled:opacity-50"
                                    >
                                        {inviteLoading ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <><UserPlus size={18} /><span>Crear y Enviar Credenciales</span></>
                                        )}
                                    </button>
                                </div>
                            </form>
                            {inviteError && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center">
                                    <AlertCircle size={16} className="mr-2 shrink-0" />
                                    {inviteError}
                                </div>
                            )}
                            {inviteSuccess && (
                                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm flex items-center">
                                    <CheckCircle size={16} className="mr-2 shrink-0" />
                                    {inviteSuccess}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}