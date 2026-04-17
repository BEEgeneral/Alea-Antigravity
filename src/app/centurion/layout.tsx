"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Users, Database, Settings, FileText, Activity, Bell, Webhook, AlertTriangle, ArrowLeft, Crown, Home, ArrowRight } from "lucide-react";

interface NavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
}

export default function CenturionLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('insforge_token');
                if (!token) {
                    window.location.href = '/login';
                    return;
                }

                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    window.location.href = '/login';
                    return;
                }

                const data = await res.json();
                if (data.profile?.role !== 'admin') {
                    window.location.href = '/praetorium';
                    return;
                }

                setIsAdmin(true);
            } catch {
                window.location.href = '/login';
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const navItems: NavItem[] = [
        { name: "Control de Agentes", href: "/centurion/agents", icon: <Users size={20} /> },
        { name: "Base de Datos", href: "/centurion/logs", icon: <Database size={20} /> },
        { name: "Configuración", href: "/centurion/settings", icon: <Settings size={20} /> },
        { name: "Dossier Manager", href: "/centurion/dossiers", icon: <FileText size={20} /> },
        { name: "AI Control Center", href: "/centurion/ai", icon: <Activity size={20} /> },
        { name: "Email Intelligence", href: "/centurion/emails", icon: <Bell size={20} /> },
        { name: "Webhooks & Integrations", href: "/centurion/webhooks", icon: <Webhook size={20} /> },
        { name: "Pelayo Chat Logs", href: "/centurion/pelayo", icon: <AlertTriangle size={20} /> },
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
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-border/50">
                    <div className="flex items-center space-x-3 mb-4">
                        <Link 
                            href="/praetorium"
                            className="p-2 hover:bg-muted rounded-xl transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                            <Crown size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <h1 className="font-serif text-lg font-medium">Alea Centurión</h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full w-fit">
                        <Shield size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Admin Only</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        href="/centurion"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${pathname === '/centurion' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                    >
                        <Home size={18} />
                        <span className="text-sm font-medium">Overview</span>
                    </Link>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                        >
                            {item.icon}
                            <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-border/50">
                    <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="text-xs text-muted-foreground mb-2">Deploy Status</p>
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium text-green-500">Activo</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}