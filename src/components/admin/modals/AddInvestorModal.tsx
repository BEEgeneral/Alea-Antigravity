"use client";

import { motion } from "framer-motion";

interface InvestorFormData {
    full_name: string;
    company_name: string;
    email: string;
    investor_type: string;
    phone: string;
    budget_min: number;
    budget_max: number;
    labels: string[];
}

interface AddInvestorModalProps {
    isOpen: boolean;
    onClose: () => void;
    form: InvestorFormData;
    onChange: (form: InvestorFormData) => void;
    onSubmit: () => void;
}

export default function AddInvestorModal({ isOpen, onClose, form, onChange, onSubmit }: AddInvestorModalProps) {
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
                className="relative bg-background border border-border w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
                <h2 className="font-serif text-3xl mb-2">Alta de Nuevo Inversor</h2>
                <p className="text-muted-foreground text-sm mb-8 font-light">Complete los datos para añadir al directorio confidencial.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Nombre Completo</label>
                        <input
                            type="text"
                            placeholder="Ej: Eduardo Santacruz"
                            value={form.full_name}
                            onChange={(e) => onChange({ ...form, full_name: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Email Profesional</label>
                        <input
                            type="email"
                            placeholder="eduardo@familyoffice.com"
                            value={form.email}
                            onChange={(e) => onChange({ ...form, email: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Compañía / Entidad</label>
                        <input
                            type="text"
                            placeholder="Family Office ES"
                            value={form.company_name}
                            onChange={(e) => onChange({ ...form, company_name: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Perfil Inversor</label>
                        <select
                            value={form.investor_type}
                            onChange={(e) => onChange({ ...form, investor_type: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium appearance-none"
                        >
                            <option value="">Seleccionar Perfil</option>
                            <option value="HNWI">HNWI</option>
                            <option value="Family Office">Family Office</option>
                            <option value="Institutional">Institutional</option>
                            <option value="Private Equity">Private Equity</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Teléfono</label>
                        <input
                            type="text"
                            placeholder="+34 600 000 000"
                            value={form.phone}
                            onChange={(e) => onChange({ ...form, phone: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Ticket Mínimo (€)</label>
                        <input
                            type="number"
                            value={form.budget_min}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => onChange({ ...form, budget_min: Number(e.target.value) })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Ticket Máximo (€)</label>
                        <input
                            type="number"
                            value={form.budget_max}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => onChange({ ...form, budget_max: Number(e.target.value) })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-3 px-1">Etiquetas</label>
                        <div className="flex flex-wrap gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl">
                            {["Comprador", "Vendedor"].map((label) => (
                                <label key={label} className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={(form.labels || []).includes(label)}
                                            onChange={(e) => {
                                                const currentLabels = form.labels || [];
                                                const newLabels = e.target.checked
                                                    ? [...currentLabels, label]
                                                    : currentLabels.filter((l: string) => l !== label);
                                                onChange({ ...form, labels: newLabels });
                                            }}
                                            className="w-5 h-5 accent-primary rounded-lg border-border"
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70 group-hover:text-primary transition-colors">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-10">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-4 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSubmit}
                        className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 shadow-xl shadow-primary/20 transition-all"
                    >
                        Dar de Alta
                    </button>
                </div>
            </motion.div>
        </div>
    );
}