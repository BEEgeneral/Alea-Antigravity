"use client";

import { motion } from "framer-motion";

interface AgentForm {
    full_name: string;
    email: string;
    role: string;
}

interface AddAgentModalProps {
    form: AgentForm;
    onClose: () => void;
    onChange: (form: AgentForm) => void;
    onSubmit: () => void;
}

export default function AddAgentModal({ form, onClose, onChange, onSubmit }: AddAgentModalProps) {
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
                <h2 className="font-serif text-2xl mb-2">Dar de Alta Agente</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-8 italic">Registro manual de nuevo miembro del equipo</p>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Nombre Completo</label>
                        <input
                            type="text"
                            placeholder="Ej: Alberto Gala"
                            value={form.full_name}
                            onChange={(e) => onChange({ ...form, full_name: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Email Profesional</label>
                        <input
                            type="email"
                            placeholder="correo@aleasignature.com"
                            value={form.email}
                            onChange={(e) => onChange({ ...form, email: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Rol Asignado</label>
                        <select
                            value={form.role}
                            onChange={(e) => onChange({ ...form, role: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none"
                        >
                            <option value="agent">Agente</option>
                            <option value="admin">Administrador</option>
                            <option value="collaborator">Colaborador</option>
                        </select>
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
                        onClick={onSubmit}
                        className="flex-1 px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
                    >
                        Confirmar Alta
                    </button>
                </div>
            </motion.div>
        </div>
    );
}