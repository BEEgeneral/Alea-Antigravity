"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, BrainCircuit, Mail, Clock, Loader2 } from "lucide-react";

interface EmailSuggestion {
    id: string;
    original_email_subject: string;
    sender_email: string;
    created_at: string;
}

interface EmailInterpretationPanelProps {
    isOpen: boolean;
    suggestion: EmailSuggestion | null;
    interpretation: string | null;
    isLoading: boolean;
    onClose: () => void;
}

export default function EmailInterpretationPanel({
    isOpen,
    suggestion,
    interpretation,
    isLoading,
    onClose,
}: EmailInterpretationPanelProps) {
    const renderMarkdown = (text: string) => {
        return text.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-2" />;
            if (trimmed === '---') return <hr key={i} className="border-border/30 my-4" />;
            if (trimmed.startsWith('**') && trimmed.includes(':**')) {
                const parts = trimmed.match(/\*\*(.+?):\*\*\s*(.*)/);
                if (parts) {
                    return (
                        <div key={i} className="flex items-start gap-2 py-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary min-w-[120px] pt-0.5">{parts[1]}:</span>
                            <span className="text-sm text-foreground/90 font-medium leading-relaxed">{parts[2]}</span>
                        </div>
                    );
                }
            }
            return <p key={i} className="text-sm text-foreground/80 leading-relaxed">{trimmed}</p>;
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                    />
                    <motion.div
                        layoutId={`email-modal-${suggestion?.id || 'default'}`}
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 right-0 w-full max-w-xl bg-card/90 backdrop-blur-2xl z-[201] shadow-2xl border-l border-border/50 flex flex-col overflow-hidden"
                    >
                        <div className="p-6 md:p-8 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/10"
                                    >
                                        <BrainCircuit size={24} className="text-primary" />
                                    </motion.div>
                                    <div>
                                        <h3 className="font-serif text-xl font-bold tracking-tight">Interpretación AI</h3>
                                        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/60">Alea Intelligence Core</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 bg-muted/50 rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all text-muted-foreground group"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            {suggestion && (
                                <div className="space-y-2 mt-4">
                                    <p className="text-sm font-semibold text-foreground leading-snug">{suggestion.original_email_subject}</p>
                                    <p className="text-[11px] text-muted-foreground flex items-center">
                                        <Mail size={12} className="mr-2 text-primary/40" />
                                        {suggestion.sender_email}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground flex items-center">
                                        <Clock size={12} className="mr-2 text-primary/40" />
                                        {new Date(suggestion.created_at).toLocaleDateString('es-ES', {
                                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            {isLoading ? (
                                <div className="space-y-6 animate-pulse">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <Loader2 size={20} className="animate-spin text-primary" />
                                        <p className="text-sm font-medium text-primary">Alea Intelligence está interpretando el email...</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-4 bg-muted/60 rounded-xl w-3/4" />
                                        <div className="h-4 bg-muted/60 rounded-xl w-full" />
                                        <div className="h-4 bg-muted/60 rounded-xl w-5/6" />
                                        <div className="h-8 bg-muted/30 rounded-xl w-full mt-4" />
                                        <div className="h-4 bg-muted/60 rounded-xl w-2/3" />
                                        <div className="h-4 bg-muted/60 rounded-xl w-4/5" />
                                    </div>
                                </div>
                            ) : interpretation ? (
                                <div className="space-y-4">
                                    <div className="p-6 bg-gradient-to-br from-primary/[0.04] to-transparent border border-primary/10 rounded-[2rem] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                                            <BrainCircuit size={120} />
                                        </div>
                                        <div className="relative z-10 prose prose-sm max-w-none">
                                            {renderMarkdown(interpretation)}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40">
                                    <BrainCircuit size={48} className="mb-4" />
                                    <p className="text-xs uppercase tracking-[0.2em] font-black">Sin interpretación</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border/50 bg-muted/5">
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg"
                            >
                                Cerrar Panel
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}