import Navbar from "@/components/Navbar";
import { Scale } from "lucide-react";

export default function AvisoLegal() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Navbar />
            <main className="pt-32 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12">
                        <Scale className="w-12 h-12 text-primary mb-6" />
                        <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">Aviso Legal</h1>
                        <p className="text-muted-foreground text-lg">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
                    </div>

                    <div className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary max-w-none">
                        <section className="mb-10">
                            <h2>1. Información Corporativa y Registral</h2>
                            <p>
                                En cumplimiento de lo dispuesto en la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
                                Información y de Comercio Electrónico (LSSI-CE), se informa a los usuarios y mandantes institucionales
                                que Aleasignature (en adelante, "la Titular" o "la Compañía") es una boutique de originación privada y
                                gestión patrimonial.
                            </p>
                            <ul>
                                <li><strong>Denominación Social:</strong> [Razón Social de Aleasignature S.L. / S.A.]</li>
                                <li><strong>NIF/CIF:</strong> [CIF de la empresa]</li>
                                <li><strong>Domicilio Social:</strong> [Dirección física corporativa]</li>
                                <li><strong>Email de Contacto Directo:</strong> <a href="mailto:radar@aleasignature.com">radar@aleasignature.com</a></li>
                                <li><strong>Registro Mercantil:</strong> Inscrita en el Registro Mercantil de [Ciudad], Tomo [X], Folio [X], Hoja [X].</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2>2. Colegiación Legal y Seguros Fiduciarios</h2>
                            <p>
                                Como garantía de transparencia e integridad hacia nuestros clientes (Multi-Family Offices, fondos y UHNWI),
                                nuestra matriz operativa cuenta con las siguientes adscripciones oficiales:
                            </p>
                            <ul>
                                <li><strong>Colegio Profesional:</strong> Adscritos al Colegio Oficial de Agentes de la Propiedad Inmobiliaria (API) bajo el número de colegiado [XXX].</li>
                                <li><strong>Registro de Agentes (AICAT/RAIC):</strong> Inscripción en el registro autonómico de agentes bajo la credencial [Número RAIC].</li>
                                <li><strong>Pólizas de Caución y Responsabilidad:</strong> Disponemos de seguro de Responsabilidad Civil Profesional vigente y seguro de Caución para la protección de fondos de terceros.</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2>3. Propiedad Intelectual e Industrial</h2>
                            <p>
                                El diseño de la plataforma (incluidos los sistemas "Praetorium", "Radar" y componentes de "Alea Intelligence"),
                                el código fuente, los logotipos, marcas y demás signos distintivos que aparecen en el sitio web pertenecen a
                                la Titular y están estrictamente protegidos por los correspondientes derechos de propiedad intelectual e industrial.
                            </p>
                            <p>
                                Queda terminantemente prohibida la reproducción, distribución, comunicación pública, transformación o extracción de la base
                                de datos confidencial sin el consentimiento expreso, firmado y por escrito de la Titular.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2>4. Ausencia de Oferta Pública Válida</h2>
                            <p>
                                La información contenida en la presente web y en su Directorio Confidencial (Radar) tiene carácter estrictamente
                                informativo y orientativo. En ningún caso constituirá oferta vinculante, prospecto financiero ni recomendación de compra.
                                La Titularidad de los activos estructurados pertenece a terceros, actuando Aleasignature exclusivamente en base a
                                mandatos preestablecidos y actuando como originador y auditor fiduciario.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2>5. Legislación Aplicable y Fuero Jurisdiccional</h2>
                            <p>
                                Cualquier disputa, controversia o reclamación derivada de la interpretación o ejecución de las presentes disposiciones,
                                se someterá de manera irrenunciable y exclusiva a la jurisdicción de los Juzgados y Tribunales competentes de la sede
                                social de la Titular en España, aplicando en todo caso el Código de Comercio español y la legislación fiduciaria aplicable.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
