"use client";

import { motion } from "framer-motion";
import { Search, ArrowUpRight } from "lucide-react";

interface Investor {
    id: string;
    full_name: string;
    company_name?: string;
}

interface InvestorSelectorModalProps {
    isOpen: boolean;
    investors: Investor[];
    search: string;
    onSearchChange: (search: string) => void;
    onSelect: (investorId: string, propertyId?: string) => void;
    onClose: () => void;
    targetPropertyId?: string;
}

export default function InvestorSelectorModal({
    isOpen,
    investors,
    search,
    onSearchChange,
    onSelect,
    onClose,
    targetPropertyId,
}: InvestorSelectorModalProps) {
    if (!isOpen) return null;

    const filteredInvestors = investors.filter((inv) =>
        inv.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        inv.company_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-background border border-border w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
                <h2 className="font-serif text-2xl mb-2">Asignar Inversor</h2>
                <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mb-6">Vincular propiedad a un potencial comprador</p>

                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground pointer-events-none">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o empresa..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-muted/40 border border-border/60 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-all font-medium"
                    />
                </div>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                    {filteredInvestors.length > 0 ? (
                        filteredInvestors.map((inv) => (
                            <button
                                key={inv.id}
                                onClick={() => onSelect(inv.id, targetPropertyId)}
                                className="w-full text-left p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group flex items-center justify-between"
                            >
                                <div>
                                    <p className="font-bold text-sm group-hover:text-primary transition-colors">{inv.full_name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{inv.company_name || 'Individual'}</p>
                                </div>
                                <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-all" />
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground text-xs uppercase tracking-widest">
                            {investors.length === 0 ? 'No hay inversores registrados' : 'No hay resultados para esta búsqueda'}
                        </div>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-8 py-4 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all"
                >
                    Cancelar
                </button>
            </motion.div>
        </div>
    );
}