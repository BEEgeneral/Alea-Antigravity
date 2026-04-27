"use client";

import { FileText, ShieldCheck, Clock, Building2, Wallet, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { insforge } from "@/lib/insforge-client";

interface InvestorProfile {
    id: string;
    full_name: string;
    email: string;
    kyc_status: string;
    interests?: string[];
    budget_max?: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [investor, setInvestor] = useState<InvestorProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/login');
            return;
        }

        if (status === "authenticated" && session?.user) {
            const fetchInvestor = async () => {
                // Use session user email to fetch investor data from the investors table
                const { data } = await insforge.database
                    .from('investors')
                    .select('id, full_name, email, kyc_status, interests, budget_max')
                    .eq('email', session.user!.email!)
                    .single();

                if (data) {
                    setInvestor(data);
                } else {
                    // If no investor record, use session user data directly
                    setInvestor({
                        id: (session.user as any).id || '',
                        full_name: session.user!.name || '',
                        email: session.user!.email || '',
                        kyc_status: 'pending',
                        interests: [],
                        budget_max: undefined,
                    });
                }
                setLoading(false);
            };
            fetchInvestor();
        }
    }, [status, session, router]);

    const handleLogout = async () => {
        await signOut({ redirect: false });
        // Clean up any legacy localStorage items
        localStorage.removeItem('alea_investor_id');
        localStorage.removeItem('alea_investor_name');
        localStorage.removeItem('insforge_token');
        router.push('/');
    };

    if (loading || status === "loading") return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
        </div>
    );

    if (!investor) return null;

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-20">

            <Navbar />

            <div className="max-w-5xl mx-auto px-6 mt-32">
                <h1 className="font-serif text-4xl font-medium mb-8">Perfil de Inversor</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Section 1: Overview & Status */}
                    <div className="md:col-span-1 space-y-8">
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif text-2xl border border-primary/20">
                                    {(investor.full_name || 'I').charAt(0)}
                                </div>
                                <div>
                                    <h2 className="font-medium text-lg">{investor.full_name}</h2>
                                    <p className="text-sm text-muted-foreground">{investor.email}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <div className={`flex items-center space-x-2 text-sm mb-2 ${investor.kyc_status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    <Clock size={16} />
                                    <span className="font-medium uppercase tracking-wider text-[10px] font-black">Estado: {investor.kyc_status === 'verified' ? 'Verificado' : 'En Revisión'}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {investor.kyc_status === 'verified'
                                        ? "Su perfil ha sido verificado por el Praetorium de Aleasignature. Tiene acceso total a los activos de origen privado."
                                        : "Su perfil está siendo revisado por el Praetorium de Aleasignature. Una vez verificado, se desbloqueará el acceso total a activos de origen privado."}
                                </p>
                            </div>

                            <div className="pt-4 mt-4 border-t border-border">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-red-500 transition-colors w-full justify-center py-3 rounded-xl border border-border hover:border-red-500/30"
                                >
                                    <LogOut size={14} />
                                    <span>Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <h3 className="font-medium mb-4 flex items-center space-x-2">
                                <ShieldCheck size={18} className="text-primary" />
                                <span className="text-xs font-black uppercase tracking-widest">Nivel de Seguridad</span>
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Email Verificado</span>
                                    <span className="text-emerald-500 font-bold">✓ Completado</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Identidad (KYC)</span>
                                    <span className={investor.kyc_status === 'verified' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                                        {investor.kyc_status === 'verified' ? '✓ Verificado' : 'Pendiente'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">NDA Maestro</span>
                                    <span className="text-muted-foreground">Requerido</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Preferences & Documents */}
                    <div className="md:col-span-2 space-y-8">

                        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                            <h2 className="font-serif text-xl font-medium mb-6">Criterio de Inversión</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                    <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                                        <Building2 size={16} />
                                        <span className="text-[10px] uppercase tracking-widest font-black">Activos de Interés</span>
                                    </div>
                                    <p className="text-sm font-medium">{investor.interests?.join(", ") || "No especificado"}</p>
                                </div>

                                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                    <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                                        <Wallet size={16} />
                                        <span className="text-[10px] uppercase tracking-widest font-black">Ticket Máximo</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {investor.budget_max ? `€${(investor.budget_max / 1000000).toFixed(1)}M` : "No especificado"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-serif text-xl font-medium">Documentación Data Room</h2>
                                <button className="text-[10px] font-black uppercase tracking-widest bg-foreground text-background px-4 py-2 rounded-xl hover:bg-foreground/90 transition-colors">
                                    Subir Documento
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-border rounded-xl group hover:border-primary/50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm">Pasaporte / DNI</h4>
                                            <p className="text-[11px] text-muted-foreground">Requerido para validación en el Praetorium.</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-1 rounded">Pendiente</span>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-border rounded-xl group hover:border-primary/50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm">NDA Maestro Aleasignature</h4>
                                            <p className="text-[11px] text-muted-foreground">Requerido para acceder a financieros de origen privado.</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-1 rounded">Pendiente</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
