"use client";

import { motion } from "framer-motion";
import { Search, ArrowUpRight } from "lucide-react";

interface Property {
    id: string;
    title: string;
    address?: string;
    images?: string[];
}

interface Investor {
    id: string;
    full_name: string;
    company_name?: string;
}

interface GlobalLeadCreationModalProps {
    isOpen: boolean;
    step: number;
    assetSearch: string;
    investorSearch: string;
    properties: Property[];
    investors: Investor[];
    targetProperty: Property | null;
    onAssetSearchChange: (search: string) => void;
    onInvestorSearchChange: (search: string) => void;
    onSelectAsset: (property: Property) => void;
    onSelectInvestor: (investorId: string, propertyId?: string) => void;
    onStepChange: (step: number) => void;
    onClose: () => void;
}

export default function GlobalLeadCreationModal({
    isOpen,
    step,
    assetSearch,
    investorSearch,
    properties,
    investors,
    targetProperty,
    onAssetSearchChange,
    onInvestorSearchChange,
    onSelectAsset,
    onSelectInvestor,
    onStepChange,
    onClose,
}: GlobalLeadCreationModalProps) {
    if (!isOpen) return null;

    const handleClose = () => {
        onClose();
    };

    const filteredProperties = properties.filter((p) =>
        !assetSearch ||
        p.title?.toLowerCase().includes(assetSearch.toLowerCase()) ||
        p.address?.toLowerCase().includes(assetSearch.toLowerCase())
    );

    const filteredInvestors = investors.filter((inv) =>
        !investorSearch ||
        inv.full_name?.toLowerCase().includes(investorSearch.toLowerCase()) ||
        inv.company_name?.toLowerCase().includes(investorSearch.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-background border border-border w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-serif text-2xl">Generar Nueva Oportunidad</h2>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                        Paso {step} de 2
                    </span>
                </div>
                <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mb-8">
                    {step === 1 ? "Selecciona el activo para la operación" : "Selecciona el inversor interesado"}
                </p>

                {step === 1 ? (
                    <>
                        <div className="relative mb-6">
                            <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground pointer-events-none">
                                <Search size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar activo por título o dirección..."
                                value={assetSearch}
                                onChange={(e) => onAssetSearchChange(e.target.value)}
                                className="w-full bg-muted/40 border border-border/60 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                            {filteredProperties.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => onSelectAsset(p)}
                                    className="w-full text-left p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group flex items-start space-x-4"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                                        <img
                                            src={p.images?.[0] || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">{p.title}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{p.address}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="relative mb-6">
                            <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground pointer-events-none">
                                <Search size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar inversor..."
                                value={investorSearch}
                                onChange={(e) => onInvestorSearchChange(e.target.value)}
                                className="w-full bg-muted/40 border border-border/60 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                            {filteredInvestors.map((inv) => (
                                <button
                                    key={inv.id}
                                    onClick={() => onSelectInvestor(inv.id, targetProperty?.id)}
                                    className="w-full text-left p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-bold text-sm group-hover:text-primary transition-colors">{inv.full_name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{inv.company_name || 'Individual'}</p>
                                    </div>
                                    <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-all" />
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => onStepChange(1)}
                            className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                        >
                            ← Volver a seleccionar activo
                        </button>
                    </>
                )}

                <button
                    onClick={handleClose}
                    className="w-full mt-8 py-4 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all"
                >
                    Cancelar
                </button>
            </motion.div>
        </div>
    );
}