"use client";

import { motion } from "framer-motion";

interface CollaboratorFormData {
    full_name: string;
    company_name: string;
    email: string;
    phone: string;
    specialty: string;
}

interface CollaboratorFormModalProps {
    isOpen: boolean;
    editingCollaborator: CollaboratorFormData | null;
    form: CollaboratorFormData;
    onClose: () => void;
    onChange: (form: CollaboratorFormData) => void;
    onSave: () => void;
    onReset: () => void;
}

export default function CollaboratorFormModal({
    isOpen,
    editingCollaborator,
    form,
    onClose,
    onChange,
    onSave,
    onReset,
}: CollaboratorFormModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-background border border-border w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
                <h2 className="font-serif text-3xl mb-2">{editingCollaborator ? 'Editar Colaborador' : 'Nuevo Colaborador'}</h2>
                <p className="text-muted-foreground text-sm mb-8 font-light">
                    {editingCollaborator ? 'Modifica los datos del colaborador.' : 'Intermediarios, arquitectos o asesores legales externos.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Nombre Completo</label>
                        <input
                            type="text"
                            placeholder="Ej: Marc Planas"
                            value={form.full_name}
                            onChange={(e) => onChange({ ...form, full_name: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Especialidad</label>
                        <select
                            value={form.specialty}
                            onChange={(e) => onChange({ ...form, specialty: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium appearance-none"
                        >
                            <option value="">Seleccionar Tipo</option>
                            <option value="Broker Inmobiliario">Broker Inmobiliario</option>
                            <option value="Arquitecto">Arquitecto</option>
                            <option value="Asesor Legal">Asesor Legal</option>
                            <option value="Project Manager">Project Manager</option>
                            <option value="Mandatario">Mandatario</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Compañía</label>
                        <input
                            type="text"
                            placeholder="Luxury Group Barcelona"
                            value={form.company_name}
                            onChange={(e) => onChange({ ...form, company_name: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Email</label>
                        <input
                            type="email"
                            placeholder="marc@luxurygroup.com"
                            value={form.email}
                            onChange={(e) => onChange({ ...form, email: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Teléfono</label>
                        <input
                            type="text"
                            placeholder="+34 670 000 000"
                            value={form.phone}
                            onChange={(e) => onChange({ ...form, phone: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-10">
                    <button
                        onClick={onReset}
                        className="flex-1 px-6 py-4 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 shadow-xl shadow-primary/20 transition-all"
                    >
                        {editingCollaborator ? 'Guardar Cambios' : 'Registrar'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}