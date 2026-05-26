/**
 * Alea Signature - Dashboard Stats Edge Function
 * Gateway unificado: stats + pipeline CRUD + lead intake + CRUD genérico
 * 
 * POST /functions/dashboard-stats
 * Body: { "action": "all"|"stats"|"pipeline"|"lead"|"crud"|"signals"|"properties", ... }
 */

const BASE = 'https://if8rkq6j.eu-central.insforge.app';

async function fetchIF(path, options = {}) {
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

// ─── STATS ───────────────────────────────────────────────────────────────────

async function getStats() {
  let [properties, investors, signals] = await Promise.allSettled([
    fetchIF('/rest/v1/properties?select=id,listing_price&limit=1000'),
    fetchIF('/rest/v1/investors?select=id&limit=1000'),
    fetchIF('/rest/v1/signals?select=id,score&limit=100'),
  ]).then(r => r.map(r => r.status === 'fulfilled' ? r.value : []));

  const totalPortfolioValue = (properties || []).reduce((s, p) => s + (p.listing_price || 0), 0);
  const avgSignalScore = signals?.length
    ? Math.round((signals).reduce((s, s2) => s + (s2.score || 0), 0) / signals.length)
    : null;

  return {
    properties: (properties || []).length,
    investors: (investors || []).length,
    signals: (signals || []).length,
    totalPortfolioValue,
    avgSignalScore,
  };
}

// ─── PIPELINE ────────────────────────────────────────────────────────────────

const ZONAS = ['New Lead', 'Qualified', 'Due Diligence', 'Offer', 'Closing', 'Done', 'Canceled'];
const TRANSICIONES = {
  'New Lead': ['Qualified'], 'Qualified': ['Due Diligence', 'New Lead'],
  'Due Diligence': ['Offer', 'Qualified'], 'Offer': ['Closing', 'Due Diligence'],
  'Closing': ['Done', 'Offer'], 'Done': [], 'Canceled': [],
};

async function pipelineCreate(body) {
  const { nombre, activo_id, comprador_id, vendedor_id } = body;
  const now = new Date().toISOString();
  const record = {
    id: crypto.randomUUID(),
    nombre: nombre || `Operación ${now.slice(0, 10)}`,
    activo_id: activo_id || null, comprador_id: comprador_id || null, vendedor_id: vendedor_id || null,
    zona_actual: 'New Lead',
    historial_zonas: [{ zona: 'New Lead', timestamp: now, notas: 'Creación' }],
  };
  const result = await fetchIF('/rest/v1/operaciones', { method: 'POST', body: JSON.stringify(record) });
  return { operacion_id: record.id, zona_actual: 'New Lead', created_at: now };
}

async function pipelineList(body = {}) {
  const { zona, limit = 50 } = body;
  let query = `/rest/v1/operaciones?select=*&order=updated_at.desc&limit=${limit}`;
  if (zona) query += `&zona_actual=eq.${zona}`;
  const ops = await fetchIF(query);
  const all = await fetchIF('/rest/v1/operaciones?select=zona_actual');
  const stats = {};
  for (const op of (all || [])) stats[op.zona_actual] = (stats[op.zona_actual] || 0) + 1;
  return { operaciones: ops || [], stats };
}

async function pipelineMove(body) {
  const { operacion_id, zona_destino, notas = '' } = body;
  if (!ZONAS.includes(zona_destino)) return { error: `Zona inválida. Válidas: ${ZONAS.join(', ')}` };
  const ops = await fetchIF(`/rest/v1/operaciones?id=eq.${operacion_id}&limit=1`);
  if (!ops?.length) return { error: 'Operación no encontrada' };
  const op = ops[0];
  const permitidas = TRANSICIONES[op.zona_actual] || [];
  if (!permitidas.includes(zona_destino)) return { error: `No se puede mover de "${op.zona_actual}" a "${zona_destino}". Válidas: ${permitidas.join(', ')}` };
  if (zona_destino === 'Canceled' && !notas.trim()) return { error: 'Para cancelar se requieren notas' };
  const now = new Date().toISOString();
  const historial = [...(op.historial_zonas || []), { zona: zona_destino, timestamp: now, notas }];
  await fetchIF(`/rest/v1/operaciones?id=eq.${operacion_id}`, { method: 'PATCH', body: JSON.stringify({ zona_actual: zona_destino, historial_zonas: historial, updated_at: now }) });
  return { success: true, operacion_id, zona_anterior: op.zona_actual, zona_nueva: zona_destino, historial, fecha_cambio: now };
}

async function pipelineHistory(body) {
  const { operacion_id } = body;
  const ops = await fetchIF(`/rest/v1/operaciones?id=eq.${operacion_id}&select=historial_zonas,zona_actual&limit=1`);
  if (!ops?.length) return { error: 'Operación no encontrada' };
  return { success: true, operacion_id, zona_actual: ops[0].zona_actual, historial: ops[0].historial_zonas || [] };
}

// ─── LEAD INTAKE ─────────────────────────────────────────────────────────────

const CAPACIDAD_MAP = { '€1M-5M': 1, '€5M-10M': 5, '€10M-20M': 10, '€20M+': 20 };

function calcScore(lead) {
  const s = { '€1M-5M': 20, '€5M-10M': 40, '€10M-20M': 60, '€20M+': 80 };
  const t = { 'Inmediato': 80, 'Corto (1-3m)': 60, 'Medio (3-6m)': 40, 'Largo (>6m)': 20 };
  const f = { 'Exact match': 100, 'Partial': 60, 'Weak': 30 };
  const o = { 'Referido': 100, 'Evento': 80, 'LinkedIn': 60, 'Cold': 40, 'Otro': 30 };
  const total = Math.round((s[lead.capacidad_inversion] || 0) * .30 + (t[lead.timeline] || 0) * .25 + (f[lead.fit_score] || 30) * .25 + (o[lead.origen_lead] || 30) * .20);
  return { score: total, nivel: total >= 70 ? 'Premium' : total >= 50 ? 'Alto' : total >= 30 ? 'Medio' : 'Estándar' };
}

async function leadIntake(body) {
  const { lead } = body;
  if (!lead?.nombre_completo || !lead?.email) return { error: 'Faltan: nombre_completo, email' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return { error: 'Email inválido' };
  if ((CAPACIDAD_MAP[lead.capacidad_inversion] || 0) < 1) return { declined: true, message: 'Alea trabaja con inversores de al menos €1M.' };
  const { score, nivel } = calcScore(lead);
  const now = new Date().toISOString();
  const record = { ...lead, id: crypto.randomUUID(), score, nivel, zona: 'New Lead', kyc_estado: 'Pendiente', created_at: now, updated_at: now };
  await fetchIF('/rest/v1/leads_pipeline', { method: 'POST', body: JSON.stringify(record) });
  return { success: true, lead_id: record.id, score, nivel, zona: 'New Lead', siguiente_paso: nivel === 'Premium' ? 'Contactar 24h' : nivel === 'Alto' ? 'Invitar al portal' : 'Nurturing' };
}

async function leadList(body = {}) {
  const { zona, nivel, limit = 50 } = body;
  let q = `/rest/v1/leads_pipeline?select=*&order=created_at.desc&limit=${limit}`;
  if (zona) q += `&zona=eq.${zona}`;
  if (nivel) q += `&nivel=eq.${nivel}`;
  const data = await fetchIF(q);
  return { success: true, leads: data || [], total: (data || []).length };
}

async function leadQualify(body) {
  const { id, zona = 'Qualified' } = body;
  await fetchIF(`/rest/v1/leads_pipeline?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ zona, updated_at: new Date().toISOString() }) });
  return { success: true, lead_id: id, zona };
}

// ─── CRUD GENÉRICO ─────────────────────────────────────────────────────────

async function crudCreate(body) {
  const { tabla, data } = body;
  if (!tabla || !data) return { error: 'tabla y data requeridos' };
  const record = { ...data, id: data.id || crypto.randomUUID() };
  await fetchIF(`/rest/v1/${tabla}`, { method: 'POST', body: JSON.stringify(record) });
  return { success: true, id: record.id };
}

async function crudRead(body) {
  const { tabla, id, filtros } = body;
  if (!tabla) return { error: 'tabla requerida' };
  let q = `/rest/v1/${tabla}?select=*&limit=100`;
  if (id) q += `&id=eq.${id}`;
  else if (filtros) Object.entries(filtros).forEach(([k, v]) => q += `&${k}=eq.${v}`);
  const data = await fetchIF(q);
  return { success: true, data: id ? (data?.[0] || null) : data };
}

async function crudUpdate(body) {
  const { tabla, id, updates } = body;
  if (!tabla || !id) return { error: 'tabla e id requeridos' };
  await fetchIF(`/rest/v1/${tabla}?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }) });
  return { success: true };
}

