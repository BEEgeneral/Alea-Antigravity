"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin,
    MessageSquare,
    ShieldCheck,
    TrendingUp,
    Lock,
    ChevronRight,
    Search,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { insforge } from "@/lib/insforge";

interface RadarProperty {
    id: string;
    title?: string;
    address?: string;
    price?: number;
    status?: string;
    is_off_market?: boolean;
    asset_type?: string;
    thumbnail_url?: string;
}

export default function InvestmentRadar() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [properties, setProperties] = useState<RadarProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [investorId, setInvestorId] = useState<string | null>(null);
    const [showContactSuccess, setShowContactSuccess] = useState(false);
    const [ndaRequired, setNdaRequired] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [lastInterestSave, setLastInterestSave] = useState<number>(0);

    // Auth & Permission guard — uses NextAuth session for validated auth
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated" && session?.user) {
            const checkAuth = async () => {
                const userEmail = session.user!.email;

                // God Mode check for Super Admin
                const normalizedEmail = userEmail?.toLowerCase();
                if (normalizedEmail === 'beenocode@gmail.com' || normalizedEmail === 'albertogala@beenocode.com') {
                    setAuthChecked(true);
                    return;
                }

                const userRole = (session.user as any).role;
                const isApproved = (session.user as any).is_approved;

                // 1. Admin or agent by profile role → instant access
                if (userRole === 'admin' || userRole === 'agent') {
                    setAuthChecked(true);
                    return;
                }

                // 2. Check if user is a registered investor (by email match)
                if (userEmail) {
                    const { data: investor } = await insforge.database
                            .from('investors')
                        .select('id, is_verified')
                        .eq('email', userEmail)
                        .maybeSingle();

                    if (investor) {
                        setInvestorId(investor.id);
                        if (investor.is_verified) {
                            setAuthChecked(true);
                        } else {
                            setNdaRequired(true);
                            setAuthChecked(true);
                        }
                        return;
                    }
                }

                // 3. Check if user is a registered collaborator (by email match)
                const { data: collaborator } = await insforge.database
                        .from('collaborators')
                    .select('id, is_active')
                    .eq('email', userEmail)
                    .maybeSingle();

                if (collaborator) {
                    if (collaborator.is_active) {
                        setAuthChecked(true);
                    } else {
                        router.push("/login");
                    }
                    return;
                }

                // Default: redirect if not approved
                if (!isApproved) {
                    router.push("/login");
                }
            };
            checkAuth();
        }
    }, [status, session, router]);

    useEffect(() => {
        if (!authChecked) return;
        const fetchRadarProperties = async () => {
            const { data, error } = await insforge.database
                        .from('properties')
                .select('id, title, address, price, status, is_off_market, asset_type, thumbnail_url');

            if (error) {
                console.error('Error fetching properties:', error);
                setFetchError('No se pudieron cargar los activos. Por favor, recarga la página.');
            } else if (data) {
                setProperties(data as RadarProperty[]);
            }
            setLoading(false);
        };
        fetchRadarProperties();
    }, [authChecked]);

    const saveInterest = async (type: 'filter_search' | 'property_view', propertyId?: string, filterCriteria?: object) => {
        if (!investorId) return;
        
        // Debounce: only save once every 30 seconds
        const now = Date.now();
        if (now - lastInterestSave < 30000 && type === 'filter_search') return;
        
        try {
            await insforge.database.from('investor_interests').insert({
                investor_id: investorId,
                property_id: propertyId || null,
                interest_type: type,
                filter_criteria: type === 'filter_search' ? filterCriteria : null
            });
            setLastInterestSave(now);
        } catch (e) {
            console.error('Error saving interest:', e);
        }
    };

    const handleContactAgent = async (propertyId: string) => {
        if (!investorId) {
            alert("Por favor, complete el registro primero.");
            return;
        }

        // Save property view interest
        await saveInterest('property_view', propertyId);

        const { error } = await insforge.database
                        .from('leads')
            .insert([{
                investor_id: investorId,
                property_id: propertyId,
                status: 'prospect'
            }]);

        if (!error) {
            setShowContactSuccess(true);
            setTimeout(() => setShowContactSuccess(false), 5000);
        } else {
            console.error("Error creating lead:", error);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (value.length > 2 && investorId) {
            saveInterest('filter_search', undefined, { search_term: value });
        }
    };

    const filteredProperties = properties.filter(prop =>
        (prop.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (prop.address?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    // Show loading while checking auth
    if (!authChecked) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (ndaRequired) {
        return (
            <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans overflow-x-hidden">
                <Navbar />
                <main className="pt-40 pb-24 px-6 min-h-[80vh] flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto text-center space-y-8 bg-card/50 backdrop-blur-xl border border-white/10 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
                        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

                        <div className="relative z-10 space-y-8">
                            <ShieldCheck size={64} className="mx-auto text-primary animate-pulse" />
                            <h1 className="text-4xl md:text-5xl font-serif font-medium leading-tight">Acceso Restringido</h1>
                            <p className="text-muted-foreground text-lg font-light leading-relaxed">
                                El acceso a nuestra inteligencia de mercado y oportunidades de originación privada está estrictamente reservado para <strong className="text-foreground">inversores corporativos</strong>, <strong className="text-foreground">fondos</strong> y <strong className="text-foreground">Family Offices</strong> cualificados.
                                <br /><br />
                                Se requiere la firma de un <strong className="text-foreground">Acuerdo de Confidencialidad (NDA)</strong> y la validación de su capital por el equipo de Praetorium para desbloquear el Radar.
                            </p>
                            <div className="pt-8">
                                <Link href="/onboarding" className="inline-flex items-center space-x-3 bg-foreground text-background px-8 py-4 rounded-full font-medium text-lg transition-all hover:scale-105 shadow-xl">
                                    <Lock className="w-5 h-5 text-background/80" />
                                    <span>Firmar NDA y Solicitar Acceso</span>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans overflow-x-hidden">
            <Navbar />

            <main className="pt-32 pb-24 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section */}
                    <div className="mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] block mb-4">
                                Acceso de Inversor Registrado
                            </span>
                            <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6 tracking-tight">
                                Radar de <span className="italic">Inversión.</span>
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-2xl font-light leading-relaxed">
                                Detectamos activos exclusivos de originación privada con alta rentabilidad estratégica.
                                La información detallada se encuentra <span className="text-foreground font-medium">encriptada</span> por motivos de seguridad.
                                Solicite una sesión con un agente para el desbloqueo total.
                            </p>
                        </motion.div>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                            <input
                                type="text"
                                placeholder="Filtrar por ciudad o activo..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                            />
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <ShieldCheck size={14} className="text-primary" />
                            <span>Datos Protegidos por NDA</span>
                        </div>
                    </div>

                    {/* Radar Grid */}
                    {fetchError ? (
                        <div className="py-40 text-center">
                            <AlertCircle size={48} className="mx-auto text-destructive/40 mb-6" />
                            <h3 className="text-xl font-serif text-muted-foreground uppercase tracking-widest font-medium">Error al cargar activos</h3>
                            <p className="text-muted-foreground/50 text-sm mt-2">{fetchError}</p>
                            <button onClick={() => window.location.reload()} className="mt-6 text-sm text-primary underline underline-offset-4">Reintentar</button>
                        </div>
                    ) : loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-[600px] bg-muted/30 rounded-[2.5rem] animate-pulse border border-border" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            <AnimatePresence mode="popLayout">
                                {filteredProperties.map((property, idx) => {
                                    const basePrice = Number(property.price || 0);
                                    const minPrice = basePrice * 0.9;
                                    const maxPrice = basePrice * 1.1;

                                    return (
                                        <motion.div
                                            key={property.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.05 }}
                                            whileHover={{ y: -8 }}
                                            className="group bg-card/50 backdrop-blur-md border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-full hover:border-primary/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-700 relative"
                                        >
                                            {/* Status Badge */}
                                            <div className="absolute top-6 left-6 z-10">
                                                <div className="bg-black/50 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full flex items-center space-x-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                                        {property.is_off_market ? 'Origen Privado' : property.asset_type}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Main Image */}
                                            <div className="relative aspect-[16/10] overflow-hidden">
                                                <Image
                                                    src={property.thumbnail_url || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80"}
                                                    alt="Activo"
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    className="object-cover group-hover:scale-110 transition-transform duration-[2s]"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                            </div>

                                            {/* Data Section */}
                                            <div className="p-8 flex flex-col flex-1">
                                                {/* Address & Reference */}
                                                <div className="mb-6">
                                                    <div className="flex items-center text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                                                        <MapPin size={12} className="mr-2" />
                                                        {property.address || 'Ubicación Confidencial'}
                                                    </div>
                                                    <h3 className="text-lg font-serif font-medium text-foreground line-clamp-1 blur-[1px] group-hover:blur-0 transition-all duration-500">
                                                        CONFIDENCIAL: {(property.address || 'UBICACION').toUpperCase()} REF-{property.id.slice(0, 4)}
                                                    </h3>
                                                </div>

                                                {/* Price Range */}
                                                <div className="mb-6 pt-6 border-t border-border">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Rango de Valoración</span>
                                                        <TrendingUp size={14} className="text-primary/40" />
                                                    </div>
                                                    <span className="text-2xl font-serif font-bold text-primary">
                                                        €{(minPrice / 1000000).toFixed(1)}M - €{(maxPrice / 1000000).toFixed(1)}M
                                                    </span>
                                                </div>

                                                <div className="space-y-4 mb-10">
                                                    <div className="flex justify-between items-center py-3 border-b border-border">
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Estado del Activo</span>
                                                        <span className="text-[10px] text-foreground font-bold uppercase tracking-widest bg-muted/50 px-2 py-1 rounded-md border border-border">
                                                            {property.status === 'active' ? 'BAJO NDA' : 'DISPONIBLE'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto">
                                                    <button
                                                        onClick={() => handleContactAgent(property.id)}
                                                        className="w-full py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all flex items-center justify-center group/btn"
                                                    >
                                                        <MessageSquare size={14} className="mr-3" />
                                                        Contactar Agente Responsable
                                                        <ChevronRight size={14} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>

                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    {showContactSuccess && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="fixed bottom-10 right-10 z-[100] bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-3"
                        >
                            <ShieldCheck size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">Solicitud de contacto enviada con éxito</span>
                        </motion.div>
                    )}

                    {!loading && filteredProperties.length === 0 && (
                        <div className="py-40 text-center">
                            <Lock size={48} className="mx-auto text-muted-foreground/20 mb-6" />
                            <h3 className="text-xl font-serif text-muted-foreground uppercase tracking-widest font-medium">No se detectaron activos en esta búsqueda</h3>
                            <p className="text-muted-foreground/50 text-sm mt-2">Pruebe con otros criterios o contacte por chat.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Premium Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>
        </div>
    );
}
