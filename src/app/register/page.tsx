"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    
    useEffect(() => {
        router.push("/login");
    }, [router]);

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans flex items-center justify-center relative overflow-hidden px-6">
            <div className="absolute inset-0 z-0 text-white">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-10 text-white" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
            </div>
            
            <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={32} className="text-amber-500" />
                </div>
                <h2 className="text-2xl font-serif mb-4">Registro Bloqueado</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                    El registro en Alea Signature es solo por invitación. Contacta con un administrador para obtener acceso.
                </p>
                <Link 
                    href="/login"
                    className="inline-flex items-center justify-center space-x-2 bg-foreground text-background font-bold py-4 px-8 rounded-2xl transition-all hover:-translate-y-1"
                >
                    <span>Ir a Login</span>
                </Link>
            </div>
        </main>
    );
}