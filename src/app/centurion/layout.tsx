"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Crown, Home, Users, UserCheck, FileText, Bell,
    Calendar, BarChart3, Video, GitBranch, Radar,
    Brain, Search, Shield, ArrowLeft, Loader2
} from "lucide-react";

const CENTURION_ALLOWED_EMAIL = "beenocode@gmail.com";

export default function CenturionLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check NextAuth session via /api/auth/me (server-side auth())
                const token = localStorage.getItem('insforge_token');

                const res = await fetch('/api/auth/me', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });

                if (!res.ok) {
                    // Not authenticated at all → go to login
                    window.location.href = '/login';
                    return;
                }

                const data = await res.json();
                const email = (data.user?.email || data.profile?.email || "").toLowerCase();

                if (email !== CENTURION_ALLOWED_EMAIL) {
                    // Authenticated but not the allowed email → go to praetorium
                    window.location.href = '/praetorium';
                    return;
                }

                setUserEmail(data.user?.email || data.profile?.email || "");
                setAuthorized(true);
            } catch {
                window.location.href = '/login';
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const navItems = [
        { name: "Overview", href: "/centurion", icon: <Home size={20} /> },
        { name: "RADAR", href: "/centurion/radar", icon: <Radar size={20} />, badge: "Intel" },
        { name: "Inversores", href: "/centurion/investors", icon: <UserCheck size={20} /> },
        { name: "OSINT", href: "/centurion/osint", icon: <Search size={20} /> },
        { name: "Patrones", href: "/centurion/patterns", icon: <Brain size={20} /> },
        { name: "Agentes", href: "/centurion/agents", icon: <Users size={20} /> },
        { name: "Dossiers", href: "/centurion/dossiers", icon: <FileText size={20} /> },
        { name: "IAI Inbox", href: "/centurion/inbox", icon: <Bell size={20} />, badge: "AI" },
        { name: "Agenda", href: "/centurion/agenda", icon: <Calendar size={20} /> },
        { name: "Pirámide", href: "/centurion/pyramid", icon: <BarChart3 size={20} /> },
        { name: "Grafo", href: "/centurion/grafo", icon: <GitBranch size={20} /> },
        { name: "Video", href: "/centurion/video", icon: <Video size={20} /> },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Verificando acceso Centurión...</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">{CENTURION_ALLOWED_EMAIL}</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Shield size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-serif font-medium mb-2">Acceso Denegado</h2>
                    <p className="text-sm text-muted-foreground mb-4">Solo {CENTURION_ALLOWED_EMAIL} puede acceder a Centurión</p>
                    <Link href="/praetorium" className="text-sm text-primary hover:underline">Volver a Praetorium</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border/50 bg-card/30 backdrop-blur-xl flex flex-col fixed h-full overflow-y-auto">
                {/* Header */}
                <div className="p-5 border-b border-border/50">
                    <div className="flex items-center space-x-3 mb-4">
                        <Link href="/praetorium" className="p-2 hover:bg-muted rounded-xl transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-500/30 to-amber-600/20 rounded-xl flex items-center justify-center">
                            <Crown size={18} className="text-amber-500" />
                        </div>
                        <div>
                            <h1 className="font-serif text-base font-medium leading-none">Alea Centurión</h1>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Admin Panel</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full w-fit">
                        <Shield size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Centurion Access</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/centurion" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm ${
                                    isActive
                                        ? 'bg-amber-500/10 text-amber-500 font-medium'
                                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    {item.icon}
                                    <span>{item.name}</span>
                                </div>
                                {item.badge && (
                                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[9px] font-bold rounded-full uppercase">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-border/50">
                    <div className="p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] text-muted-foreground">Sesión</p>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-xs font-medium truncate">{userEmail}</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                {children}
            </main>
        </div>
    );
}
