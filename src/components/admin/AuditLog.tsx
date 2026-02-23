"use client";

import { CheckCircle2 } from "lucide-react";
import { ActivityLog, MOCK_ACTIVITY } from "@/types/admin";

export default function AuditLog() {
    return (
        <div className="max-w-4xl mx-auto w-full space-y-6 mt-10">
            <div className="bg-card border border-border rounded-[2.5rem] shadow-sm p-10">
                <h2 className="font-serif text-xl font-medium mb-8">System Audit Trail</h2>
                <div className="space-y-6">
                    {MOCK_ACTIVITY.map((log) => (
                        <div key={log.id} className="flex space-x-6 items-start">
                            <div className="mt-1 p-2 bg-primary/5 rounded-xl text-primary">
                                <CheckCircle2 size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-bold leading-tight">{log.detail}</p>
                                <p className="text-xs text-muted-foreground mt-2 font-medium">{log.time} — Operativa Validada</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
