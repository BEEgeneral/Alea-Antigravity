'use client';

import { useEffect, useState, useCallback } from 'react';
import { Shield, Users, AlertCircle, Loader2, Check, X, RefreshCw } from 'lucide-react';
import { Agent } from '@/types/admin';

const ALEA_GOLD = '#c5a059';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('insforge_token');
      if (!token) throw new Error('No token found. Please authenticate.');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_INSFORGE_APP_URL || 'https://if8rkq6j.eu-central.insforge.app'}/rest/v1/agents?select=*`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: process.env.NEXT_PUBLIC_INSFORGE_API_KEY || '',
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const handleToggleAdmin = async (agent: Agent) => {
    const newVal = !agent.is_admin;
    setTogglingId(agent.id);
    // Optimistic
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, is_admin: newVal } : a));
    try {
      const token = localStorage.getItem('insforge_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_INSFORGE_APP_URL || 'https://if8rkq6j.eu-central.insforge.app'}/rest/v1/agents?id=eq.${agent.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: process.env.NEXT_PUBLIC_INSFORGE_API_KEY || '',
            'Content-Type': 'application/json',
            Prefer: 'representation',
          },
          body: JSON.stringify({ is_admin: newVal }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      // Revert
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, is_admin: !newVal } : a));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield size={28} className="text-primary" />
          <div>
            <h1 className="text-2xl font-serif font-medium text-primary">Control de Agentes</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Activa o desactiva el acceso administrativo por agente
            </p>
          </div>
        </div>
        <button
          onClick={fetchAgents}
          className="flex items-center gap-2 px-3 py-1.5 text-xs border border-border/50 rounded-lg hover:bg-card transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-md">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Total</p>
          <p className="text-2xl font-serif text-primary">{agents.length}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Administradores</p>
          <p className="text-2xl font-serif text-emerald-400">{agents.filter(a => a.is_admin).length}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Sin acceso</p>
          <p className="text-2xl font-serif text-amber-400">{agents.filter(a => !a.is_admin).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/50 text-[10px] uppercase tracking-widest text-muted-foreground">
          <div className="col-span-4">Nombre</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-2">Rol</div>
          <div className="col-span-2 text-right pr-4">Admin</div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 size={24} className="animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Cargando agentes...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
            <p className="text-xs text-red-400 mb-3">{error}</p>
            <button onClick={fetchAgents} className="text-xs text-primary underline">Reintentar</button>
          </div>
        ) : agents.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={32} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No hay agentes registrados</p>
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/30 hover:bg-foreground/[0.02] transition-colors items-center"
            >
              <div className="col-span-4">
                <p className="text-sm font-medium text-foreground">{agent.full_name || 'Sin nombre'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">ID: {agent.id.slice(0, 8)}...</p>
              </div>
              <div className="col-span-4">
                <p className="text-xs text-muted-foreground">{agent.email || 'Sin email'}</p>
              </div>
              <div className="col-span-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                  {agent.role || 'agent'}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-3">
                {agent.is_admin ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                    <Check size={12} /> Admin
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <X size={12} /> No
                  </span>
                )}
                {/* Toggle */}
                <button
                  onClick={() => handleToggleAdmin(agent)}
                  disabled={togglingId === agent.id}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 ${
                    agent.is_admin ? 'bg-emerald-500' : 'bg-foreground/20'
                  }`}
                >
                  {togglingId === agent.id ? (
                    <Loader2 size={10} className="animate-spin text-white mx-auto" />
                  ) : (
                    <span
                      className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                        agent.is_admin ? 'translate-x-[18px]' : 'translate-x-[2px]'
                      }`}
                    />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[10px] text-muted-foreground/50 mt-4 text-center">
        Los cambios se aplican inmediatamente — los agentes necesitan volver a iniciar sesión para ver los cambios de acceso
      </p>
    </div>
  );
}
