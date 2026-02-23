"use client";

import { motion } from "framer-motion";
import { Mail, Building, Edit2, ArrowUpRight } from "lucide-react";
import { Investor } from "@/types/admin";

interface InvestorDirectoryProps {
    investors: Investor[];
    onAddInvestor: () => void;
    onEditInvestor: (investor: Investor) => void;
    onSelectInvestor: (investor: Investor) => void;
}

export default function InvestorDirectory({
    investors,
    onAddInvestor,
    onEditInvestor,
    onSelectInvestor,
}: InvestorDirectoryProps) {
    return (
        <div className="bg-card border border-border rounded-[3rem] shadow-xl p-10 mt-10 max-w-5xl mx-auto overflow-hidden">
            <div className="flex justify-between items-center mb-10 px-6">
                <div>
                    <h2 className="text-2xl font-serif font-medium">Directorio de Inversores</h2>
                    <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mt-1">Sincronizado con Supabase</p>
                </div>
                <button
                    onClick={onAddInvestor}
                    className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                    Añadir Inversor
                </button>
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {investors.map((investor) => (
                        <motion.div
                            key={investor.id}
                            whileHover={{ y: -5 }}
                            className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-[2rem] p-6 flex flex-col justify-between hover:shadow-xl hover:border-primary/30 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-all" />

                            <div className="flex items-start justify-between mb-6 relative">
                                <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center text-xl font-serif text-primary border border-primary/10 shadow-inner">
                                        {investor.full_name?.charAt(0) || 'I'}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{investor.full_name}</h3>
                                        <div className="flex items-center mt-1">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${investor.is_verified ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                {investor.is_verified ? 'Verificado' : 'Pendiente'}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground ml-2 font-medium uppercase tracking-wider">{investor.investor_type || 'Private Investor'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => onEditInvestor(investor)}
                                        className="p-2.5 bg-muted/50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => onSelectInvestor(investor)}
                                        className="p-2.5 bg-muted/50 rounded-xl hover:bg-foreground hover:text-white transition-all text-muted-foreground"
                                    >
                                        <ArrowUpRight size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center text-[11px] text-muted-foreground/80 font-medium">
                                    <Mail size={12} className="mr-2 text-primary/40" />
                                    <span className="truncate">{investor.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center text-[11px] text-muted-foreground/80 font-medium">
                                    <Building size={12} className="mr-2 text-primary/40" />
                                    <span className="truncate">{investor.company_name || 'Individual'}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/30 flex items-end justify-between">
                                <div>
                                    <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-1">Capacidad Estimada</p>
                                    <p className="text-lg font-serif font-bold text-primary">
                                        {investor.ticket_size || (investor.max_ticket_eur ? `€${Number(investor.max_ticket_eur).toLocaleString()}` : '€5M+')}
                                    </p>
                                </div>
                                <div className="flex -space-x-2">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden">
                                            <div className="w-full h-full bg-primary/20" />
                                        </div>
                                    ))}
                                    <div className="w-6 h-6 rounded-full border-2 border-card bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary">
                                        +3
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {investors.length === 0 && (
                        <div className="col-span-full text-center py-20 opacity-40 uppercase tracking-widest text-xs font-black border-2 border-dashed border-border/40 rounded-[3rem]">
                            No hay inversores en la base de datos
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
