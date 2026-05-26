/**
 * Alea Signature - NDA Generator Edge Function
 * Genera PDF de Acuerdo de Confidencialidad (NDA) en formato A4
 * 
 * Request body:
 * {
 *   intervinientes: Array<{ nombre: string, dni: string, email: string, rol: string }>,
 *   fecha: string  // ej: "23 de mayo de 2026"
 * }
 * 
 * Response:
 * { base64: string, fileName: string, mimeType: "application/pdf" }
 */

const LOGO_URL = "https://if8rkq6j.insforge.site/api/storage/buckets/nda/objects/logo-alea.png";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateNdaHtml(intervinientes, fecha) {
  const intervinientesHtml = intervinientes.map((p, i) => {
    const ordinal = i === 0 ? "PRIMERO" : i === 1 ? "SEGUNDO" : i === 2 ? "TERCERO" : `${i + 1}º`;
    return `<div class="interviniente">
  <p class="ordinal">${ordinal}. D./D.ª <strong>${escapeHtml(p.nombre)}</strong></p>
  <p>Mayor de edad, con DNI nº ${escapeHtml(p.dni)}</p>
  <p>Email: ${escapeHtml(p.email)}</p>
  <p>Acting in: ${escapeHtml(p.rol)}</p>
</div>`;
  }).join('');

  const firmasHtml = intervinientes.map(p => `
  <div class="firma-caja">
    <p class="firma-nombre"><strong>${escapeHtml(p.nombre)}</strong></p>
    <p>DNI: ${escapeHtml(p.dni)}</p>
    <p>Firma: ________________________</p>
    <p>Fecha: ________________________</p>
  </div>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 11px; color: #222; padding: 40px 50px; line-height: 1.5; }
  .header { text-align: center; margin-bottom: 20px; }
  .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
  .header .empresa { font-size: 14px; font-weight: bold; text-align: left; margin-bottom: 4px; }
  .header .fecha { font-size: 10px; text-align: right; margin-top: 4px; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 13px; font-weight: bold; margin-bottom: 6px; margin-top: 12px; }
  .interviniente { margin-left: 20px; margin-bottom: 8px; }
  .ordinal { font-weight: bold; }
  p { margin-bottom: 4px; }
  .clausula { margin-bottom: 10px; page-break-inside: avoid; }
  .clausula-title { font-weight: bold; margin-bottom: 3px; }
  .clausula-content { text-align: justify; font-size: 10px; }
  .firmas-container { margin-top: 30px; }
  .firmas-grid { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; }
  .firma-caja {
    border: 1px solid #666;
    padding: 15px;
    min-width: 200px;
    flex: 1;
  }
  .firma-nombre { font-size: 11px; margin-bottom: 6px; }
  .firma-caja p { font-size: 9px; margin-bottom: 6px; }
  .firma-caja p:last-child { margin-bottom: 0; }
  .intro-text { margin-bottom: 16px; }
  @media print {
    .clausula { page-break-inside: avoid; }
    .firma-caja { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>ACUERDO DE CONFIDENCIALIDAD (NDA)</h1>
  <p class="empresa">Alea Signature</p>
  <p class="fecha">En Málaga, a ${escapeHtml(fecha)}</p>
</div>

<div class="section">
  <p class="section-title">REUNIDOS</p>
  <p class="intro-text">Todos ellos, en lo sucesivo, conjuntamente denominados Las Partes, reconociéndose mutua capacidad legal suficiente.</p>
  ${intervinientesHtml}
</div>

<div class="section">
  <p class="section-title">EXPONEN</p>
  <p><strong>I.</strong> Que Las Partes han convenido iniciar una serie de negociaciones tendentes a la búsqueda, evaluación, selección, mediación y presentación de inversores con el objeto de vender, comprar, arrendar o cualquier forma legalmente prevista de cualquier tipo de activos tangibles o intangibles en los que sea necesaria una consultora y/o asesores legales.</p>
  <br>
  <p><strong>II.</strong> Que para Las Partes es esencial y constituye negociación necesaria para cualquier tipo de acuerdo que por ambas se asuma las obligaciones de secreto y confidencialidad respecto de la Información (según se define más adelante) a la que cada Parte tenga acceso.</p>
</div>

<div class="section">
  <p class="section-title">ACUERDAN</p>

  <div class="clausula">
    <p class="clausula-title">Primero. DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL</p>
    <p class="clausula-content">Se entenderá por Información Confidencial cualquier información, documentación o dato revelado por cualquiera de Las Partes a las demás, en cualquier soporte (oral, escrito, digital o físico), incluyendo pero no limitándose a: información sobre clientes, proveedores y socios comerciales, datos financieros, información sobre activos e inversiones, planes estratégicos, know-how y secretos industriales.</p>
  </div>

  <div class="clausula">
    <p class="clausula-title">Segundo. DE LA OBLIGACIÓN DE SECRETO Y CONFIDENCIALIDAD</p>
    <p class="clausula-content">Por el presente documento, Las Partes se comprometen y obligan, durante el plazo de dos (2) años desde la fecha del presente acuerdo, a: (1) mantener el más estricto secreto y confidencialidad sobre toda la Información; (2) no revelar dicha Información sin consentimiento expreso de la otra Parte; (3) actuar con la mayor diligencia para evitar la publicación o revelación; (4) no utilizar la Información en beneficio propio ni para competir deslealmente.</p>
  </div>

  <div class="clausula">
    <p class="clausula-title">Tercero. EMPLEADOS, DIRECTIVOS Y COLABORADORES</p>
    <p class="clausula-content">Las Partes se obligan a restringir la comunicación de la Información a las personas que deban necesariamente conocerla. Las Partes deberán hacer lo necesario para que todas aquellas personas a las que la Información sea revelada conozcan los términos de este Acuerdo, respondiendo solidaria e ilimitadamente por los daños y perjuicios que pudieran seguirse.</p>
  </div>

  <div class="clausula">
    <p class="clausula-title">Cuarto. EXCEPCIONES</p>
    <p class="clausula-content">La obligación de confidencialidad no es aplicable a: (i) información ya de dominio público; (ii) información legítimamente en poder de la Parte receptora; (iii) información recibida de terceros sin obligación de confidencialidad; (iv) comunicaciones requeridas por autoridad competente.</p>
  </div>

  <div class="clausula">
    <p class="clausula-title">Quinto. FINALIDAD</p>
    <p class="clausula-content">Toda la información será utilizada únicamente con la finalidad indicada en el Expositivo I de este documento.</p>
  </div>

  <div class="clausula">
    <p class="clausula-title">Sexto. EXTENSIÓN DE LA OBLIGACIÓN</p>
    <p class="clausula-content">Las obligaciones se extienden al hecho mismo de la iniciación de negociaciones y a la existencia de este Acuerdo.</p>
  </div>

  <div class="clausula">
    <p class="clausula-title">Séptimo. PROPIEDAD DE LA INFORMACIÓN</p>
    <p class="clausula-content">La Información continuará siendo de propiedad exclusiva de la Parte que la comunique. En caso de incumplimiento, la otra Parte podrá exigir la inmediata devolución y destrucción de toda la Información.</p>
  </div>

  <div class="clausula">
    <p class="clausula-title">Octavo. INCUMPLIMIENTO</p>
    <p class="clausula-content">El incumplimiento dará lugar a la indemnización de todos los daños y perjuicios causados.</p>
  </div>

  <div class="clausula">
    <p class="clausula-title">Noveno. JURISDICCIÓN Y FUERO</p>
    <p class="clausula-content">Para resolver cualquier cuestión derivada de este Acuerdo, ambas partes se someten expresamente a los Juzgados y Tribunales de Málaga.</p>
  </div>
</div>

<div class="firmas-container">
  <p class="section-title">FIRMAS</p>
  <p style="margin-bottom: 15px;">En prueba de conformidad, Las Partes FIRMAN el presente Acuerdo de Confidencialidad.</p>
  <div class="firmas-grid">
    ${firmasHtml}
  </div>
</div>
</body>
</html>`;
}

function textToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed. Use POST.',
      example: { intervinientes: [{ nombre: 'Test', dni: '12345678A', email: 'test@test.com', rol: 'Comprador' }], fecha: '23 de mayo de 2026' }
    }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { intervinientes, fecha } = body;

  if (!intervinientes || !Array.isArray(intervinientes) || intervinientes.length < 2) {
    return new Response(JSON.stringify({ error: 'Se requieren al menos 2 intervinientes' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!fecha || typeof fecha !== 'string') {
    return new Response(JSON.stringify({ error: 'Se requiere campo fecha (string)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  for (const p of intervinientes) {
    if (!p.nombre || !p.dni || !p.email || !p.rol) {
      return new Response(JSON.stringify({ error: 'Cada interviniente requiere: nombre, dni, email, rol' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  }

  const html = generateNdaHtml(intervinientes, fecha);
  const base64 = textToBase64(html);
  const fileName = `NDA_AleaSignature_${fecha.replace(/\s/g, '_')}.html`;

  return new Response(JSON.stringify({
    base64,
    fileName,
    mimeType: 'text/html',
    generatedAt: new Date().toISOString(),
    nota: 'El NDA se genera como HTML imprimible. Para PDF, imprimir desde el navegador.'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

module.exports = async function(request) {
  return handler(request);
}