"use client";

import { Edit2, UserCheck, Plus } from "lucide-react";
import { Agent } from "@/types/admin";

interface AgentManagerProps {
    agents: Agent[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onEdit: (agent: Agent) => void;
    onAdd: () => void;
}

export default function AgentManager({ agents, onApprove, onReject, onEdit, onAdd }: AgentManagerProps) {
    return (
        <div className="max-w-4xl mx-auto w-full space-y-6 mt-10 pb-20">
            <div className="bg-card border border-border rounded-[2.5rem] shadow-sm p-10">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="font-serif text-xl font-medium">Control de Agentes</h2>
                        <p className="text-xs text-muted-foreground mt-1">Gestión de accesos y roles del equipo.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">
                            {agents.filter(a => !a.is_approved).length} Pendientes
                        </span>
                        <button
                            onClick={onAdd}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            <Plus size={14} />
                            <span>Dar de Alta</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {agents.map(agent => (
                        <div key={agent.id} className="p-6 border border-border rounded-3xl flex items-center justify-between hover:bg-muted/30 transition-all group">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-serif border border-primary/10">
                                    {agent.full_name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm font-bold">{agent.full_name}</p>
                                        <span className={`text-[8px] ${agent.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} px-2 py-0.5 rounded-md font-bold uppercase tracking-widest`}>
                                            {agent.role}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{agent.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => onEdit(agent)}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <Edit2 size={16} />
                                </button>
                                {agent.is_approved ? (
                                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest px-4">Activo</span>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => onReject(agent.id)}
                                            className="px-4 py-2 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all"
                                        >
                                            Rechazar
                                        </button>
                                        <button
                                            onClick={() => onApprove(agent.id)}
                                            className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
                                        >
                                            Aprobar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {agents.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground text-xs uppercase tracking-[0.2em]">No hay agentes registrados</div>
                    )}
                </div>
            </div>
        </div>
    );
}
