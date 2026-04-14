"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function ConfirmContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verificando tu email...');

    useEffect(() => {
        const confirmEmail = async () => {
            const token = searchParams.get('token');
            const email = searchParams.get('email');
            const type = searchParams.get('type');

            if (!token) {
                setStatus('error');
                setMessage('Token de verificación no encontrado');
                return;
            }

            try {
                const res = await fetch('/api/auth/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, email })
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage(data.message || 'Email verificado exitosamente');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Error al verificar el email');
                }
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Error de conexión');
            }
        };

        confirmEmail();
    }, [searchParams]);

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
                className="w-full max-w-md relative z-10 text-center"
            >
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-10 shadow-3xl">
                    {status === 'loading' && (
                        <>
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Loader2 size={32} className="text-primary animate-spin" />
                            </div>
                            <h2 className="text-2xl font-serif mb-4">Verificando...</h2>
                            <p className="text-muted-foreground">
                                {message}
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={32} className="text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-serif mb-4">¡Email Verificado!</h2>
                            <p className="text-muted-foreground mb-8">
                                Tu email ha sido verificado exitosamente. Ya puedes iniciar sesión.
                            </p>
                            <Link 
                                href="/login"
                                className="inline-flex items-center justify-center space-x-2 bg-foreground text-background font-bold py-4 px-8 rounded-2xl transition-all hover:-translate-y-1"
                            >
                                <span>Iniciar Sesión</span>
                                <ArrowRight size={18} />
                            </Link>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <XCircle size={32} className="text-red-500" />
                            </div>
                            <h2 className="text-2xl font-serif mb-4">Error</h2>
                            <p className="text-muted-foreground mb-8">
                                {message}
                            </p>
                            <div className="space-y-4">
                                <Link 
                                    href="/register"
                                    className="inline-flex items-center justify-center space-x-2 bg-foreground text-background font-bold py-4 px-8 rounded-2xl transition-all hover:-translate-y-1"
                                >
                                    <Mail size={18} />
                                    <span>Volver al Registro</span>
                                </Link>
                                <Link 
                                    href="/login"
                                    className="block text-sm text-muted-foreground hover:text-foreground mt-4"
                                >
                                    Ya tienes cuenta? Inicia sesión
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-muted-foreground text-xs">
                        Powered by Alea Signature
                    </p>
                </div>
            </motion.div>
        </main>
    );
}

function LoadingFallback() {
    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans flex items-center justify-center relative overflow-hidden px-6">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>
    );
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ConfirmContent />
        </Suspense>
    );
}
