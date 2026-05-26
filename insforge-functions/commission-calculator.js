/**
 * Alea Signature - Commission Calculator Edge Function
 * Calcula desglose de comisiones según estructura Alea
 * 
 * Request body:
 * {
 *   honorarioNeto: number,          // ej: 100000
 *   perfilAgente: 'senior' | 'junior',
 *   tieneReferidor: boolean,
 *   hitosCompletados: ('apertura' | 'gestion' | 'cierre')[],
 *   nombreAgente?: string,
 *   nombreReferidor?: string,
 *   nombreMentor?: string
 * }
 * 
 * Response: CommissionBreakdown
 */

const ESTRUCTURA = {
  margenCorporativo: 0.40,
  bonusPool: 0.60,
  agenteSenior: {
    solo: 1.0,
    conReferidor: { agente: 0.75, referidor: 0.25 }
  },
  agenteJunior: {
    agente: 0.60,
    mentor: 0.40
  },
  hitos: {
    apertura: 0.25,
    gestion: 0.50,
    cierre: 0.25
  }
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function calcularComisiones(input) {
  const { honorarioNeto, perfilAgente, tieneReferidor } = input;

  const margenCorporativo = honorarioNeto * ESTRUCTURA.margenCorporativo;
  const bonusPoolTotal = honorarioNeto * ESTRUCTURA.bonusPool;

  let agente = 0, referidor = 0, mentor = 0;

  if (perfilAgente === 'senior') {
    if (tieneReferidor) {
      agente = bonusPoolTotal * ESTRUCTURA.agenteSenior.conReferidor.agente;
      referidor = bonusPoolTotal * ESTRUCTURA.agenteSenior.conReferidor.referidor;
    } else {
      agente = bonusPoolTotal * ESTRUCTURA.agenteSenior.solo;
    }
  } else {
    agente = bonusPoolTotal * ESTRUCTURA.agenteJunior.agente;
    mentor = bonusPoolTotal * ESTRUCTURA.agenteJunior.mentor;
  }

  const porHito = {
    apertura: margenCorporativo * ESTRUCTURA.hitos.apertura,
    gestion: margenCorporativo * ESTRUCTURA.hitos.gestion,
    cierre: margenCorporativo * ESTRUCTURA.hitos.cierre
  };

  return {
    margenCorporativo,
    bonusPoolTotal,
    agente,
    referidor: referidor || undefined,
    mentor: mentor || undefined,
    porHito,
    detalle: {
      agenteSeniorSolo: bonusPoolTotal * ESTRUCTURA.agenteSenior.solo,
      agenteSeniorConReferidor: bonusPoolTotal * ESTRUCTURA.agenteSenior.conReferidor.agente,
      agenteJuniorConMentor: bonusPoolTotal * ESTRUCTURA.agenteJunior.agente
    }
  };
}

function formatearEUR(monto) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(monto);
}

function generarResumen(input, breakdown) {
  const format = formatearEUR;
  let r = `📊 RESUMEN DE COMISIONES - Alea Signature\n`;
  r += `==========================================\n\n`;
  r += `💰 Honorario Neto: ${format(input.honorarioNeto)}\n\n`;
  r += `── CAJA ALEA (40%) ──\n`;
  r += `Margen Corporativo: ${format(breakdown.margenCorporativo)}\n\n`;
  r += `── BONUS POOL (60%) ──\n`;
  r += `Total Pool: ${format(breakdown.bonusPoolTotal)}\n\n`;

  if (input.perfilAgente === 'senior') {
    r += `👤 AGENTE SENIOR\n`;
    if (input.tieneReferidor && input.nombreReferidor) {
      r += `  Agente (75%): ${format(breakdown.agente)}\n`;
      r += `  Referidor: ${format(breakdown.referidor)}\n`;
    } else {
      r += `  Agente (100%): ${format(breakdown.agente)}\n`;
    }
  } else {
    r += `👤 AGENTE JUNIOR\n`;
    r += `  Agente (60%): ${format(breakdown.agente)}\n`;
    r += `  Mentor (40%): ${format(breakdown.mentor)}\n`;
  }

  r += `\n── REPARTO POR HITO ──\n`;
  r += `Apertura (25%): ${format(breakdown.porHito.apertura)}\n`;
  r += `Gestión (50%): ${format(breakdown.porHito.gestion)}\n`;
  r += `Cierre (25%): ${format(breakdown.porHito.cierre)}\n`;

  return r;
}

function calcularRentabilidad(honorarioBruto, gastosOperacion = 0) {
  const honorarioNeto = honorarioBruto - gastosOperacion;
  const cajaAlea = honorarioNeto * 0.40;
  const beneficioNeto = cajaAlea + (honorarioNeto * 0.60) - gastosOperacion;
  return { honorarioNeto, cajaAlea, beneficioNeto };
}

async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed. Use POST.',
      example: {
        honorarioNeto: 100000,
        perfilAgente: 'senior',
        tieneReferidor: false,
        hitosCompletados: ['apertura', 'gestion', 'cierre']
      }
    }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { honorarioNeto, perfilAgente, tieneReferidor, hitosCompletados, nombreAgente, nombreReferidor, nombreMentor, formato } = body;

  if (typeof honorarioNeto !== 'number' || honorarioNeto <= 0) {
    return new Response(JSON.stringify({ error: 'honorarioNeto debe ser un número positivo' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!['senior', 'junior'].includes(perfilAgente)) {
    return new Response(JSON.stringify({ error: 'perfilAgente debe ser "senior" o "junior"' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const input = { honorarioNeto, perfilAgente, tieneReferidor: !!tieneReferidor, hitosCompletados: hitosCompletados || [], nombreAgente, nombreReferidor, nombreMentor };
  const breakdown = calcularComisiones(input);

  const respuesta = {
    input: { honorarioNeto, perfilAgente, tieneReferidor: input.tieneReferidor, hitosCompletados: input.hitosCompletados },
    breakdown,
    rentabilidad: calcularRentabilidad(honorarioNeto)
  };

  if (formato === 'resumen') {
    return new Response(JSON.stringify({
      resumen: generarResumen(input, breakdown),
      breakdown: respuesta.breakdown
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify(respuesta), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

module.exports = async function(request) {
  return handler(request);
}