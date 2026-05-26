/**
 * Alea Signature - Reporting Edge Function
 * Generación de reportes para Family Offices y stakeholders
 * 
 * POST /functions/reporting
 * 
 * Tipos:
 *   pipeline     → Estado del pipeline Kanban
 *   investors    → Estadísticas de inversores
 *   portfolio     → Portfolio de activos
 *   due_diligence → Operaciones en DD
 *   commissions  → Resumen de comisiones
 */

const BASE = 'https://if8rkq6j.eu-central.insforge.app';

async function fetchInsForge(path, options = {}) {
  const API_KEY = process.env.INSFORGE_API_KEY || 'ik_dbb952a6fd01508d4ae7f53b36e23eaf';
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`InsForge ${res.status}: ${text}`);
  }
  return res.json();
}

function renderMarkdown(tipo, data, periodo) {
  const lines = [`# Reporte: ${tipo}`, `**Periodo:** ${periodo.desde} → ${periodo.hasta}`, `**Generado:** ${new Date().toISOString()}`, ''];

  if (tipo === 'pipeline') {
    lines.push('## Estado del Pipeline');
    lines.push('| Zona | Operaciones |');
    lines.push('|------|-------------|');
    for (const [zona, count] of Object.entries(data.stats || {})) {
      lines.push(`| ${zona} | ${count} |`);
    }
    lines.push('');
    lines.push(`**Total:** ${data.total_operaciones} operaciones`);
    lines.push(`**Tasa conversión:** ${data.tasa_conversion}%`);
    lines.push(`**Operaciones bloqueadas:** ${data.bloqueadas}`);
  }

  if (tipo === 'investors') {
    lines.push('## Estadísticas de Inversores');
    lines.push(`**Total inversores:** ${data.total}`);
    lines.push(`**Verificados:** ${data.stats?.por_estado?.Verificado || 0}`);
    lines.push(`**Pendientes:** ${data.stats?.por_estado?.Pendiente || 0}`);
    lines.push(`**Capacidad total estimada:** ${data.capacidad_total}`);
  }

  if (tipo === 'portfolio') {
    lines.push('## Portfolio de Activos');
    lines.push(`**Total activos:** ${data.total}`);
    lines.push(`**Valor total:** €${(data.valor_total / 1000000).toFixed(1)}M`);
    lines.push(`**Por tipo:**`);
    for (const [tipo, count] of Object.entries(data.por_tipo || {})) {
      lines.push(`  - ${tipo}: ${count}`);
    }
  }

  return lines.join('\n');
}

async function handlePipeline(periodo) {
  let ops = [];
  try { ops = await fetchInsForge('/rest/v1/operaciones?select=zona_actual,created_at,updated_at'); } catch { ops = []; }
  
  const stats = {};
  for (const op of ops) {
    stats[op.zona_actual] = (stats[op.zona_actual] || 0) + 1;
  }
  
  const total = ops.length;
  const done = stats['Done'] || 0;
  const tasa = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    tipo_reporte: 'pipeline',
    stats,
    total_operaciones: total,
    tasa_conversion: tasa,
    bloqueadas: stats['Due Diligence'] || 0,
    periodo,
    contenido_markdown: renderMarkdown('pipeline', { stats, total_operaciones: total, tasa_conversion: tasa, bloqueadas: stats['Due Diligence'] || 0 }, periodo),
  };
}

async function handleInvestors(periodo) {
  let investors = [];
  try { investors = await fetchInsForge('/rest/v1/investors?select=kyc_estado,tipo_inversor,capacidad_estimada'); } catch { investors = []; }

  const stats = { por_estado: {}, por_tipo: {} };
  let capacidad_total = 0;
  for (const inv of investors) {
    stats.por_estado[inv.kyc_estado] = (stats.por_estado[inv.kyc_estado] || 0) + 1;
    stats.por_tipo[inv.tipo_inversor] = (stats.por_tipo[inv.tipo_inversor] || 0) + 1;
  }

  return {
    tipo_reporte: 'investors',
    total: investors.length,
    stats,
    capacidad_total: capacidad_total,
    periodo,
    contenido_markdown: renderMarkdown('investors', { total: investors.length, stats, capacidad_total }, periodo),
  };
}

async function handlePortfolio(periodo) {
  let properties = [];
  try { properties = await fetchInsForge('/rest/v1/properties?select=asset_type,listing_price,status'); } catch { properties = []; }

  const por_tipo = {};
  let valor_total = 0;
  for (const p of properties) {
    por_tipo[p.asset_type] = (por_tipo[p.asset_type] || 0) + 1;
    valor_total += p.listing_price || 0;
  }

  return {
    tipo_reporte: 'portfolio',
    total: properties.length,
    por_tipo,
    valor_total,
    periodo,
    contenido_markdown: renderMarkdown('portfolio', { total: properties.length, por_tipo, valor_total }, periodo),
  };
}

async function handleDueDiligence(periodo) {
  let ops = [];
  try { ops = await fetchInsForge("/rest/v1/operaciones?zona_actual=eq.Due Diligence&select=id,nombre,zona_actual,updated_at"); } catch { ops = []; }

  return {
    tipo_reporte: 'due_diligence',
    operaciones: ops,
    total: ops.length,
    periodo,
  };
}

async function handleCommissions(periodo) {
  let ops = [];
  try { ops = await fetchInsForge("/rest/v1/operaciones?zona_actual=eq.Done&select=id,nombre,comision_total,comision_alea,comision_agente"); } catch { ops = []; }

  let total_comision = 0, total_alea = 0, total_agente = 0;
  for (const op of ops) {
    total_comision += op.comision_total || 0;
    total_alea += op.comision_alea || 0;
    total_agente += op.comision_agente || 0;
  }

  return {
    tipo_reporte: 'commissions',
    operaciones_cerradas: ops.length,
    total_comision,
    total_alea,
    total_agente,
    periodo,
  };
}

module.exports = async function handler(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON body requerido' }, { status: 400 });
  }

  const { action, tipo_reporte, fecha_desde, fecha_hasta, formato = 'json', incluir_detalle = false, operacion_id } = body;

  if (action !== 'generate') {
    return Response.json({ error: 'Solo action=generate disponible' }, { status: 400 });
  }

  const periodo = {
    desde: fecha_desde || '2024-01-01',
    hasta: fecha_hasta || new Date().toISOString().slice(0, 10),
  };

  try {
    let data;
    switch (tipo_reporte) {
      case 'pipeline':        data = await handlePipeline(periodo); break;
      case 'investors':       data = await handleInvestors(periodo); break;
      case 'portfolio':       data = await handlePortfolio(periodo); break;
      case 'due_diligence':   data = await handleDueDiligence(periodo); break;
      case 'commissions':     data = await handleCommissions(periodo); break;
      default:
        return Response.json({
          error: 'tipo_reporte desconocido',
          available: ['pipeline', 'investors', 'portfolio', 'due_diligence', 'commissions']
        }, { status: 400 });
    }

    data.generado = new Date().toISOString();
    data.formato = formato;

    if (formato === 'markdown') {
      return new Response(data.contenido_markdown, {
        headers: { 'Content-Type': 'text/markdown' }
      });
    }

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
