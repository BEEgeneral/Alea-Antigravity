"use client";

import { useState } from "react";
import { Mic, ArrowRight, Shield, TrendingUp, Zap, Building2, Scale, Calculator, HardHat, Paintbrush, FileSignature, Star, X, MapPin, ChevronRight, Gavel, FileCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const CITIES = [
  {
    id: 'malaga',
    name: 'Málaga',
    tagline: 'Costa del Sol · Inversión Prime',
    thumb: '/Malaga city.JPG',
    full: '/Malaga city.JPG',
  },
  {
    id: 'madrid',
    name: 'Madrid',
    tagline: 'Capital · Mercado Exclusivo',
    thumb: '/Madrid City.JPG',
    full: '/Madrid City.JPG',
  },
];

export default function Home() {
  const [openCity, setOpenCity] = useState<(typeof CITIES)[0] | null>(null);
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans overflow-x-hidden">
      <Navbar />

      {/* Hero Section — Cinematic Video Background */}
      <section className="relative h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover scale-105"
            style={{ filter: 'brightness(0.35) saturate(1.1)' }}
          >
            <source src="/ssvid.net-Skyscraper-Building-City-Urban-4K-Free-HD-Stock-Footage_1080pFHR.mp4" type="video/mp4" />
          </video>
          {/* Cinematic vignette — dark edges, no white bleed */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.5)_100%)] z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-gradient-to-t from-black to-transparent z-10" />
          {/* Gold ambient glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/10 rounded-full blur-[100px] opacity-50 z-10" />
        </div>

        <motion.div
          initial="hidden" animate="visible" variants={staggerContainer}
          className="relative z-20 max-w-4xl mx-auto text-center"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full text-sm font-medium mb-8 text-white/90 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" />
            <span className="tracking-wider uppercase text-[11px] font-bold">Originación Privada</span>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mb-6 tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)] leading-[1.1]">
            Independencia, Inteligencia y Acceso en la <span className="text-primary">Defensa del Capital.</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Defensa patrimonial bajo rigor fiduciario. Consultoría estratégica para despachos, Family Offices y fondos institucionales mediante mandatos estrictos de originación privada.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex items-center justify-center">
            <Link
              href="/onboarding"
              className="relative flex items-center space-x-3 bg-white text-black px-8 py-4 rounded-full font-medium text-lg transition-all shadow-2xl hover:-translate-y-1 hover:shadow-primary/30 hover:shadow-3xl w-full sm:w-auto justify-center group backdrop-blur-sm"
            >
              <Mic className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              <span>Solicitar Acceso Privado</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center space-y-2"
        >
          <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 bg-primary/80 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Visual Showcase - Bento Grid */}
      <section className="px-6 pt-16 pb-12 relative z-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[1200px] md:h-[700px]"
          >
            {/* Slot 1: Luxury Villa (Large) */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-3xl border border-white/5 shadow-2xl"
            >
              <Image
                src="https://plus.unsplash.com/premium_photo-1725408023984-f535e86aa58f?q=80&w=2071&auto=format&fit=crop"
                alt="Estructuración Patrimonial"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-8 left-8 drop-shadow-lg">
                <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-2 drop-shadow-md">Wealth Management</p>
                <h3 className="font-serif text-3xl text-white mb-2 drop-shadow-md">Estructuración Patrimonial</h3>
                <p className="text-white/80 text-sm max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500 font-light drop-shadow-sm">
                  Alineación total con firmas fiduciarias y Multi-Family Offices. Confidencialidad y rigor institucional.
                </p>
              </div>
            </motion.div>

            {/* Slot 2: Boutique Hotel (Medium) */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-2 md:row-span-1 relative group overflow-hidden rounded-3xl border border-white/5 shadow-xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop"
                alt="Reposicionamiento Patrimonial"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 drop-shadow-lg">
                <p className="text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-1 drop-shadow-md">Strategic Value-Add</p>
                <h3 className="font-serif text-xl text-white drop-shadow-md">Reposicionamiento Patrimonial</h3>
                <p className="text-white/80 text-xs opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm">Transformación estratégica de edificios históricos en activos contemporáneos de alto rendimiento.</p>
              </div>
            </motion.div>

            {/* Slot 3: Luxury House (Small) */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-1 md:row-span-1 relative group overflow-hidden rounded-3xl border border-white/5 shadow-lg"
            >
              <Image
                src="/market-access.jpg"
                alt="Originación Confidencial"
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 drop-shadow-lg">
                <p className="text-primary text-[8px] font-bold tracking-[0.2em] uppercase drop-shadow-md">Market Access</p>
                <h3 className="font-serif text-sm text-white drop-shadow-md">Originación Confidencial</h3>
              </div>
            </motion.div>

            {/* Slot 4: Residential Building (Small) */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-1 md:row-span-1 relative group overflow-hidden rounded-3xl border border-white/5 shadow-lg"
            >
              <Image
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
                alt="Property Intelligence"
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 drop-shadow-lg">
                <p className="text-primary text-[8px] font-bold tracking-[0.2em] uppercase drop-shadow-md">Data Analysis</p>
                <h3 className="font-serif text-sm text-white drop-shadow-md">Property Intelligence</h3>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl font-medium mb-4">Pilares de Auditoría Fiduciaria</h2>
            <p className="text-muted-foreground">Resultados probados bajo el rigor de la originación directa.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="font-serif text-3xl font-medium text-primary mb-3">Auditoría Estricta</div>
              <div className="font-medium text-lg mb-1">Precisión Analítica</div>
              <p className="text-sm text-muted-foreground">Property Intelligence integrado y control de riesgo.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="font-serif text-3xl font-medium text-primary mb-3">Acceso Protegido</div>
              <div className="font-medium text-lg mb-1">Mandatos Reservados</div>
              <p className="text-sm text-muted-foreground">Operaciones originadas fuera de los circuitos públicos.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div className="font-serif text-3xl font-medium text-primary mb-3">Independencia Total</div>
              <div className="font-medium text-lg mb-1">Ausencia de Conflicto</div>
              <p className="text-sm text-muted-foreground">Defensa fiduciaria orientada exclusivamente al comprador.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section id="modelo" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="text-center max-w-3xl mx-auto mb-20">
            <motion.h2 variants={fadeInUp} className="font-serif text-4xl md:text-5xl font-medium mb-6">El Modelo Alea</motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-muted-foreground">Huye del volumen y abraza la selectividad. Una estructura operativa diseñada para defender y rentabilizar grandes patrimonios en capitales europeas.</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="bg-card/40 backdrop-blur-md p-10 rounded-[2rem] border border-white/10 shadow-sm group hover:border-primary/50 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[60px] group-hover:bg-primary/20 transition-all" />
              <Shield className="w-12 h-12 text-primary mb-8" />
              <h3 className="font-serif text-2xl font-medium mb-4 tracking-tight">Independencia Institucional</h3>
              <p className="text-muted-foreground leading-relaxed font-light">No representamos inventario propio; actuamos como la extensión estratégica de Family Offices y fondos institucionales, alineando el capital con la oportunidad ideal.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="bg-card/40 backdrop-blur-md p-10 rounded-[2rem] border border-white/10 shadow-sm group hover:border-primary/50 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[60px] group-hover:bg-primary/20 transition-all" />
              <TrendingUp className="w-12 h-12 text-primary mb-8" />
              <h3 className="font-serif text-2xl font-medium mb-4 tracking-tight">Inteligencia y Datos</h3>
              <p className="text-muted-foreground leading-relaxed font-light">De la conexión al rigor institucional. Análisis 360º de riesgos, valoración algorítmica de activos e integración de datos para maximizar la rentabilidad del fondo.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="bg-card/40 backdrop-blur-md p-10 rounded-[2rem] border border-white/10 shadow-sm group hover:border-primary/50 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[60px] group-hover:bg-primary/20 transition-all" />
              <Building2 className="w-12 h-12 text-primary mb-8" />
              <h3 className="font-serif text-2xl font-medium mb-4 tracking-tight">Acceso Exclusivo UHNWI</h3>
              <p className="text-muted-foreground leading-relaxed font-light">El guardián del mercado invisible. Acceso a propiedades trofeo reservadas para nuestra red privada de grandes patrimonios y fondos soberanos forjada durante años.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Methodology (Praetorium) */}
      <section id="praetorium" className="py-32 bg-muted/30 border-y border-border px-6">
        <div className="max-w-7xl mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 items-center mb-24">
            {/* Logo Column */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative aspect-square lg:aspect-video rounded-[3rem] bg-muted/40 border border-border/50 flex items-center justify-center overflow-hidden group shadow-2xl"
            >
              <Image
                src="/praetorium-logo.png"
                alt="Praetorium Logo"
                width={320}
                height={320}
                className="h-64 md:h-80 w-auto invert dark:invert-0 opacity-90 transition-all duration-1000 group-hover:scale-105 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            </motion.div>

            {/* Text Column */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex flex-col items-start"
            >
              <h2 className="font-serif text-5xl md:text-7xl font-medium mb-8 leading-tight">Praetorium.</h2>
              <p className="text-xl text-muted-foreground mb-10 font-light leading-relaxed max-w-xl">
                Nuestra división de élite multidisciplinar operativa para institucionales. Inteligencia, análisis de viabilidad técnica y estructuración fiscal de vanguardia para garantizar la <strong className="text-foreground font-semibold">excelencia corporativa</strong> y la <strong className="text-foreground font-semibold">preservación patrimonial</strong> de MFOs y Fondos en cada etapa del ciclo de inversión.
              </p>
              <Link href="/onboarding" className="group inline-flex items-center space-x-4 bg-foreground text-background px-8 py-4 rounded-full font-medium transition-all hover:bg-foreground/90 hover:-translate-y-1 shadow-xl">
                <span className="text-sm uppercase tracking-[0.2em] font-bold">Descubrir Inteligencia Avanzada</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Building2, title: "Asesores Inmobiliarios", desc: "Identificación y análisis de oportunidades prime." },
              { icon: Scale, title: "Abogados y Urbanistas", desc: "Seguridad jurídica y cumplimiento normativo estricto." },
              { icon: Calculator, title: "Fiscales y Financieros", desc: "Optimización fiscal y estructuración de deuda." },
              { icon: HardHat, title: "Arquitectos y Constructores", desc: "Diseño técnico, due diligence y ejecución de obra." },
              { icon: Paintbrush, title: "Decoradores y Tasadores", desc: "Valoración profesional y adecuación de diseño final." },
              { icon: FileSignature, title: "Gestores y Notarios", desc: "Formalización notarial y gestión administrativa." }
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/50 transition-colors">
                <item.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-4" />
                <h4 className="font-medium mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonios" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-4xl font-medium mb-16 text-center">Testimonios de Éxito</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card p-8 rounded-2xl border border-border">
              <div className="flex space-x-1 text-primary mb-6">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-lg italic mb-6">&ldquo;La aproximación de Alea Signature carece completamente de la presión de venta tradicional. Ejercen como auditores independientes, priorizando la reducción de riesgos y la rentabilidad del fondo con discreción absoluta.&rdquo;</p>
              <div>
                <p className="font-medium">María Carmen</p>
                <p className="text-sm text-muted-foreground">UHNWI, Madrid</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-card p-8 rounded-2xl border border-border">
              <div className="flex space-x-1 text-primary mb-6">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-lg italic mb-6">&ldquo;Su capa de Property Intelligence nos permitió descartar activos sobrevalorados y enfocar el capital en reposicionamientos estratégicos con rendimientos probados.&rdquo;</p>
              <div>
                <p className="font-medium">Javier Ruiz</p>
                <p className="text-sm text-muted-foreground">Family Office, Barcelona</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-card p-8 rounded-2xl border border-border">
              <div className="flex space-x-1 text-primary mb-6">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-lg italic mb-6">&ldquo;Alea controla la originación privada con un rigor institucional absoluto. Sus activos reservados aseguran yields fiables, forjados en años coordinando mandatos confidenciales de primer nivel.&rdquo;</p>
              <div>
                <p className="font-medium">Javier Santos</p>
                <p className="text-sm text-muted-foreground">Fondo Institucional, Valencia</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-foreground text-background text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="font-serif text-4xl md:text-5xl font-medium mb-6">Alineación Estratégica</h2>
          <p className="text-lg text-gray-400 mb-12">Acceda a oportunidades estructuradas bajo mandato riguroso. Solicite una evaluación para su Family Office o Fondo de Inversión, protegiendo su patrimonio frente a las dinámicas del mercado abierto.</p>
          <Link
            href="/onboarding"
            className="inline-flex items-center space-x-3 bg-primary text-foreground px-8 py-4 rounded-full font-medium text-lg transition-all hover:scale-105"
          >
            <Mic className="w-5 h-5" />
            <span>Validación de Capital y Perfil</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <span className="font-serif text-2xl tracking-widest font-medium block mb-4">Aleasignature.</span>
            <p className="text-muted-foreground text-sm max-w-sm">Boutique de originación privada y gestión patrimonial. Independencia integral, rigor fiduciario y acceso reservado para la protección e incremento del capital en Europa.</p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Contacto Directo</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="tel:+34657174243" className="hover:text-foreground transition-colors">+34 657 174 243</a></li>
              <li><a href="mailto:radar@aleasignature.com" className="hover:text-foreground transition-colors">radar@aleasignature.com</a></li>
            </ul>
            {/* City presence — clickable thunder effect */}
            <div className="flex items-center gap-4 mt-5">
              {CITIES.map((city) => (
                <button
                  key={city.id}
                  onClick={() => setOpenCity(city)}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-border group-hover:ring-primary/60 group-hover:shadow-[0_0_14px_2px_rgba(180,130,60,0.35)] transition-all duration-300 shadow-md relative">
                    <Image
                      src={city.thumb}
                      alt={city.name}
                      fill
                      sizes="48px"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground group-hover:text-foreground transition-colors">{city.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-4">Garantías</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Colegio de Agentes Inmobiliarios</li>
              <li>Seguro Responsabilidad Civil</li>
              <li>Auditoría Legal Externa</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Aleasignature. Todos los derechos reservados.</p>
          <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 mt-4 md:mt-0 max-w-xl text-right">
            <Link href="/aviso-legal" className="hover:text-foreground">Aviso Legal</Link>
            <Link href="/privacidad" className="hover:text-foreground">Privacidad</Link>
            <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
            <Link href="/terminos" className="hover:text-foreground">Términos y Condiciones</Link>
            <Link href="/cumplimiento" className="hover:text-foreground">Cumplimiento (KYC/AML)</Link>
          </div>
        </div>
      </footer>

      {/* Thunder City Modal */}
      <AnimatePresence>
        {openCity && (
          <>
            {/* Flash overlay */}
            <motion.div
              className="fixed inset-0 z-[99] bg-white pointer-events-none"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpenCity(null)}
            />
            {/* Modal panel */}
            <motion.div
              className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none"
              initial={{ scale: 0.04, opacity: 0, filter: 'brightness(4) blur(8px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'brightness(1) blur(0px)' }}
              exit={{ scale: 1.06, opacity: 0, filter: 'brightness(3) blur(6px)' }}
              transition={{
                scale: { type: 'spring', stiffness: 520, damping: 28 },
                opacity: { duration: 0.08 },
                filter: { duration: 0.3 },
              }}
            >
              <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-[0_0_80px_10px_rgba(180,130,60,0.3)] pointer-events-auto">
                {/* City image */}
                <Image
                  src={openCity.full}
                  alt={openCity.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 896px"
                  className="object-cover"
                  priority
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase">{openCity.tagline}</span>
                      </div>
                      <h3 className="font-serif text-5xl text-white font-medium">{openCity.name}</h3>
                    </div>
                    <button
                      onClick={() => setOpenCity(null)}
                      className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </main>
  );
}
