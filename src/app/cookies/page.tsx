import Navbar from "@/components/Navbar";
import { Search } from "lucide-react";

export default function PoliticaCookies() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Navbar />
            <main className="pt-32 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12">
                        <Search className="w-12 h-12 text-primary mb-6" />
                        <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">Política de Inteligencia (Cookies)</h1>
                        <p className="text-muted-foreground text-lg">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
                    </div>

                    <div className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary max-w-none">
                        <section className="mb-10">
                            <h2>1. Cookies Fiduciarias y Técnicas</h2>
                            <p>
                                Aleasignature utiliza cookies y tecnologías de recopilación de datos locales que son <strong>estrictamente
                                    necesarias</strong> para garantizar la seguridad criptográfica, autenticación de perfil de inversor
                                e integridad operativa de nuestra arquitectura web (autenticaciones mediante tokens Supabase).
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2>2. Trazabilidad Confidencial y Auditoría (Analíticas)</h2>
                            <p>
                                Al tratar inventario restringido, empleamos sistemas de anonimización para auditar interacciones:
                            </p>
                            <ul>
                                <li>Registro de logs de seguridad para trazar accesos al Registro de Activos (Radar).</li>
                                <li>Analíticas de interacción ("Property Intelligence") para comprender las preferencias de asignación de capital de nuestros mandantes (e.g., clicks en "Residencial Core").</li>
                                <li>Control estricto de accesos no autorizados a Data Rooms.</li>
                            </ul>
                            <p>
                                En rigor de nuestro compromiso confidencial con fondos de inversión y UHNWI, <strong>declaramos no comercializar, ceder ni procesar estos datos
                                    con terceros publicitarios</strong> (Facebook Ads, Google Adsense, etc.). No existen cookies de remarketing masivo.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2>3. Control Criptográfico y Gestión</h2>
                            <p>
                                Usted tiene potestad unilateral para revocar en cualquier momento el consentimiento (a excepción de las cookies de sesión obligatorias para el KYC y JWT token).
                                Su acceso cualificado a la inteligencia de propiedades depende técnicamente del mantenimiento de las cookies técnicas de sesión en su terminal de navegación de confianza.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
