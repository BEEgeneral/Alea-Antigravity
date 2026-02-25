"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Lock, ArrowRight, UserPlus, AlertCircle, ChevronLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromOnboarding = searchParams.get("from") === "onboarding";
    const prefillEmail = searchParams.get("email") || "";

    const [isRegister, setIsRegister] = useState(fromOnboarding);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        email: prefillEmail,
        password: "",
        fullName: ""
    });

    // Handle authentication state
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user && fromOnboarding) {
                setFormData(prev => ({ ...prev, email: session.user.email || prefillEmail }));
            }
        });
    }, [fromOnboarding, prefillEmail]);
    // If coming from onboarding, pre-fill the name from localStorage
    useEffect(() => {
        if (fromOnboarding) {
            const savedName = localStorage.getItem('alea_investor_name');
            if (savedName) {
                setFormData(prev => ({ ...prev, fullName: savedName }));
            }
        }
    }, [fromOnboarding]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (fromOnboarding && user) {
                // If the user clicked the verification link, they are likely already logged in (session exists)
                // We just need to UPDATE their password
                const { error: updateError } = await supabase.auth.updateUser({
                    password: formData.password,
                    data: {
                        full_name: formData.fullName || user.user_metadata?.full_name
                    }
                });

                if (updateError) throw updateError;

                // After setting password, go to Radar
                router.push("/radar");
                return;
            }

            if (isRegister) {
                const cleanEmail = formData.email.trim();
                const { error: signUpError } = await supabase.auth.signUp({
                    email: cleanEmail,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            role: fromOnboarding ? 'investor' : 'agent'
                        }
                    }
                });

                if (signUpError) {
                    // If user already exists and we are in onboarding mode, try to sign in
                    // This handles users who already confirmed but session wasn't caught
                    if (signUpError.message.includes("already registered") && fromOnboarding) {
                        const { error: signInError } = await supabase.auth.signInWithPassword({
                            email: cleanEmail,
                            password: formData.password,
                        });
                        if (signInError) throw new Error("Este email ya está registrado. Por favor, inicia sesión con tu contraseña o usa 'Recuperar Contraseña'.");
                        router.push("/radar");
                        return;
                    }
                    throw signUpError;
                }

                if (fromOnboarding) {
                    // For investors from onboarding, auto sign-in after registration
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email: cleanEmail,
                        password: formData.password,
                    });

                    if (signInError) throw signInError;
                    router.push("/radar");
                } else {
                    setSuccess(true);
                }
            } else {
                // ... rest of login logic
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email.trim(),
                    password: formData.password,
                });

                if (signInError) throw signInError;

                const { data: agentData, error: agentError } = await supabase
                    .from('agents')
                    .select('is_approved')
                    .eq('id', data.user.id)
                    .single();

                if (agentError && agentError.code !== 'PGRST116') throw agentError;

                if (agentData) {
                    if (!agentData.is_approved) {
                        await supabase.auth.signOut();
                        throw new Error("Tu cuenta está pendiente de aprobación por un administrador.");
                    }
                    router.push("/praetorium");
                } else {
                    router.push("/radar");
                }
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error desconocido");
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
                        <img
                            src="/alea-monogram-white.png"
                            alt="Aleasignature Logo"
                            className="h-16 w-auto opacity-90 transition-opacity hover:opacity-100 hidden dark:block"
                        />
                        <img
                            src="/alea-monogram-black.png"
                            alt="Aleasignature Logo"
                            className="h-16 w-auto opacity-90 transition-opacity hover:opacity-100 dark:hidden"
                        />
                        <h1 className="font-serif text-3xl tracking-widest font-medium">Aleasignature.</h1>
                    </div>
                    <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold mt-4">
                        {fromOnboarding ? "Crea tu contraseña para acceder al Radar" : "Acceso Reservado — Praetorium"}
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <h2 className="text-2xl font-serif mb-8 text-center">
                        {fromOnboarding ? "Crear Contraseña de Acceso" : isRegister ? "Solicitar Acceso" : "Seguridad de Acceso"}
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
                                className="mb-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center space-x-3 text-emerald-500 text-xs font-medium"
                            >
                                <Shield size={16} className="shrink-0" />
                                <span>Solicitud recibida. Pendiente de validación.</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {(isRegister || fromOnboarding) && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-4 font-bold">Nombre Completo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-5 flex items-center text-muted-foreground">
                                        <UserPlus size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-14 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-all font-medium"
                                        placeholder="Tu nombre completo"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-4 font-bold">
                                {fromOnboarding ? "Email Registrado" : "Correo Corporativo"}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center text-muted-foreground">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-14 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-all font-medium"
                                    placeholder={fromOnboarding ? "tu@email.com" : "agente@aleasignature.com"}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    readOnly={fromOnboarding && !!prefillEmail}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-4 font-bold">
                                {fromOnboarding ? "Crea tu Contraseña" : "Contraseña Segura"}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center text-muted-foreground">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-14 pr-12 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
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
                                        {fromOnboarding ? "Crear Cuenta y Acceder" : isRegister ? "Enviar Solicitud" : "Iniciar Sesión"}
                                    </span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {!fromOnboarding && (
                        <div className="mt-8 pt-8 border-t border-border/50 text-center">
                            <button
                                onClick={() => setIsRegister(!isRegister)}
                                className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors font-bold"
                            >
                                {isRegister ? "¿Ya tienes acceso? Identifícate" : "¿Eres nuevo agente? Solicita acceso"}
                            </button>
                        </div>
                    )}
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
