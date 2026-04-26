"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Users, Settings, Database, Activity, FileText, Webhook, Bell, AlertTriangle, ArrowLeft, Crown, MessageSquare } from "lucide-react";

interface AdminLink {
    name: string;
    href: string;
    icon: React.ReactNode;
    description: string;
    badge?: string;
}

export default function CenturionPage() {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('insforge_token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    router.push('/login');
                    return;
                }

                const data = await res.json();
                if (data.profile?.role !== 'admin') {
                    router.push('/praetorium');
                    return;
                }

                setIsAdmin(true);
            } catch (err) {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const adminLinks: AdminLink[] = [
        {
            name: "Control de Agentes",
            href: "/praetorium?tab=agents",
            icon: <Users size={24} />,
            description: "Gestionar usuarios, agentes y permisos"
        },
        {
            name: "Base de Datos",
            href: "/praetorium?tab=logs",
            icon: <Database size={24} />,
            description: "Logs del sistema y actividad"
        },
        {
            name: "Configuración",
            href: "/praetorium?tab=profile",
            icon: <Settings size={24} />,
            description: "Preferencias y configuración general"
        },
        {
            name: "Dossier Manager",
            href: "/praetorium?tab=centurion",
            icon: <FileText size={24} />,
            description: "Gestionar dossiers de propiedades"
        },
        {
            name: "AI Control Center",
            href: "/praetorium?tab=ai",
            icon: <Activity size={24} />,
            description: "Monitorizar y controlar servicios IA"
        },
        {
            name: "Email Intelligence (IAI)",
            href: "/praetorium?tab=iai_inbox",
            icon: <Bell size={24} />,
            description: "Bandeja de entrada de sugerencias IA"
        },
        {
            name: "Webhooks & Integrations",
            href: "/admin/webhooks",
            icon: <Webhook size={24} />,
            description: "Configurar webhooks y integraciones",
            badge: "Admin"
        },
        {
            name: "Pelayo Chat Logs",
            href: "/praetorium?tab=intelligence",
            icon: <AlertTriangle size={24} />,
            description: "Ver conversaciones y notificaciones"
        },
        {
            name: "Pelayo AI (Voice)",
            href: "/centurion/pelayo",
            icon: <MessageSquare size={24} />,
            description: "Chatea con Pelayo usando voz"
        }
    ];

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Verificando acceso...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link 
                            href="/praetorium"
                            className="p-2 hover:bg-muted rounded-xl transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                <Crown size={20} className="text-amber-500" />
                            </div>
                            <div>
                                <h1 className="font-serif text-xl font-medium">Alea Centurión</h1>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Panel de Administración</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full">
                        <Shield size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Admin Only</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h2 className="text-3xl font-serif mb-2">Acceso de Administrador</h2>
                    <p className="text-muted-foreground">
                        Sección exclusiva para administradores del sistema. Desde aquí puedes gestionar todos los aspectos técnicos y operativos.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="group p-6 bg-card border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    {link.icon}
                                </div>
                                {link.badge && (
                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                        {link.badge}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-medium mb-1">{link.name}</h3>
                            <p className="text-sm text-muted-foreground">{link.description}</p>
                        </Link>
                    ))}
                </div>

                {/* System Status */}
                <div className="mt-12 p-6 bg-card border border-border rounded-2xl">
                    <h3 className="font-medium mb-4 flex items-center space-x-2">
                        <Activity size={18} />
                        <span>Estado del Sistema</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-muted/50 rounded-xl">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deploy</p>
                            <p className="font-medium text-green-500">Activo</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-xl">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Base de Datos</p>
                            <p className="font-medium text-green-500">Conectada</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-xl">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">AI (MiniMax)</p>
                            <p className="font-medium text-green-500">Configurado</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-xl">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email (Resend)</p>
                            <p className="font-medium text-green-500">Conectado</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}