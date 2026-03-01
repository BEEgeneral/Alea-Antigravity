import Navbar from "@/components/Navbar";
import { ShieldCheck } from "lucide-react";

export default function PoliticaPrivacidad() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Navbar />
            <main className="pt-32 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12">
                        <ShieldCheck className="w-12 h-12 text-primary mb-6" />
                        <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">Política de Privacidad</h1>
                        <p className="text-muted-foreground text-lg">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
                    </div>

                    <div className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary max-w-none">
                        <section className="mb-10">
                            <h2>1. Compromiso de Confidencialidad Institucional</h2>
                            <p>
                                Aleasignature ("nosotros", "nuestro" o "la Compañía") opera bajo los más altos estándares de
                                confidencialidad exigidos por despachos de abogados, fondos de inversión y Multi-Family Offices.
                                La protección de los datos de nuestros inversores institucionales y particulares (UHNWI) no es solo
                                una obligación legal recogida en el RGPD (Reglamento General de Protección de Datos), sino la base
                                fundamental de nuestro modelo de originación privada corporativa.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2>2. Tipología de Datos Recopilados</h2>
                            <p>
                                Para garantizar la integridad de nuestras operaciones de gestión patrimonial y cumplir con las normativas
                                vigentes de Prevención de Blanqueo de Capitales (PBC/FT), recopilamos las siguientes categorías de información:
                            </p>
                            <ul>
                                <li><strong>Datos de Identificación y Contacto:</strong> Nombres legales, razón social, correos corporativos y números telefónicos.</li>
                                <li><strong>Datos de Cualificación Financiera:</strong> Tesis de inversión, rangos de capital autorizado (ticket sizes) y tipología de inversor (e.g., MFO, Fondo Soberano).</li>
                                <li><strong>Datos de Verificación Documental:</strong> Documentación KYC (Know Your Customer) y KYB (Know Your Business) aportada a través de nuestros canales seguros.</li>
                                <li><strong>Datos de Interacción (Logs del Sistema):</strong> Registro de acceso a Data Rooms y consultas de activos bajo mandato de confidencialidad.</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2>3. Finalidad del Tratamiento Fiduciario</h2>
                            <p>Sometemos sus datos a un tratamiento riguroso con las siguientes finalidades restrictivas:</p>
                            <ul>
                                <li>Ejecutar la validación de perfiles para otorgar acceso a nuestro Directorio Confidencial (Radar).</li>
                                <li>Gestionar los "Acuerdos de Confidencialidad" (NDAs) vinculantes suscritos digital o físicamente.</li>
                                <li>Enviar alertas precisas y alineadas con la tesis de inversión estratégica declarada por el mandatario.</li>
                                <li>Cumplir estrictamente con obligaciones y auditorías legales, fiscales y regulatorias europeas.</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2>4. Protección, Cifrado y Retención</h2>
                            <p>
                                Adoptamos un enfoque de seguridad proactiva (Security by Design). Los perfiles de inversión y la documentación sensible
                                se encuentran en bases de datos encriptadas provistas por infraestructuras certificadas (e.g., Supabase/AWS).
                                Limitamos el acceso a estos datos exclusivamente al equipo directivo de <strong>Praetorium</strong> y a agentes auditados.
                            </p>
                            <p>
                                Sus datos se retendrán únicamente durante la vigencia de nuestra relación de consultoría estratégica y, posteriormente,
                                durante el plazo legal obligatorio por motivos de responsabilidad y auditoría externa.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2>5. Ejercicio de Derechos (ARCO)</h2>
                            <p>
                                Como inversor acreditado o legítimo representante corporativo, tiene pleno derecho a ejercitar sus derechos de Acceso,
                                Rectificación, Cancelación, Oposición, Supresión (Olvido) y Portabilidad.
                            </p>
                            <p>
                                Puede ejercer dichos derechos comunicándose de manera directa y confidencial con nuestro Oficial de Privacidad a través de:
                            </p>
                            <p>
                                <strong>Email Directo:</strong> <a href="mailto:radar@aleasignature.com">radar@aleasignature.com</a><br />
                                <strong>Teléfono de Contacto:</strong> <a href="tel:+34657174243">+34 657 174 243</a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
