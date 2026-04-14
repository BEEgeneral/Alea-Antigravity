"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, ArrowRight, AlertCircle, ChevronLeft, User, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export default function InvitePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!token) {
            setError("Token de invitación no proporcionado");
            setLoading(false);
            return;
        }

        fetch(`/api/auth/invite?token=${token}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setInviteData({ email: data.email, role: data.role });
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Error al verificar la invitación");
                setLoading(false);
            });
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            setSubmitting(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            setSubmitting(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password: formData.password,
                    name: formData.name
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Error al aceptar la invitación');
                return;
            }

            setSuccess(true);
        } catch (err: any) {
            console.error("Accept Invite Error:", err);
            setError("Error de conexión. Inténtalo de nuevo.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans flex items-center justify-center relative overflow-hidden px-6">
                <div className="absolute inset-0 z-0 text-white">
                    <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-10 text-white" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md relative z-10 text-center"
                >
                    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-10 shadow-3xl">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <h2 className="text-2xl font-serif mb-4">Invitación Inválida</h2>
                        <p className="text-muted-foreground mb-8">
                            {error}
                        </p>
                        <Link 
                            href="/"
                            className="inline-flex items-center justify-center space-x-2 bg-foreground text-background font-bold py-4 px-8 rounded-2xl transition-all hover:-translate-y-1"
                        >
                            <span>Volver al Inicio</span>
                        </Link>
                    </div>
                </motion.div>
            </main>
        );
    }

    if (success) {
        return (
            <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans flex items-center justify-center relative overflow-hidden px-6">
                <div className="absolute inset-0 z-0 text-white">
                    <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-10 text-white" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md relative z-10 text-center"
                >
                    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-10 shadow-3xl">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={32} className="text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-serif mb-4">Cuenta Creada</h2>
                        <p className="text-muted-foreground mb-8">
                            Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.
                        </p>
                        <Link 
                            href="/login"
                            className="inline-flex items-center justify-center space-x-2 bg-foreground text-background font-bold py-4 px-8 rounded-2xl transition-all hover:-translate-y-1"
                        >
                            <span>Iniciar Sesión</span>
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans flex items-center justify-center relative overflow-hidden px-6">

            <div className="absolute inset-0 z-0 text-white">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-10 text-white" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
            </div>

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
                        Invitación de Agente
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <h2 className="text-2xl font-serif mb-2 text-center">
                        Completa tu Perfil
                    </h2>
                    <p className="text-muted-foreground text-sm mb-8 text-center">
                        Has sido invitado como <strong>{inviteData?.role}</strong> para {inviteData?.email}
                    </p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center space-x-3 text-red-500 text-xs font-medium"
                        >
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-4 font-bold">
                                Nombre Completo
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center text-muted-foreground">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-14 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-all font-medium"
                                    placeholder="Tu nombre"
                                    value={formData.name}
                                    onChange={handleChange}
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
                                    name="password"
                                    required
                                    className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-14 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-all font-medium"
                                    placeholder="Mínimo 6 caracteres"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
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
                                    type="password"
                                    name="confirmPassword"
                                    required
                                    className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-14 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-all font-medium"
                                    placeholder="Repite la contraseña"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
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
                                        Crear Cuenta
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