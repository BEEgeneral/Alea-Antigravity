import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import { writeFileSync } from 'fs';

async function generateNDA() {
    const doc = new Document({
        styles: {
            paragraphStyles: [
                {
                    id: "Normal",
                    name: "Normal",
                    basedOn: "Normal",
                    run: {
                        font: "Times New Roman",
                        size: 24,
                    },
                    paragraph: {
                        spacing: { after: 200, line: 276 },
                    },
                },
            ],
        },
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1440,
                        right: 1440,
                        bottom: 1440,
                        left: 1440,
                    },
                },
            },
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "ACUERDO DE CONFIDENCIALIDAD",
                            bold: true,
                            size: 32,
                            font: "Times New Roman",
                        }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "(Non-Disclosure Agreement)",
                            italics: true,
                            size: 24,
                            font: "Times New Roman",
                        }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "En ", size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "[Ciudad]", bold: true, size: 24, font: "Times New Roman" }),
                        new TextRun({ text: ", a ", size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "[Fecha]", bold: true, size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "REUNIDOS", bold: true, size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "De una parte, ", size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "ALE ALEA SIGNATURE S.L.", bold: true, size: 24, font: "Times New Roman" }),
                        new TextRun({ text: ", con domicilio en [Dirección], CIF/NIF [Número], representada por [Nombre del representante], en su calidad de [Cargo] (en adelante, la \"", size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "PARTE DIVULGADORA", bold: true, size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "\").", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "De otra parte, ", size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "[Nombre del receptor]", bold: true, size: 24, font: "Times New Roman" }),
                        new TextRun({ text: ", con domicilio en [Dirección], [Tipo de documento]: [Número], actuando en su propio nombre y representación (en adelante, el \"", size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "RECEPTOR", bold: true, size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "\").", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "Ambas partes se reconocen mutuamente capacidad legal suficiente para contratar y obligarse, y de común acuerdo ", size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "MANIFIESTAN", bold: true, size: 24, font: "Times New Roman" }),
                        new TextRun({ text: " que tienen interés en establecer un Acuerdo de Confidencialidad que regule la información confidencial que se intercambie entre ellas.", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "EXPONEN", bold: true, size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "I. Que la PARTE DIVULGADORA posee información confidencial relativa a sus activos, propiedades, estrategias comerciales, datos de clientes, inversores, leads, mandatarios, operaciones y otros asuntos de negocio (en adelante, la \"Información Confidencial\").", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "II. Que el RECEPTOR tiene interés en acceder a parte de dicha Información Confidencial para evaluar posibles oportunidades de negocio.", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "III. Que ambas partes desean proteger la Información Confidencial y regular los términos bajo los cuales se producirá el intercambio de la misma.", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "Y ", size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "CONVIENEN", bold: true, size: 24, font: "Times New Roman" }),
                        new TextRun({ text: " celebrar el presente Acuerdo de Confidencialidad que se regirá por las siguientes:", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: "CLÁUSULAS", bold: true, size: 28, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "PRIMERA - OBJETO", bold: true, size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "El presente Acuerdo tiene por objeto establecer las condiciones bajo las cuales la PARTE DIVULGADORA proporcionará al RECEPTOR cierta Información Confidencial, y las obligaciones que el RECEPTOR adquiere respecto a dicha información.", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "SEGUNDA - DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL", bold: true, size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "A efectos del presente Acuerdo, se considera \"Información Confidencial\" toda aquella información, documentación o datos, cualquiera que sea su naturaleza (verbal, escrita, visual, electrónica, en soporte papel, magnético u óptico, etc.) que tenga carácter secreto o no público, y que la PARTE DIVULGADORA comunique o haga accesible al RECEPTOR, incluyendo pero no limitándose a:", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "a) Información sobre activos inmobiliarios (propiedades, edificios, suelos, hoteles, etc.).", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "b) Datos de inversores, leads, mandatarios y colaboradores.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "c) Información financiera, económica y comercial.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "d) Estrategias de negocio, planes de marketing y expansión.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "e) Dossiers técnicos, estudios de mercado y cualquier otra documentación relacionada.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "TERCERA - OBLIGACIONES DEL RECEPTOR", bold: true, size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "El RECEPTOR se compromete a:", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ text: "" }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "a) Mantener la más absoluta confidencialidad sobre la Información Confidencial, adoptando medidas de protección adecuadas para evitar su divulgación no autorizada.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "b) No comunicar la Información Confidencial a terceros sin el consentimiento previo y por escrito de la PARTE DIVULGADORA.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "c) No utilizar la Información Confidencial para fines distintos a los específicamente autorizados.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "d) Limitar el acceso a la Información Confidencial a aquellos empleados o colaboradores que necesiten conocerla, garantizando que estén sujetos a obligaciones de confidencialidad equivalentes.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "e) Devolver o destruir toda la Información Confidencial recibida a simple requerimiento de la PARTE DIVULGADORA, o en todo caso, al finalizar la relación comercial.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "CUARTA - EXCLUSIONES", bold: true, size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "No se considerará Información Confidencial aquella que:", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ text: "" }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "a) Sea o devenga públicamente disponible sin violación del presente Acuerdo.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "b) Era conocida por el RECEPTOR antes de su comunicación por la PARTE DIVULGADORA.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "c) Sea recibida de terceros de forma legítima y sin restricción de confidencialidad.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "d) Sea desarrollada independientemente por el RECEPTOR sin uso de la Información Confidencial.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "QUINTA - DURACIÓN", bold: true, size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "El presente Acuerdo entrará en vigor desde la fecha de su firma y permanecerá vigente durante un período de ", size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "[2/3/5]", bold: true, size: 24, font: "Times New Roman" }),
                        new TextRun({ text: " años, salvo que cualquiera de las partes lo denuncie mediante comunicación escrita con una antelación mínima de 30 días.", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "Las obligaciones de confidencialidad contenidas en el presente Acuerdo permanecerán en vigor durante ", size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "[5 años]", bold: true, size: 24, font: "Times New Roman" }),
                        new TextRun({ text: " adicionales tras su terminación.", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "SEXTA - PROPIEDAD INTELECTUAL", bold: true, size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "La Información Confidencial sigue siendo propiedad exclusiva de la PARTE DIVULGADORA. El presente Acuerdo no otorga al RECEPTOR ningún derecho, licencia o interés sobre dicha información más allá de lo expresamente establecido.", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "SÉPTIMA - INCUMPLIMIENTO", bold: true, size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "El incumplimiento de las obligaciones contenidas en el presente Acuerdo facultará a la PARTE DIVULGADORA para:", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ text: "" }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "a) Reclamar la indemnización por daños y perjuicios que corresponda.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "b) Considerar resuelto el presente Acuerdo de forma inmediata.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: "c) Abandonar cualquier negociación o relación comercial con el RECEPTOR.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "OCTAVA - LEGISLACIÓN APLICABLE Y JURISDICCIÓN", bold: true, size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "El presente Acuerdo se rige por la legislación española. Para cualquier controversia derivada de la interpretación o ejecución del mismo, ambas partes se someten a los Juzgados y Tribunales de ", size: 24, font: "Times New Roman" }),
                        new TextRun({ text: "[Ciudad]", bold: true, size: 24, font: "Times New Roman" }),
                        new TextRun({ text: ", con expresa renuncia a cualquier otro fuero que pudiera corresponderles.", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({ text: "Y en prueba de conformidad, ambas partes firman el presente Acuerdo por duplicado y a un solo efecto, en el lugar y fecha indicados en el encabezamiento.", size: 24, font: "Times New Roman" }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "LA PARTE DIVULGADORA", bold: true, size: 22, font: "Times New Roman" })] }),
                                        new Paragraph({ text: "" }),
                                        new Paragraph({ text: "" }),
                                        new Paragraph({ text: "" }),
                                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Fdo.: ________________________", size: 22, font: "Times New Roman" })] }),
                                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "[Nombre y Apellidos]", size: 20, font: "Times New Roman" })] }),
                                    ],
                                }),
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EL RECEPTOR", bold: true, size: 22, font: "Times New Roman" })] }),
                                        new Paragraph({ text: "" }),
                                        new Paragraph({ text: "" }),
                                        new Paragraph({ text: "" }),
                                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Fdo.: ________________________", size: 22, font: "Times New Roman" })] }),
                                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "[Nombre y Apellidos]", size: 20, font: "Times New Roman" })] }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    writeFileSync('/Users/albertogala/Library/CloudStorage/Dropbox/Alea Antigravity/docs/NDA_Acuerdo_Confidencialidad.docx', buffer);
    console.log('NDA creado: docs/NDA_Acuerdo_Confidencialidad.docx');
}

generateNDA().catch(console.error);