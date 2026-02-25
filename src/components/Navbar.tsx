"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const pathname = usePathname();
    const isLanding = pathname === "/";

    useEffect(() => {
        const fetchUserProfile = async (userId: string) => {
            // Check agents first
            const { data: agent } = await supabase
                .from('agents')
                .select('role')
                .eq('id', userId)
                .single();

            if (agent) {
                setUserRole(agent.role); // 'admin' or 'agent'
                return;
            }

            // Check investors
            const { data: investor } = await supabase
                .from('investors')
                .select('investor_type')
                .eq('id', userId)
                .single();

            if (investor) {
                setUserRole(investor.investor_type?.toLowerCase()); // 'inversor' or 'colaborador'
            }
        };

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchUserProfile(currentUser.id).finally(() => setLoadingAuth(false));
            } else {
                setLoadingAuth(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchUserProfile(currentUser.id);
            } else {
                setUserRole(null);
            }
        });

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            subscription.unsubscribe();
        };
    }, []);

    const navLinks = isLanding
        ? [
            { name: "Ventajas", href: "#ventajas" },
            { name: "Praetorium", href: "#praetorium" },
            { name: "Testimonios", href: "#testimonios" },
        ]
        : [];

    // ACL Logic
    const canSeeRadar = userRole === 'admin' || userRole === 'inversor' || userRole === 'colaborador' || userRole === 'agent';
    const canSeeDashboard = userRole === 'admin' || userRole === 'agent';

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-4 ${isScrolled ? "pt-4" : "pt-6"
                }`}
        >
            <div
                className={`max-w-7xl mx-auto transition-all duration-700 ${isScrolled
                    ? "bg-background/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-full px-8 py-3"
                    : "bg-transparent px-4 py-2"
                    }`}
            >
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="relative h-9 w-9 overflow-hidden">
                            <img src="/alea-monogram-black.png" alt="Logo" className="h-full w-auto transition-all duration-700 group-hover:scale-110 dark:hidden" />
                            <img src="/alea-monogram-white.png" alt="Logo" className="h-full w-auto transition-all duration-700 group-hover:scale-110 hidden dark:block" />
                        </div>
                        <span className="font-serif text-xl tracking-[0.2em] font-medium hidden sm:block">
                            alea<span className="text-primary group-hover:text-foreground transition-colors duration-500">signature</span>.
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-10">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className={`text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-300 hover:text-primary ${(link as any).active ? "text-primary px-3 py-1 bg-primary/5 rounded-full" : "text-muted-foreground"
                                    }`}
                            >
                                {link.name}
                            </a>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        {loadingAuth ? (
                            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        ) : !user ? (
                            <>
                                <Link
                                    href="/radar"
                                    className="text-[9px] font-black tracking-[0.2em] uppercase border border-border/50 px-6 py-2.5 rounded-full hover:bg-foreground hover:text-background transition-all duration-500"
                                >
                                    Radar
                                </Link>
                                <Link
                                    href="/praetorium"
                                    className="group relative text-[9px] font-black tracking-[0.2em] uppercase bg-primary text-white border border-primary px-6 py-2.5 rounded-full overflow-hidden transition-all duration-500 hover:opacity-90 hover:shadow-lg hover:shadow-primary/20"
                                >
                                    <span className="relative z-10 flex items-center">
                                        Portal Agentes
                                        <ArrowRight size={12} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center space-x-4">
                                {canSeeRadar && (
                                    <Link
                                        href="/radar"
                                        className="text-[9px] font-black tracking-[0.2em] uppercase border border-border/50 px-6 py-2.5 rounded-full hover:bg-foreground hover:text-background transition-all duration-500"
                                    >
                                        Radar
                                    </Link>
                                )}
                                {canSeeDashboard && (
                                    <Link
                                        href="/praetorium"
                                        className="text-[9px] font-black tracking-[0.2em] uppercase bg-primary text-white border border-primary px-6 py-2.5 rounded-full hover:opacity-90 transition-all duration-500 shadow-lg shadow-primary/20"
                                    >
                                        Portal Agentes
                                    </Link>
                                )}
                                <Link
                                    href="/profile"
                                    className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all duration-500 shadow-sm"
                                    title="Mi Perfil"
                                >
                                    <User size={20} />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden p-2 text-foreground"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-2xl border-b border-border p-8 md:hidden"
                    >
                        <div className="flex flex-col space-y-6">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-lg font-serif tracking-widest text-foreground border-b border-border/50 pb-2"
                                >
                                    {link.name}
                                </a>
                            ))}
                            <div className="flex flex-col space-y-4 pt-4">
                                {loadingAuth ? (
                                    <div className="flex justify-center py-4">
                                        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    </div>
                                ) : !user ? (
                                    <>
                                        <Link href="/radar" className="w-full text-center py-4 rounded-xl border border-border uppercase text-[10px] font-bold tracking-widest">Radar</Link>
                                        <Link href="/praetorium" className="w-full text-center py-4 rounded-xl bg-primary/10 text-primary border border-primary/20 uppercase text-[10px] font-bold tracking-widest">Portal Agentes</Link>
                                    </>
                                ) : (
                                    <>
                                        {canSeeRadar && (
                                            <Link href="/radar" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-4 rounded-xl border border-border uppercase text-[10px] font-bold tracking-widest">Radar</Link>
                                        )}
                                        {canSeeDashboard && (
                                            <Link href="/praetorium" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-4 rounded-xl border border-border uppercase text-[10px] font-bold tracking-widest">Portal Agentes</Link>
                                        )}
                                        <Link
                                            href="/profile"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="w-full flex items-center justify-center space-x-2 py-4 rounded-xl bg-primary/10 text-primary border border-primary/20 uppercase text-[10px] font-bold tracking-widest"
                                        >
                                            <User size={16} />
                                            <span>Mi Perfil</span>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
