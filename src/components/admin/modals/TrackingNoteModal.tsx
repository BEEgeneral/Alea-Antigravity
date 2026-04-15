"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";

interface TrackingNoteModalProps {
    isOpen: boolean;
    content: string;
    isSaving: boolean;
    leadName?: string;
    onChange: (content: string) => void;
    onSave: () => void;
    onClose: () => void;
}

export default function TrackingNoteModal({
    isOpen,
    content,
    isSaving,
    leadName,
    onChange,
    onSave,
    onClose,
}: TrackingNoteModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-card border border-border w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <Plus size={120} />
                        </div>

                        <h2 className="font-serif text-2xl mb-2">Añadir Seguimiento</h2>
                        <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-8">Lead: {leadName || 'Inversor'}</p>

                        <textarea
                            value={content}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="Escribe aquí los detalles del contacto..."
                            className="w-full h-40 bg-muted/30 border border-border/60 rounded-[2rem] p-6 text-sm focus:outline-none focus:border-primary/50 transition-all resize-none mb-6"
                            autoFocus
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onSave}
                                disabled={isSaving || !content.trim()}
                                className="flex-1 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Guardar Nota'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}