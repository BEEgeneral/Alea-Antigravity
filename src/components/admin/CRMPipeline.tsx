"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Plus } from "lucide-react";
import { Lead, PipelineStage, PIPELINE_STAGES } from "@/types/admin";

interface CRMPipelineProps {
    pipelineData: Record<string, Lead[]>;
    draggingId: string | null;
    selectedLead: Lead | null;
    onDragStart: (id: string) => void;
    onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }, leadId: string) => void;
    onSelectLead: (lead: Lead) => void;
    columnRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

export default function CRMPipeline({
    pipelineData,
    draggingId,
    selectedLead,
    onDragStart,
    onDragEnd,
    onSelectLead,
    columnRefs,
}: CRMPipelineProps) {
    return (
        <div className="flex h-full space-x-6 min-w-max pb-8 relative">
            {PIPELINE_STAGES.map((stage) => (
                <div
                    key={stage.id}
                    ref={(el) => { columnRefs.current[stage.id] = el; }}
                    className="w-80 flex flex-col group/column"
                >
                    <div className="flex items-center justify-between mb-4 px-3">
                        <div className="flex items-center space-x-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${stage.color} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                            <h3 className="font-serif text-sm font-bold tracking-tight uppercase text-xs tracking-[0.2em]">{stage.label}</h3>
                            <span className="text-[10px] bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground font-bold border border-border/50">
                                {pipelineData[stage.id]?.length || 0}
                            </span>
                        </div>
                        <button className="text-muted-foreground/40 hover:text-foreground transition-colors">
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className={`flex-1 bg-muted/20 rounded-[2rem] border border-dashed transition-all duration-300 ${draggingId ? 'border-primary/20 bg-primary/5' : 'border-border/40'} p-4 space-y-4 overflow-y-auto`}>
                        <AnimatePresence>
                            {pipelineData[stage.id]?.map((lead) => (
                                <motion.div
                                    key={lead.id}
                                    layoutId={lead.id}
                                    drag
                                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                    dragElastic={0.05}
                                    onDragStart={() => onDragStart(lead.id)}
                                    onDragEnd={(e, info) => onDragEnd(e as unknown as MouseEvent, info, lead.id)}
                                    onClick={() => { if (!draggingId) onSelectLead(lead); }}
                                    whileDrag={{ scale: 1.05, rotate: 2, zIndex: 100, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`bg-card border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing ${selectedLead?.id === lead.id ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.02]' : 'border-border hover:border-primary/40'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl flex items-center justify-center text-xs font-serif border border-primary/10 text-primary">
                                                {lead.investors?.full_name?.charAt(0) || lead.investor?.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold leading-tight mb-0.5">{lead.investors?.full_name || lead.investor}</h4>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{lead.investors?.investor_type || lead.type}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 mb-5 px-1">
                                        <div className="flex items-center text-[11px] text-muted-foreground/80 font-medium">
                                            <MapPin size={12} className="mr-2 text-primary/40" />
                                            <span className="truncate">{lead.properties?.title || lead.property}</span>
                                        </div>
                                        <div className="flex items-center text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                                            <Clock size={12} className="mr-2 text-primary/40" />
                                            <span>ID: {lead.id.slice(0, 8)}...</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-border/30 pt-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-20 bg-muted/50 rounded-full h-1.5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${lead.match_score || lead.matchScore}%` }}
                                                    className="bg-primary h-full"
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-primary">{lead.match_score || lead.matchScore}%</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[9px] font-black bg-primary/5 text-primary/80 px-2 py-1 rounded-lg border border-primary/10">
                                                {lead.investors?.ticket_size || lead.ticket}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {pipelineData[stage.id]?.length === 0 && (
                            <div className="h-40 flex flex-col items-center justify-center text-[10px] text-muted-foreground/30 uppercase tracking-[0.3em] font-bold border-2 border-dashed border-border/20 rounded-[2rem]">
                                <span>Zona Vacía</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
