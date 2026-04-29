"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, ArrowRight, AlertCircle, ChevronLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Token no proporcionado.");
            setValidating(false);
            setLoading(false);
            return;
        }

        // Validate token via API
        fetch(`/api/auth/reset-password?token=${token}`)
            .then(res => res.json())
            .then(data => {
                if (data.valid) {
                    setTokenValid(true);
                } else {
                    setError(data.error || "Token inválido o expirado.");
                }
                setValidating(false);
                setLoading(false);
            })
            .catch(() => {
                setError("Error al verificar el token.");
                setValidating(false);
                setLoading(false);
            });
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al restablecer la contraseña.");
                setSubmitting(false);
                return;
            }

            setSuccess(true);
        } catch (err: any) {
            console.error("Reset password error:", err);
            setError("Error de conexión. Inténtalo de nuevo.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || validating) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </main>
        );
    }

    if (success) {
        return (
            <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans flex items-center justify-center relative overflow-hidden px-6">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
                </div>

                <Link href="/" className="fixed top-8 left-8 z-50 flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Volver al Inicio</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-10 shadow-3xl text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle size={32} className="text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-serif mb-4">Contraseña Actualizada</h2>
                        <p className="text-muted-foreground mb-8">
                            Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
                        </p>
                        <Link href="/login" className="inline-flex items-center justify-center space-x-2 bg-foreground text-background font-bold py-4 px-8 rounded-2xl transition-all hover:-translate-y-1">
                            <span>Iniciar Sesión</span>
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </motion.div>
            </main>
        );
    }

    if (error && !tokenValid) {
        return (
            <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans flex items-center justify-center relative overflow-hidden px-6">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
                </div>

                <Link href="/" className="fixed top-8 left-8 z-50 flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Volver al Inicio</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md relative z-10 text-center"
                >
                    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-10 shadow-3xl">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <h2 className="text-2xl font-serif mb-4">Enlace Inválido</h2>
                        <p className="text-muted-foreground mb-8">{error}</p>
                        <Link href="/forgot-password" className="inline-flex items-center justify-center space-x-2 bg-foreground text-background font-bold py-4 px-8 rounded-2xl transition-all hover:-translate-y-1">
                            <span>Solicitar Nuevo Enlace</span>
                        </Link>
                    </div>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans flex items-center justify-center relative overflow-hidden px-6">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
            </div>

            <Link href="/" className="fixed top-8 left-8 z-50 flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group">
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>Volver al Inicio</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-12">
                    <div className="flex flex-col items-center space-y-4">
                        <Image src="/alea-monogram-white.png" alt="Aleasignature Logo" width={64} height={64} className="h-16 w-auto opacity-90 hidden dark:block" />
                        <Image src="/alea-monogram-black.png" alt="Aleasignature Logo" width={64} height={64} className="h-16 w-auto dark:hidden" />
                        <h1 className="font-serif text-3xl tracking-widest font-medium">Aleasignature.</h1>
                    </div>
                    <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold mt-4">
                        Nueva Contraseña
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <h2 className="text-2xl font-serif mb-8 text-center">
                        Establece tu Nueva Contraseña
                    </h2>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center space-x-3 text-red-500 text-xs font-medium"
                        >
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-4 font-bold">
                                Nueva Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center text-muted-foreground">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={8}
                                    className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-14 pr-12 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-all font-medium"
                                    placeholder="Mínimo 8 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-4 font-bold">
                                Confirmar Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center text-muted-foreground">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={8}
                                    className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-14 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-all font-medium"
                                    placeholder="Repite la contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-foreground text-background font-bold py-5 rounded-2xl transition-all shadow-xl hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center space-x-2 group"
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="uppercase tracking-widest text-xs">
                                        Actualizar Contraseña
                                    </span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-12 flex items-center justify-center space-x-3 text-muted-foreground/40">
                    <Shield size={14} />
                    <span className="text-[10px] uppercase tracking-widest font-black">Secure Encryption — SSL 256-bit</span>
                </div>
            </motion.div>
        </main>
    );
}

function LoadingFallback() {
    return (
        <main className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
        </main>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
