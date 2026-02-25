"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isLanding = pathname === "/";

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = isLanding
        ? [
            { name: "Ventajas", href: "#ventajas" },
            { name: "Praetorium", href: "#praetorium" },
            { name: "Testimonios", href: "#testimonios" },
        ]
        : [
            { name: "Radar de Inversión", href: "/radar", active: pathname === "/radar" },
            { name: "Mi Perfil", href: "/profile", active: pathname === "/profile" },
        ];

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
                            ALEA<span className="text-primary group-hover:text-foreground transition-colors duration-500">SIGNATURE</span>.
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
                        <Link
                            href="/login"
                            className="text-[9px] font-black tracking-[0.2em] uppercase border border-border/50 px-6 py-2.5 rounded-full hover:bg-foreground hover:text-background transition-all duration-500"
                        >
                            Acceso Privado
                        </Link>
                        <Link
                            href="/onboarding"
                            className="group relative text-[9px] font-black tracking-[0.2em] uppercase bg-primary text-foreground px-6 py-2.5 rounded-full overflow-hidden transition-all duration-500 hover:shadow-[0_0_20px_rgba(180,130,60,0.3)]"
                        >
                            <span className="relative z-10 flex items-center">
                                Portal Agentes
                                <ArrowRight size={12} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>
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
                                <Link href="/login" className="w-full text-center py-4 rounded-xl border border-border uppercase text-[10px] font-bold tracking-widest">Acceso Inversores</Link>
                                <Link href="/onboarding" className="w-full text-center py-4 rounded-xl bg-primary text-foreground uppercase text-[10px] font-bold tracking-widest">Portal Agentes</Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