async function crudDelete(body) {
  const { tabla, id } = body;
  if (!tabla || !id) return { error: 'tabla e id requeridos' };
  await fetchIF(`/rest/v1/${tabla}?id=eq.${id}`, { method: 'DELETE' });
  return { success: true };
}

// ─── SIGNALS ────────────────────────────────────────────────────────────────

async function getSignals() {
  const data = await fetchIF('/rest/v1/signals?select=*&order=created_at.desc&limit=20');
  return { signals: data || [] };
}

// ─── HANDLER ───────────────────────────────────────────────────────────────

module.exports = async function handler(request) {
  let body = {};
  try { body = await request.json(); } catch { return Response.json({ error: 'JSON body requerido' }, { status: 400 }); }

  const { action, subaction } = body;

  try {
    if (action === 'all' || action === 'stats') {
      return Response.json({ stats: await getStats(), scanner_version: '2.0.0', cached_at: new Date().toISOString() });
    }

    if (action === 'pipeline') {
      if (subaction === 'create') return Response.json(await pipelineCreate(body));
      if (subaction === 'list') return Response.json(await pipelineList(body));
      if (subaction === 'move') return Response.json(await pipelineMove(body));
      if (subaction === 'history') return Response.json(await pipelineHistory(body));
      return Response.json(await pipelineList(body));
    }

    if (action === 'lead') {
      if (subaction === 'intake') return Response.json(await leadIntake(body));
      if (subaction === 'list') return Response.json(await leadList(body));
      if (subaction === 'qualify') return Response.json(await leadQualify(body));
      return Response.json(await leadList(body));
    }

    if (action === 'crud') {
      if (subaction === 'create') return Response.json(await crudCreate(body));
      if (subaction === 'read') return Response.json(await crudRead(body));
      if (subaction === 'update') return Response.json(await crudUpdate(body));
      if (subaction === 'delete') return Response.json(await crudDelete(body));
      return Response.json({ error: 'crud subaction requerida: create|read|update|delete' }, { status: 400 });
    }

    if (action === 'signals') return Response.json(await getSignals());

    return Response.json({ error: 'action desconocida', available: ['all', 'stats', 'pipeline', 'lead', 'crud', 'signals'] }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};