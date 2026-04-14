"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, ArrowRight, AlertCircle, ChevronLeft, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { setInsforgeToken } from "@/lib/insforge-client";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const errorParam = searchParams.get("error");
    const prefillEmail = searchParams.get("email") || "";

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState(prefillEmail);
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (errorParam === 'access-revoked') {
            setError("Tu acceso ha sido revocado. Contacta con el administrador.");
        }
    }, [errorParam]);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Not authenticated');
            })
            .then(data => {
                if (data.redirectPath) {
                    router.push(data.redirectPath);
                }
            })
            .catch(() => {});
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Error al iniciar sesión');
                return;
            }

            if (data.accessToken) {
                setInsforgeToken(data.accessToken);
            }

            if (data.redirectPath) {
                router.push(data.redirectPath);
            }
        } catch (err: any) {
            console.error("Login Error:", err);
            setError("Error de conexión. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans flex items-center justify-center relative overflow-hidden px-6">

            <div className="absolute inset-0 z-0 text-white">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-10 text-white" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
            </div>

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
                        Acceso Reservado
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <h2 className="text-2xl font-serif mb-8 text-center">
                        Iniciar Sesión
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
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-4 font-bold">
                                Correo
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center text-muted-foreground">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-14 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-all font-medium"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-4 font-bold">
                                Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center text-muted-foreground">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-14 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-all font-medium"
                                    placeholder="Tu contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-foreground text-background font-bold py-5 rounded-2xl transition-all shadow-xl hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center space-x-2 group"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="uppercase tracking-widest text-xs">
                                        Iniciar Sesión
                                    </span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link 
                            href="/auth/forgot-password"
                            className="text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors font-medium"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <div className="mt-8 pt-8 border-t border-border/50 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 leading-relaxed max-w-[200px] mx-auto font-medium">
                            ¿No tienes cuenta? 
                            <Link href="/register" className="text-primary hover:underline ml-1">
                                Regístrate
                            </Link>
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

function LoadingFallback() {
    return (
        <main className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <LoginForm />
        </Suspense>
    );
}