import { jsPDF } from "jspdf";

interface Interviniente {
  nombre: string;
  dni: string;
  email: string;
  rol: string;
}

const LOGO_URL = "https://if8rkq6j.insforge.site/api/storage/buckets/nda/objects/logo-alea.png";

export async function generateNdaPDF(
  intervinientes: Interviniente[],
  fecha: string
): Promise<{ base64: string; fileName: string }> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 25;

  try {
    const logoResponse = await fetch(LOGO_URL);
    if (logoResponse.ok) {
      const logoBuffer = await logoResponse.arrayBuffer();
      doc.addImage(new Uint8Array(logoBuffer), "PNG", margin, 10, 30, 15);
      y = 35;
    }
  } catch (e) {
    console.warn("Could not load logo:", e);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ACUERDO DE CONFIDENCIALIDAD (NDA)", pageWidth / 2, y, { align: "center" });
  y += 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Alea Signature", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`En Málaga, a ${fecha}`, pageWidth - margin, y, { align: "right" });
  y += 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("REUNIDOS", margin, y);
  y += 8;

  intervinientes.forEach((interviniente, index) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${index + 1}. `, margin, y);
    const ordinal = index === 0 ? "PRIMERO" : index === 1 ? "SEGUNDO" : index === 2 ? "TERCERO" : `${index + 1}º`;
    doc.text(`${ordinal}. D./D.ª ${interviniente.nombre}`, margin + 8, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`   Mayor de edad, con DNI nº ${interviniente.dni}`, margin, y);
    y += 5;
    doc.text(`   Email: ${interviniente.email}`, margin, y);
    y += 5;
    doc.text(`   Acting in: ${interviniente.rol}`, margin, y);
    y += 8;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Todos ellos, en lo sucesivo, conjuntamente denominados Las Partes, reconociéndose mutua capacidad legal suficiente.",
    margin,
    y
  );
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("EXPONEN", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const expositivo1 = [
    "I. Que Las Partes han convenido iniciar una serie de negociaciones tendentes a la búsqueda, evaluación, selección, mediación y presentación de inversores con el objeto de vender, comprar, arrendar o cualquier forma legalmente prevista de cualquier tipo de activos tangibles o intangibles en los que sea necesaria una consultora y/o asesores legales.",
  ];
  const lines1 = doc.splitTextToSize(expositivo1[0], contentWidth);
  doc.text(lines1, margin, y);
  y += lines1.length * 4 + 5;

  const expositivo2 = [
    "II. Que para Las Partes es esencial y constituye negociación necesaria para cualquier tipo de acuerdo que por ambas se asuma las obligaciones de secreto y confidencialidad respecto de la Información (según se define más adelante) a la que cada Parte tenga acceso.",
  ];
  const lines2 = doc.splitTextToSize(expositivo2[0], contentWidth);
  doc.text(lines2, margin, y);
  y += lines2.length * 4 + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ACUERDAN", margin, y);
  y += 8;

  const clauses = [
    {
      title: "Primero. DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL",
      content:
        "Se entenderá por Información Confidencial cualquier información, documentación o dato revelado por cualquiera de Las Partes a las demás, en cualquier soporte (oral, escrito, digital o físico), incluyendo pero no limitándose a: información sobre clientes, proveedores y socios comerciales, datos financieros, información sobre activos e inversiones, planes estratégicos, know-how y secretos industriales.",
    },
    {
      title: "Segundo. DE LA OBLIGACIÓN DE SECRETO Y CONFIDENCIALIDAD",
      content:
        "Por el presente documento, Las Partes se comprometen y obligan, durante el plazo de dos (2) años desde la fecha del presente acuerdo, a: (1) mantener el más estricto secreto y confidencialidad sobre toda la Información; (2) no revelar dicha Información sin consentimiento expreso de la otra Parte; (3) actuar con la mayor diligencia para evitar la publicación o revelación; (4) no utilizar la Información en beneficio propio ni para competir deslealmente.",
    },
    {
      title: "Tercero. EMPLEADOS, DIRECTIVOS Y COLABORADORES",
      content:
        "Las Partes se obligan a restringir la comunicación de la Información a las personas que deban necesariamente conocerla. Las Partes deberán hacer lo necesario para que todas aquellas personas a las que la Información sea revelada conozcan los términos de este Acuerdo, respondiendo solidaria e ilimitadamente por los daños y perjuicios que pudieran seguirse.",
    },
    {
      title: "Cuarto. EXCEPCIONES",
      content:
        "La obligación de confidencialidad no es aplicable a: (i) información ya de dominio público; (ii) información legítimamente en poder de la Parte receptora; (iii) información recibida de terceros sin obligación de confidencialidad; (iv) comunicaciones requeridas por autoridad competente.",
    },
    {
      title: "Quinto. FINALIDAD",
      content: "Toda la información será utilizada únicamente con la finalidad indicada en el Expositivo I de este documento.",
    },
    {
      title: "Sexto. EXTENSIÓN DE LA OBLIGACIÓN",
      content:
        "Las obligaciones se extienden al hecho mismo de la iniciación de negociaciones y a la existencia de este Acuerdo.",
    },
    {
      title: "Séptimo. PROPIEDAD DE LA INFORMACIÓN",
      content:
        "La Información continuará siendo de propiedad exclusiva de la Parte que la comunique. En caso de incumplimiento, la otra Parte podrá exigir la inmediata devolución y destrucción de toda la Información.",
    },
    {
      title: "Octavo. INCUMPLIMIENTO",
      content: "El incumplimiento dará lugar a la indemnización de todos los daños y perjuicios causados.",
    },
    {
      title: "Noveno. JURISDICCIÓN Y FUERO",
      content:
        "Para resolver cualquier cuestión derivada de este Acuerdo, ambas partes se someten expresamente a los Juzgados y Tribunales de Málaga.",
    },
  ];

  clauses.forEach((clause) => {
    if (y > 250) {
      doc.addPage();
      y = 25;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(clause.title, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const clauseLines = doc.splitTextToSize(clause.content, contentWidth);
    doc.text(clauseLines, margin, y);
    y += clauseLines.length * 3.5 + 5;
  });

  y += 10;
  if (y > 240) {
    doc.addPage();
    y = 25;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("FIRMAS", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("En prueba de conformidad, Las Partes FIRMAN el presente Acuerdo de Confidencialidad.", margin, y);
  y += 15;

  const signatureBoxWidth = (contentWidth - 10) / 2;
  const signatureBoxHeight = 30;

  intervinientes.forEach((interviniente, index) => {
    const xPos = index === 0 ? margin : margin + signatureBoxWidth + 10;

    doc.setDrawColor(200);
    doc.rect(xPos, y, signatureBoxWidth, signatureBoxHeight);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(interviniente.nombre, xPos + 5, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`DNI: ${interviniente.dni}`, xPos + 5, y + 14);
    doc.text("Firma:", xPos + 5, y + 22);
    doc.line(xPos + 15, y + 22, xPos + signatureBoxWidth - 5, y + 22);
    doc.text("Fecha:", xPos + 5, y + 28);
    doc.line(xPos + 15, y + 28, xPos + signatureBoxWidth - 5, y + 28);
  });

  const fileName = `NDA_AleaSignature_${fecha.replace(/\s/g, "_")}.pdf`;
  const base64 = doc.output("datauristring").split(",")[1];

  return { base64, fileName };
}
