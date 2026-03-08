"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, ArrowRight, AlertCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromOnboarding = searchParams.get("from") === "onboarding";
    const prefillEmail = searchParams.get("email") || "";

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [email, setEmail] = useState(prefillEmail);

    // Handle initial auth state check - uses getUser() for server-verified session
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
            if (user && !fromOnboarding) {
                const redirectTo = searchParams.get("redirectTo");
                router.push(redirectTo || "/radar");
            }
        });
    }, [fromOnboarding, router, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const trimmedEmail = email.trim().toLowerCase();
        const redirectTo = searchParams.get("redirectTo") || "/praetorium";

        try {
            // ✅ shouldCreateUser: false — Supabase sólo envía el link si el usuario YA existe en Auth.
            // Emails no registrados reciben un error nativo de Supabase sin exponer qué emails existen.
            const { error: signInError } = await supabase.auth.signInWithOtp({
                email: trimmedEmail,
                options: {
                    shouldCreateUser: false,
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
                },
            });

            if (signInError) {
                // Supabase returns a specific error when user doesn't exist
                if (signInError.message.toLowerCase().includes('not found') ||
                    signInError.message.toLowerCase().includes('user not found') ||
                    signInError.status === 422) {
                    setError("Este correo no está registrado. Contacta con tu agente de referencia.");
                } else {
                    setError(signInError.message || "Error al enviar el enlace. Inténtalo de nuevo.");
                }
                return;
            }

            setSuccess("Enlace de acceso enviado. Revisa tu bandeja de entrada o carpeta de spam.");
        } catch (err: unknown) {
            console.error("Login Error Details:", err);
            const errorMessage = err instanceof Error ? err.message : "Error de conexión. Inténtalo de nuevo.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans flex items-center justify-center relative overflow-hidden px-6">

            {/* Background Effects matching Home */}
            <div className="absolute inset-0 z-0 text-white">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-10 text-white" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
            </div>

            {/* Back Button */}
            <Link
                href="/"
                className="fixed top-8 left-8 z-50 flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
            >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>Volver al Inicio</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Branding matching Home */}
                <div className="text-center mb-12">
                    <div className="flex flex-col items-center space-y-4">
                        <Image
                            src="/alea-monogram-white.png"
                            alt="Aleasignature Logo"
                            width={64}
                            height={64}
                            className="h-16 w-auto opacity-90 transition-opacity hover:opacity-100 hidden dark:block"
                        />
                        <Image
                            src="/alea-monogram-black.png"
                            alt="Aleasignature Logo"
                            width={64}
                            height={64}
                            className="h-16 w-auto opacity-90 transition-opacity hover:opacity-100 dark:hidden"
                        />
                        <h1 className="font-serif text-3xl tracking-widest font-medium">Aleasignature.</h1>
                    </div>
                    <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold mt-4">
                        Acceso Reservado — Protocolo Magic Link
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <h2 className="text-2xl font-serif mb-8 text-center">
                        {fromOnboarding ? "Confirmar Acceso" : "Identificación Digital"}
                    </h2>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center space-x-3 text-red-500 text-xs font-medium"
                            >
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex flex-col space-y-2 text-emerald-600 text-xs font-medium"
                            >
                                <div className="flex items-center space-x-3">
                                    <Shield size={16} className="shrink-0" />
                                    <span className="font-bold">Enlace enviado</span>
                                </div>
                                <p className="text-emerald-600/80 text-[11px] leading-relaxed pl-7">
                                    {success}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-4 font-bold">
                                Correo Autorizado
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center text-muted-foreground">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-14 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-all font-medium"
                                    placeholder="ejemplo@aleasignature.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    readOnly={fromOnboarding && !!prefillEmail}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-foreground text-background font-bold py-5 rounded-2xl transition-all shadow-xl hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center space-x-2 group"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="uppercase tracking-widest text-xs">
                                        Solicitar Enlace de Acceso
                                    </span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-border/50 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 leading-relaxed max-w-[200px] mx-auto font-medium">
                            Sin contraseñas. Acceso seguro mediante validación de identidad por email.
                        </p>
                    </div>
                </div>

                <div className="mt-12 flex items-center justify-center space-x-3 text-muted-foreground/40">
                    <Shield size={14} />
                    <span className="text-[10px] uppercase tracking-widest font-black">Secure Encryption — SSL 256-bit</span>
                </div>
            </motion.div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </main>
        }>
            <LoginForm />
        </Suspense>
    );
}
