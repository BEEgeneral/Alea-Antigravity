"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Agent {
    id: string;
    full_name: string;
    role: string;
    is_approved: boolean;
    has_centurion_access: boolean;
}

interface EditAgentModalProps {
    agent: Agent;
    onClose: () => void;
    onUpdate: (agent: Agent) => void;
}

export default function EditAgentModal({ agent, onClose, onUpdate }: EditAgentModalProps) {
    const [localAgent, setLocalAgent] = useState(agent);

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-card border border-border w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10"
            >
                <h2 className="font-serif text-2xl mb-2">Editar Agente</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-8 italic">Modificando perfil de {agent.full_name}</p>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Nombre Completo</label>
                        <input
                            type="text"
                            value={localAgent.full_name || ""}
                            onChange={(e) => setLocalAgent({ ...localAgent, full_name: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Rol en el Sistema</label>
                        <select
                            value={localAgent.role || "agent"}
                            onChange={(e) => setLocalAgent({ ...localAgent, role: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none"
                        >
                            <option value="agent">Agente</option>
                            <option value="admin">Administrador</option>
                            <option value="collaborator">Colaborador</option>
                        </select>
                    </div>
                    <div className="flex items-center space-x-3 p-2">
                        <input
                            type="checkbox"
                            id="edit-approved"
                            checked={localAgent.is_approved}
                            onChange={(e) => setLocalAgent({ ...localAgent, is_approved: e.target.checked })}
                            className="accent-primary"
                        />
                        <label htmlFor="edit-approved" className="text-xs font-bold uppercase tracking-wider cursor-pointer">Estado de Acceso: {localAgent.is_approved ? 'Aprobado' : 'Pendiente'}</label>
                    </div>
                    <div className="flex items-center space-x-3 p-2">
                        <input
                            type="checkbox"
                            id="edit-centurion"
                            checked={localAgent.has_centurion_access}
                            onChange={(e) => setLocalAgent({ ...localAgent, has_centurion_access: e.target.checked })}
                            className="accent-primary"
                        />
                        <label htmlFor="edit-centurion" className="text-xs font-bold uppercase tracking-wider cursor-pointer">Acceso Alea Centurión</label>
                    </div>
                </div>

                <div className="flex gap-4 mt-10">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-border rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onUpdate(localAgent)}
                        className="flex-1 px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </motion.div>
        </div>
    );
}