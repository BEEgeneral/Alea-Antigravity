import Navbar from "@/components/Navbar";
import { Scale } from "lucide-react";

export default function TerminosCondiciones() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Navbar />
            <main className="pt-32 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12">
                        <Scale className="w-12 h-12 text-primary mb-6" />
                        <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">Términos y Condiciones</h1>
                        <p className="text-muted-foreground text-lg">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
                    </div>

                    <div className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary max-w-none">
                        <section className="mb-10">
                            <h2>1. Objeto y Alcance Fiduciario</h2>
                            <p>
                                Aleasignature actúa como una boutique de consultoría en originación privada y gestión patrimonial, prestando servicios
                                dirigidos de manera exclusiva a Inversores Institucionales, Firmas Fiduciarias, Multi-Family Offices (MFO) y Personas
                                de Elevado Patrimonio Neto (UHNWI).
                            </p>
                            <p>
                                Estos Términos y Condiciones ("Condiciones Generales") regulan el acceso, la cualificación y el uso por parte de
                                los mandantes ("el Inversor" o "usted") de nuestra plataforma digital encriptada ("Praetorium" y "Radar") y sus servicios subyacentes.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2>2. Cualificación Institucional de Acceso</h2>
                            <p>
                                El registro y validación en la plataforma Aleasignature no es un proceso automático. Nos reservamos el derecho irrevocable
                                de auditoría para verificar la condición, idoneidad y liquidez declarada por el Inversor o su representante legal.
                            </p>
                            <p>
                                El uso del Radar ("Activos") queda sujeto a la aceptación, formalización explícita y no repudio de un
                                <strong>Acuerdo de Confidencialidad (NDA)</strong> que rige todos los activos bajo nuestra tutela off-ledger.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2>3. Independencia de Criterio e Información Asimétrica</h2>
                            <p>
                                Aleasignature declara operar bajo estricta independencia corporativa y con ausencia absoluta de conflicto de intereses:
                            </p>
                            <ul>
                                <li><strong>Ausencia de Inventario Propio:</strong> No poseemos en cartera mercantil los activos detallados. Actuamos en nombre y defensa de los intereses de la parte que otorga el mandato estratégico.</li>
                                <li><strong>Property Intelligence (Alea Intelligence):</strong> Los índices de rentabilidad, primas de "Origen Privado" o tasaciones mostradas tienen un carácter consultivo fundamentado en modelos algorítmicos. En ningún momento sustituyen la Debida Diligencia técnica, legal y financiera que asume plenamente el comprador o su fondo matriz.</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2>4. Secreto Profesional (Binding NDA)</h2>
                            <p>
                                Se establece la absoluta confidencialidad sobre la información técnica, jurídica, datos del cedente, o proyecciones
                                de negocio mostradas en nuestra Data Room encriptada. Cualquier divulgación no autorizada hacia terceros no cualificados,
                                sean o no competidores directos, facultará a Aleasignature y/o a sus clientes a reclamar
                                daños, perjuicios y lucro cesante ante los tribunales competentes de España, así como a rescindir la membresía de
                                forma ejecutiva e inapelable.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2>5. Responsabilidad</h2>
                            <p>
                                Las valoraciones emitidas por la división "Praetorium" persiguen exclusivamente la alineación patrimonial de las tesis
                                institucionales. Aleasignature limita contractualmente frente al usuario final su responsabilidad civil derivada
                                por interpretaciones de las fluctuaciones macroeconómicas, normativas, o de rentas subyacentes asociadas al
                                portafolio ofertado.
                            </p>
                            <p>
                                El usuario exime a Aleasignature por lucro no percibido, aceptando que la naturaleza del Originación Privada conlleva
                                riesgos inherentes al Real Estate de alto valor.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2>6. Interlocución</h2>
                            <p>
                                Usted acepta y entiende que la relación inicial y cualificación puede transcurrir mediante interfaces de Inteligencia Artificial ("Alea").
                                Las ratificaciones de mandato de compra se transferirán de manera exclusiva mediante canal certificado u honorarios de agente personal
                                avalados por el Colegio Oficial correspondiente.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
