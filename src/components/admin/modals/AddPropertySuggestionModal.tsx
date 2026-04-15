"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface PropertyFormData {
    title: string;
    description: string;
    type: string;
    price: number;
    meters: number;
    address: string;
    vendor_name: string;
}

interface AddPropertySuggestionModalProps {
    isOpen: boolean;
    form: PropertyFormData;
    onClose: () => void;
    onChange: (form: PropertyFormData) => void;
    onSave: () => void;
}

export default function AddPropertySuggestionModal({
    isOpen,
    form,
    onClose,
    onChange,
    onSave,
}: AddPropertySuggestionModalProps) {
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
                className="relative bg-background border border-border w-full max-w-4xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
                <h2 className="font-serif text-3xl mb-2 flex items-center">
                    <Sparkles size={28} className="mr-3 text-primary" />
                    Revisar Alta de Activo - Alea Intelligence
                </h2>
                <p className="text-muted-foreground text-sm mb-8 font-light">
                    Confirme o modifique la información extraída automáticamente antes de registrar el activo en el sistema.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Título del Activo</label>
                        <input
                            type="text"
                            placeholder="Ej: Hotel Boutique en Centro"
                            value={form.title}
                            onChange={(e) => onChange({ ...form, title: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Descripción / Resumen IAI</label>
                        <textarea
                            placeholder="Descripción extraída del email..."
                            value={form.description}
                            onChange={(e) => onChange({ ...form, description: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium min-h-[120px] resize-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Tipo de Activo</label>
                        <select
                            value={form.type}
                            onChange={(e) => onChange({ ...form, type: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium appearance-none"
                        >
                            <option value="">Selecciona Tipo</option>
                            <option value="Hotel">Hotel</option>
                            <option value="Edificio">Edificio Residencial</option>
                            <option value="Suelo">Suelo / Parcela</option>
                            <option value="Retail">Local Comercial / Retail</option>
                            <option value="Oficinas">Oficinas</option>
                            <option value="Logístico">Logística</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Precio Propuesto (€)</label>
                        <input
                            type="number"
                            placeholder="Ej: 15000000"
                            value={form.price || ""}
                            onChange={(e) => onChange({ ...form, price: Number(e.target.value) })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                        {form.price > 0 && (
                            <p className="text-[10px] text-primary font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">
                                {form.price.toLocaleString('es-ES')} €
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Superficie Total (m²)</label>
                        <input
                            type="number"
                            placeholder="Ej: 2500"
                            value={form.meters || ""}
                            onChange={(e) => onChange({ ...form, meters: Number(e.target.value) })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Ubicación</label>
                        <input
                            type="text"
                            placeholder="Ej: Madrid, España"
                            value={form.address}
                            onChange={(e) => onChange({ ...form, address: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Vendedor / Referencia</label>
                        <input
                            type="text"
                            placeholder="Nombre del Vendedor"
                            value={form.vendor_name}
                            onChange={(e) => onChange({ ...form, vendor_name: e.target.value })}
                            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
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
                        onClick={onSave}
                        className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 shadow-xl shadow-primary/20 transition-all"
                    >
                        Confirmar Alta
                    </button>
                </div>
            </motion.div>
        </div>
    );
}