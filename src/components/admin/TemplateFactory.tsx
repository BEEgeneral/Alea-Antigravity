"use client";

import { FileText, Plus } from "lucide-react";
import { MOCK_TEMPLATES } from "@/types/admin";

export default function TemplateFactory() {
    return (
        <div className="bg-card border border-border rounded-[2.5rem] shadow-xl overflow-hidden max-w-4xl mx-auto w-full mt-10">
            <div className="p-10 border-b border-border bg-muted/10 flex justify-between items-center">
                <div>
                    <h2 className="font-serif text-xl font-medium">Gestión de Plantillas Maestras</h2>
                    <p className="text-xs text-muted-foreground mt-1">Automatización de documentos legales y técnicos.</p>
                </div>
                <button className="p-3 bg-primary/10 text-primary rounded-2xl hover:bg-primary hover:text-white transition-all">
                    <Plus size={20} />
                </button>
            </div>
            <div className="p-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {MOCK_TEMPLATES.map((template) => (
                    <div key={template.id} className="p-6 border border-border rounded-3xl flex items-center justify-between hover:bg-muted/30 transition-all group">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-primary/5 rounded-2xl group-hover:bg-primary/10 transition-colors">
                                <FileText size={24} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold leading-tight">{template.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">Status: Ready</p>
                            </div>
                        </div>
                        <button className="text-[10px] font-black px-4 py-2 bg-muted rounded-xl hover:bg-foreground hover:text-white transition-all uppercase tracking-widest">EDITAR</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
