export interface CommissionInput {
  honorarioNeto: number;
  perfilAgente: 'senior' | 'junior';
  tieneReferidor: boolean;
  hitosCompletados: ('apertura' | 'gestion' | 'cierre')[];
  nombreAgente?: string;
  nombreReferidor?: string;
  nombreMentor?: string;
}

export interface CommissionBreakdown {
  margenCorporativo: number;
  bonusPoolTotal: number;
  agente: number;
  referidor?: number;
  mentor?: number;
  porHito: {
    apertura: number;
    gestion: number;
    cierre: number;
  };
  detalle: {
    agenteSeniorSolo: number;
    agenteSeniorConReferidor: number;
    agenteJuniorConMentor: number;
  };
}

const ESTRUCTURA = {
  margenCorporativo: 0.40,
  bonusPool: 0.60,
  agenteSenior: {
    solo: 1.0,
    conReferidor: {
      agente: 0.75,
      referidor: 0.25
    }
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

export function calcularComisiones(input: CommissionInput): CommissionBreakdown {
  const { honorarioNeto, perfilAgente, tieneReferidor, hitosCompletados } = input;

  const margenCorporativo = honorarioNeto * ESTRUCTURA.margenCorporativo;
  const bonusPoolTotal = honorarioNeto * ESTRUCTURA.bonusPool;

  let agente = 0;
  let referidor = 0;
  let mentor = 0;

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
    referidor,
    mentor,
    porHito,
    detalle: {
      agenteSeniorSolo: bonusPoolTotal * ESTRUCTURA.agenteSenior.solo,
      agenteSeniorConReferidor: bonusPoolTotal * ESTRUCTURA.agenteSenior.conReferidor.agente,
      agenteJuniorConMentor: bonusPoolTotal * ESTRUCTURA.agenteJunior.agente
    }
  };
}

export function formatearComision(formato: 'EUR' | 'USD' = 'EUR', simbolo = '€'): (monto: number) => string {
  return (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: formato,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };
}

export function generarResumenComisiones(input: CommissionInput): string {
  const breakdown = calcularComisiones(input);
  const format = formatearComision();

  let resumen = `📊 **RESUMEN DE COMISIONES - Alea Signature**\n\n`;
  resumen += `💰 Honorario Neto: ${format(input.honorarioNeto)}\n\n`;

  resumen += `--- CAJA ALEA (40%) ---\n`;
  resumen += `Margen Corporativo: ${format(breakdown.margenCorporativo)}\n\n`;

  resumen += `--- BONUS POOL (60%) ---\n`;
  resumen += `Total Pool: ${format(breakdown.bonusPoolTotal)}\n\n`;

  if (input.perfilAgente === 'senior') {
    resumen += `👤 AGENTE SENIOR\n`;
    if (input.tieneReferidor && input.nombreReferidor) {
      resumen += `- Agente (75%): ${format(breakdown.agente)}\n`;
      resumen += `- Referidor: ${format(breakdown.referidor!)}\n`;
    } else {
      resumen += `- Agente (100%): ${format(breakdown.agente)}\n`;
    }
  } else {
    resumen += `👤 AGENTE JUNIOR\n`;
    resumen += `- Agente (60%): ${format(breakdown.agente)}\n`;
    resumen += `- Mentor (40%): ${format(breakdown.mentor!)}\n`;
  }

  resumen += `\n--- REPARTO POR HITO ---\n`;
  resumen += `Apertura (25%): ${format(breakdown.porHito.apertura)}\n`;
  resumen += `Gestión (50%): ${format(breakdown.porHito.gestion)}\n`;
  resumen += `Cierre (25%): ${format(breakdown.porHito.cierre)}\n`;

  return resumen;
}

export function calcularRentabilidad(honorarioBruto: number, gastosOperacion: number = 0): {
  honorarioNeto: number;
  cajaAlea: number;
  beneficioNeto: number;
} {
  const honorarioNeto = honorarioBruto - gastosOperacion;
  const cajaAlea = honorarioNeto * 0.40;
  const beneficioNeto = cajaAlea + (honorarioNeto * 0.60) - gastosOperacion;

  return {
    honorarioNeto,
    cajaAlea,
    beneficioNeto
  };
}
