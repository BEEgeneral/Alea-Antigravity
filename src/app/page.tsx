"use client";

import { Mic, ArrowRight, Shield, TrendingUp, Zap, Building2, Scale, Calculator, HardHat, Paintbrush, FileSignature, Star } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

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

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 p-6 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center space-x-3">
          {/* User's uploaded logos (Black/White variants) */}
          <img src="/alea-monogram-black.png" alt="Aleasignature Logo" className="h-10 w-auto opacity-90 transition-opacity hover:opacity-100 dark:hidden" />
          <img src="/alea-monogram-white.png" alt="Aleasignature Logo" className="h-10 w-auto opacity-90 transition-opacity hover:opacity-100 hidden dark:block" />
          <span className="font-serif text-xl tracking-widest font-medium">Aleasignature.</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground">
          <a href="#ventajas" className="hover:text-foreground transition-colors">Ventajas</a>
          <a href="#praetorium" className="hover:text-foreground transition-colors">Praetorium</a>
          <a href="#testimonios" className="hover:text-foreground transition-colors">Testimonios</a>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-[10px] font-bold tracking-[0.2em] uppercase border border-border px-5 py-2.5 rounded-full hover:bg-foreground hover:text-background transition-all">
            Acceso Inversores
          </Link>
          <Link href="/login" className="text-[10px] font-bold tracking-[0.2em] uppercase bg-primary/10 text-primary border border-primary/20 px-5 py-2.5 rounded-full hover:bg-primary hover:text-white transition-all shadow-sm shadow-primary/10">
            Portal Agentes
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center px-6 overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
        </div>

        <motion.div
          initial="hidden" animate="visible" variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center space-x-2 bg-muted/50 border border-white/10 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Sistema Off-Market Activo</span>
          </motion.div>


          <motion.h1 variants={fadeInUp} className="font-serif text-5xl md:text-7xl font-medium mb-6 tracking-tight">
            Acceso Exclusivo a Oportunidades Inmobiliarias Off-Market.
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Descubre propiedades y proyectos de inversión únicos en España y Portugal, lejos del mercado tradicional. Tu puerta de entrada a la inversión discreta y rentable.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              href="/onboarding"
              className="relative flex items-center space-x-3 bg-foreground text-background px-8 py-4 rounded-full font-medium text-lg transition-all shadow-2xl hover:-translate-y-1 hover:shadow-primary/20 hover:shadow-3xl w-full sm:w-auto justify-center group"
            >
              <Mic className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              <span>Comenzar Búsqueda Exclusiva</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Visual Showcase - Bento Grid */}
      <section className="px-6 py-12 -mt-12 relative z-20">
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
              <img
                src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop"
                alt="Villa de Lujo"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-8 left-8 drop-shadow-lg">
                <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-2 drop-shadow-md">Luxury Living</p>
                <h3 className="font-serif text-3xl text-white mb-2 drop-shadow-md">Villas de Lujo Exclusivas</h3>
                <p className="text-white/80 text-sm max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500 font-light drop-shadow-sm">
                  Residencias de alto standing con infinity pool, vistas privilegiadas y acabados de diseño premium.
                </p>
              </div>
            </motion.div>

            {/* Slot 2: Boutique Hotel (Medium) */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-2 md:row-span-1 relative group overflow-hidden rounded-3xl border border-white/5 shadow-xl"
            >
              <img
                src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop"
                alt="Hotel Boutique de Lujo"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 drop-shadow-lg">
                <p className="text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-1 drop-shadow-md">Hospitality</p>
                <h3 className="font-serif text-xl text-white drop-shadow-md">Hoteles Boutique Premium</h3>
                <p className="text-white/80 text-xs opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm">Activos hoteleros exclusivos en ubicaciones prime con altos rendimientos operativos.</p>
              </div>
            </motion.div>

            {/* Slot 3: Luxury House (Small) */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-1 md:row-span-1 relative group overflow-hidden rounded-3xl border border-white/5 shadow-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"
                alt="Casa de Lujo Moderna"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 drop-shadow-lg">
                <p className="text-primary text-[8px] font-bold tracking-[0.2em] uppercase drop-shadow-md">Residencial</p>
                <h3 className="font-serif text-sm text-white drop-shadow-md">Casas de Lujo</h3>
              </div>
            </motion.div>

            {/* Slot 4: Residential Building (Small) */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-1 md:row-span-1 relative group overflow-hidden rounded-3xl border border-white/5 shadow-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop"
                alt="Edificio Residencial Premium"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 drop-shadow-lg">
                <p className="text-primary text-[8px] font-bold tracking-[0.2em] uppercase drop-shadow-md">Premium</p>
                <h3 className="font-serif text-sm text-white drop-shadow-md">Edificios Residenciales</h3>
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
            <h2 className="font-serif text-3xl font-medium mb-4">Números que hablan por sí solos</h2>
            <p className="text-muted-foreground">Resultados reales de nuestro mercado exclusivo.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="font-serif text-5xl font-medium text-primary mb-2">500+</div>
              <div className="font-medium text-lg mb-1">Propiedades Exclusivas</div>
              <p className="text-sm text-muted-foreground">Fuera del escaparate público.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="font-serif text-5xl font-medium text-primary mb-2">1,200+</div>
              <div className="font-medium text-lg mb-1">Inversores Registrados</div>
              <p className="text-sm text-muted-foreground">Operaciones cerradas con éxito.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div className="font-serif text-5xl font-medium text-primary mb-2">18%</div>
              <div className="font-medium text-lg mb-1">Rentabilidad Media Anual</div>
              <p className="text-sm text-muted-foreground">Sobre el mercado tradicional.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section id="ventajas" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="text-center max-w-3xl mx-auto mb-20">
            <motion.h2 variants={fadeInUp} className="font-serif text-4xl md:text-5xl font-medium mb-6">¿Por qué el mercado Off-Market?</motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-muted-foreground">Accede a oportunidades inmobiliarias exclusivas que no están disponibles al público general, maximizando tu ROI desde el primer día.</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-card p-8 rounded-2xl border border-border shadow-sm">
              <Shield className="w-10 h-10 text-primary mb-6" />
              <h3 className="font-serif text-xl font-medium mb-3">Exclusividad Total</h3>
              <p className="text-muted-foreground leading-relaxed">Propiedades que no aparecen en portales públicos. Acceso privilegiado a las mejores oportunidades antes de que lleguen a tu competencia.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-card p-8 rounded-2xl border border-border shadow-sm">
              <TrendingUp className="w-10 h-10 text-primary mb-6" />
              <h3 className="font-serif text-xl font-medium mb-3">Rentabilidad Superior</h3>
              <p className="text-muted-foreground leading-relaxed">Precios más competitivos al evitar la especulación del mercado abierto. Márgenes de beneficio superiores garantizados en cada operación.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-card p-8 rounded-2xl border border-border shadow-sm">
              <Zap className="w-10 h-10 text-primary mb-6" />
              <h3 className="font-serif text-xl font-medium mb-3">Eficiencia Operativa</h3>
              <p className="text-muted-foreground leading-relaxed">Sin intermediarios innecesarios. Negociación directa y estructuración ágil para un cierre mucho más rápido y limpio.</p>
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
              <img
                src="/praetorium-logo.png"
                alt="Praetorium Logo"
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
                Nuestra división de élite multidisciplinar. Un equipo que te acompaña desde la firma del NDA hasta la entrega final de tu inversión, garantizando <strong className="text-foreground font-semibold">excelencia institucional</strong> y <strong className="text-foreground font-semibold">discreción absoluta</strong> en cada etapa del proceso.
              </p>
              <Link href="/onboarding" className="group inline-flex items-center space-x-4 bg-foreground text-background px-8 py-4 rounded-full font-medium transition-all hover:bg-foreground/90 hover:-translate-y-1 shadow-xl">
                <span className="text-sm uppercase tracking-[0.2em] font-bold">Solicitar Acceso Privado</span>
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
              <p className="text-lg italic mb-6">&ldquo;Encontré mi propiedad ideal en 3 semanas. El acceso exclusivo marca la diferencia real comparado con el mercado tradicional.&rdquo;</p>
              <div>
                <p className="font-medium">María Carmen</p>
                <p className="text-sm text-muted-foreground">Inversora, Madrid</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-card p-8 rounded-2xl border border-border">
              <div className="flex space-x-1 text-primary mb-6">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-lg italic mb-6">&ldquo;La rentabilidad obtenida superó mis expectativas. El servicio técnico del Praetorium fue excepcional y muy discreto.&rdquo;</p>
              <div>
                <p className="font-medium">Javier Ruiz</p>
                <p className="text-sm text-muted-foreground">Family Office, Barcelona</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-card p-8 rounded-2xl border border-border">
              <div className="flex space-x-1 text-primary mb-6">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-lg italic mb-6">&ldquo;Acceso íntegro a propiedades hoteleras que jamás hubiera encontrado por mi cuenta. Altamente recomendado para tickets grandes.&rdquo;</p>
              <div>
                <p className="font-medium">Ana López</p>
                <p className="text-sm text-muted-foreground">Inversora, Valencia</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-foreground text-background text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="font-serif text-4xl md:text-5xl font-medium mb-6">¿Listo para descubrir tu próxima oportunidad?</h2>
          <p className="text-lg text-gray-400 mb-12">Nuestro asistente inteligente cualificará tu perfil para darte acceso a las propiedades exclusivas que mejor se adapten a tu tesis de inversión.</p>
          <Link
            href="/onboarding"
            className="inline-flex items-center space-x-3 bg-primary text-foreground px-8 py-4 rounded-full font-medium text-lg transition-all hover:scale-105"
          >
            <Mic className="w-5 h-5" />
            <span>Comenzar Validación por Voz</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <span className="font-serif text-2xl tracking-widest font-medium block mb-4">Aleasignature.</span>
            <p className="text-muted-foreground text-sm max-w-sm">Tu socio de confianza en inversiones inmobiliarias exclusivas off-market. Discreción, calidad y resultados excepcionales para altos patrimonios.</p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Contacto Directo</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>+34 900 123 456</li>
              <li>info@aleasignature.com</li>
              <li>Madrid | Barcelona | Málaga</li>
            </ul>
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
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-foreground">Política de Privacidad</a>
            <a href="#" className="hover:text-foreground">Términos y Condiciones</a>
          </div>
        </div>
      </footer>

    </main>
  );
}
