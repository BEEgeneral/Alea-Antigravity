"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface InvestorForm {
    full_name: string;
    company_name: string;
    email: string;
    investor_type: string;
    phone: string;
    budget_min: number;
    budget_max: number;
    labels: string[];
    is_verified: boolean;
}

interface EditInvestorModalProps {
    investor: InvestorForm;
    onClose: () => void;
    onChange: (investor: InvestorForm) => void;
    onSave: (investor: InvestorForm) => void;
}

export default function EditInvestorModal({ investor, onClose, onChange, onSave }: EditInvestorModalProps) {
    if (!investor) return null;
    
    const labels = ["Comprador", "Vendedor"];

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
                className="relative bg-card border border-border w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh]"
            >
                <h2 className="font-serif text-2xl mb-2">Editar Perfil de Inversor</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-8 italic">Modificando cualificación de {investor.full_name}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Nombre Completo</label>
                        <input
                            type="text"
                            value={investor.full_name || ""}
                            onChange={(e) => onChange({ ...investor, full_name: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Compañía / Family Office</label>
                        <input
                            type="text"
                            value={investor.company_name || ""}
                            onChange={(e) => onChange({ ...investor, company_name: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Email de Contacto</label>
                        <input
                            type="email"
                            value={investor.email || ""}
                            onChange={(e) => onChange({ ...investor, email: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Tipo de Inversor</label>
                        <select
                            value={investor.investor_type || ""}
                            onChange={(e) => onChange({ ...investor, investor_type: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium appearance-none"
                        >
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
                            value={investor.phone || ""}
                            onChange={(e) => onChange({ ...investor, phone: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Ticket Mínimo (EUR)</label>
                        <input
                            type="number"
                            value={investor.budget_min}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => onChange({ ...investor, budget_min: Number(e.target.value) })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Ticket Máximo (EUR)</label>
                        <input
                            type="number"
                            value={investor.budget_max}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => onChange({ ...investor, budget_max: Number(e.target.value) })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-3 px-1">Etiquetas de Inversores</label>
                        <div className="flex flex-wrap gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl">
                            {labels.map((label) => (
                                <label key={label} className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={(investor.labels || []).includes(label)}
                                            onChange={(e) => {
                                                const currentLabels = investor.labels || [];
                                                const newLabels = e.target.checked
                                                    ? [...currentLabels, label]
                                                    : currentLabels.filter((l: string) => l !== label);
                                                onChange({ ...investor, labels: newLabels });
                                            }}
                                            className="w-5 h-5 accent-primary rounded-lg border-border"
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70 group-hover:text-primary transition-colors">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <div className="flex items-center space-x-3 p-2 bg-primary/5 rounded-2xl border border-primary/10">
                            <input
                                type="checkbox"
                                id="investor-verified"
                                checked={investor.is_verified}
                                onChange={(e) => onChange({ ...investor, is_verified: e.target.checked })}
                                className="accent-primary w-4 h-4"
                            />
                            <label htmlFor="investor-verified" className="text-xs font-bold uppercase tracking-widest cursor-pointer text-primary">Estado KYC: {investor.is_verified ? 'VERIFICADO' : 'PENDIENTE'}</label>
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
                        onClick={() => onSave(investor)}
                        className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 shadow-xl shadow-primary/20 transition-all"
                    >
                        Guardar Cualificación
                    </button>
                </div>
            </motion.div>
        </div>
    );
}