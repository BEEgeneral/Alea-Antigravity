import Navbar from "@/components/Navbar";
import { ShieldAlert } from "lucide-react";

export default function PrevencionBlanqueo() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Navbar />
            <main className="pt-32 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12">
                        <ShieldAlert className="w-12 h-12 text-primary mb-6" />
                        <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">Cumplimiento Normativo Corporativo (KYC / AML)</h1>
                        <p className="text-muted-foreground text-lg">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
                    </div>

                    <div className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary max-w-none">
                        <section className="mb-10">
                            <h2>1. Obligación Legal Institucional (Sujetos Obligados)</h2>
                            <p>
                                En riguroso cumplimiento de la <strong>Ley 10/2010 de Prevención de Blanqueo de Capitales y de la Financiación
                                    del Terrorismo (PBC/FT) de España</strong> y las directivas europeas homólogas exigidas por el SEPBLAC,
                                la totalidad del cuadro directivo y consultivo de Aleasignature actúa en condición fiduciaria como "Sujeto Obligado".
                            </p>
                            <p>
                                Esta condición exige que todo mandato de gestión, due diligence adquisitiva u originación privada que propicie nuestra
                                firma, atraviese ineludiblemente un proceso de auditoría de identidad perimetral previo a su formalización y cierre.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2>2. Procedimiento de Verificación KYC y KYB</h2>
                            <p>
                                Todo inversor directo (UHNWI), Family Office o fondo institucional admitido a nuestra firma acepta expresamente aportar, de manera previa a toda transacción, la siguiente documentación al "Alea Security Committee":
                            </p>
                            <ul>
                                <li><strong>Inversores Individuales (KYC):</strong> Acreditación de identidad fidedigna, declaración responsable de Titularidad Real y prueba fehaciente de procedencia de fondos bancarizados.</li>
                                <li><strong>Personas Jurídicas y Estructuras de Vehículo (KYB):</strong> Estructuración corporativa, identificación detallada de Administradores, actas de la matriz de Titularidad Real Institucional (UBO &gt; 25% ownership stake), Estatutos Sociales y certificaciones de auditoría registral corporativa (si aplica).</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2>3. Transparencia Origen - Custodia Fiduciaria</h2>
                            <p>
                                Para suscribir una LoI (Letter of Intent) o proceder al bloqueo registral de un activo (arras), Aleasignature
                                exige de manera indisputable prueba de origen de los fondos (Proof of Funds - PoF) procedentes de entidades financieras
                                localizadas operativas bajo el perímetro regulador del SEPA (Zona Única de Pagos en Euros) o jurisdicciones internacionales
                                de rigidez probada.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2>4. Adhesión al Acuerdo de Confidencialidad y Cumplimiento de Procedencias (NDA-PBC)</h2>
                            <p>
                                La adhesión a este Código Normativo de PBC/FT no es separada del Acuerdo Marco de Confidencialidad firmado y aceptado en
                                nuestro protocolo de origen. El rechazo a completar la trazabilidad fiduciaria implicará automáticamente la denegación del
                                alta al módulo de Activos (Radar), y/o la resolución unilateral de cualquier mandato vigente, previa comunicación a
                                las autoridades operativas.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
