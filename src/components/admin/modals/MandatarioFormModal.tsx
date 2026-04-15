"use client";

import { motion } from "framer-motion";

interface MandatarioFormData {
    full_name: string;
    company_name: string;
    email: string;
    phone: string;
    labels: string[];
    mandatario_type?: string;
    id?: string;
    [key: string]: any;
}

interface MandatarioFormModalProps {
    isOpen: boolean;
    editingMandatario: MandatarioFormData | null;
    form: MandatarioFormData;
    onClose: () => void;
    onChange: (form: MandatarioFormData) => void;
    onSave: (form: MandatarioFormData) => void;
    onReset: () => void;
}

export default function MandatarioFormModal({
    isOpen,
    editingMandatario,
    form,
    onClose,
    onChange,
    onSave,
    onReset,
}: MandatarioFormModalProps) {
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
                <h2 className="font-serif text-3xl mb-2">{editingMandatario ? 'Editar Mandatario' : 'Nuevo Mandatario'}</h2>
                <p className="text-muted-foreground text-sm mb-8 font-light">
                    {editingMandatario ? 'Modifica los datos del mandado.' : 'Representantes y agentes de confianza.'}
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
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Tipo de Mandatario</label>
                        <select
                            value={form.mandatario_type || ''}
                            onChange={(e) => onChange({ ...form, mandatario_type: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        >
                            <option value="">Seleccionar Tipo</option>
                            <option value="Fiduciario">Fiduciario</option>
                            <option value="Agente de Representación">Agente de Representación</option>
                            <option value="Legal Representative">Legal Representative</option>
                            <option value="Asesor Directo">Asesor Directo</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Email</label>
                        <input
                            type="email"
                            placeholder="marc@office.com"
                            value={form.email}
                            onChange={(e) => onChange({ ...form, email: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Compañía</label>
                        <input
                            type="text"
                            placeholder="MP Associates"
                            value={form.company_name}
                            onChange={(e) => onChange({ ...form, company_name: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Teléfono</label>
                        <input
                            type="text"
                            placeholder="+34 ..."
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
                        onClick={() => onSave(form)}
                        className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 shadow-xl shadow-primary/20 transition-all"
                    >
                        {editingMandatario ? 'Guardar Cambios' : 'Guardar Mandatario'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}