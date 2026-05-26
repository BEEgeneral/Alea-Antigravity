/**
 * Alea Signature - CRUD Operations Gateway
 * Gateway para operaciones CRUD en tablas nuevas via InsForge
 * 
 * POST /functions/crud-ops
 * 
 * Actions:
 *   insert  → Insertar registro
 *   update  → Actualizar por ID
 *   delete  → Eliminar por ID
 *   list    → Listar con filtros
 * 
 * Tablas soportadas: operaciones, sequences, sequence_progress,
 *   mandantes, mandatos, collaborators, comisiones
 */

const BASE = 'https://if8rkq6j.eu-central.insforge.app';
const SUB_KEY = 'ik_dbb952a6fd01508d4ae7f53b36e23eaf';

const TABLAS = [
  'operaciones', 'sequences', 'sequence_progress',
  'mandantes', 'mandatos', 'collaborators', 'comisiones',
  'leads_pipeline', 'investors', 'properties'
];

async function ifFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUB_KEY,
      'Authorization': `Bearer ${SUB_KEY}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

async function handleInsert(body) {
  const { tabla, data } = body;
  if (!tabla || !data) return Response.json({ error: 'tabla y data requeridos' }, { status: 400 });
  if (!TABLAS.includes(tabla)) return Response.json({ error: `Tabla no soportada: ${tabla}` }, { status: 400 });
  if (!data.id) data.id = crypto.randomUUID();
  const result = await ifFetch(`/rest/v1/${tabla}`, { method: 'POST', body: JSON.stringify(data) });
  return Response.json({ success: true, id: data.id, tabla, inserted: result });
}

async function handleUpdate(body) {
  const { tabla, id, updates } = body;
  if (!tabla || !id || !updates) return Response.json({ error: 'tabla, id, updates requeridos' }, { status: 400 });
  if (!TABLAS.includes(tabla)) return Response.json({ error: `Tabla no soportada: ${tabla}` }, { status: 400 });
  const result = await ifFetch(`/rest/v1/${tabla}?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  return Response.json({ success: true, tabla, id, updated: result });
}

async function handleDelete(body) {
  const { tabla, id } = body;
  if (!tabla || !id) return Response.json({ error: 'tabla e id requeridos' }, { status: 400 });
  if (!TABLAS.includes(tabla)) return Response.json({ error: `Tabla no soportada: ${tabla}` }, { status: 400 });
  const result = await ifFetch(`/rest/v1/${tabla}?id=eq.${id}`, { method: 'DELETE' });
  return Response.json({ success: true, tabla, id, deleted: result });
}

async function handleList(body) {
  const { tabla, filters, limit = 50, offset = 0 } = body;
  if (!tabla) return Response.json({ error: 'tabla requerida' }, { status: 400 });
  if (!TABLAS.includes(tabla)) return Response.json({ error: `Tabla no soportada: ${tabla}` }, { status: 400 });
  let query = `/rest/v1/${tabla}?limit=${limit}&offset=${offset}`;
  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null) query += `&${k}=eq.${v}`;
    }
  }
  const data = await ifFetch(query);
  return Response.json({ success: true, tabla, data: Array.isArray(data) ? data : [], count: Array.isArray(data) ? data.length : 0 });
}

// Special operations
async function handlePipelineCreate(body) {
  const { nombre, activo_id, comprador_id, vendedor_id, mandatorio_id } = body;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const record = {
    id,
    nombre: nombre || `Operación ${now.slice(0, 10)}`,
    activo_id: activo_id || null,
    comprador_id: comprador_id || null,
    vendedor_id: vendedor_id || null,
    mandatorio_id: mandatorio_id || null,
    zona_actual: 'New Lead',
    historial_zonas: JSON.stringify([{ zona: 'New Lead', timestamp: now, notas: 'Creación vía Hermes Hub' }]),
    created_at: now,
    updated_at: now,
  };
  await ifFetch('/rest/v1/operaciones', { method: 'POST', body: JSON.stringify(record) });
  return Response.json({ success: true, operacion_id: id, zona_actual: 'New Lead', created_at: now });
}

async function handlePipelineMove(body) {
  const { operacion_id, zona_destino, notas } = body;
  if (!operacion_id || !zona_destino) return Response.json({ error: 'operacion_id y zona_destino requeridos' }, { status: 400 });

  const ZONAS = ['New Lead', 'Qualified', 'Due Diligence', 'Offer', 'Closing', 'Done', 'Canceled'];
  if (!ZONAS.includes(zona_destino)) return Response.json({ error: `Zona inválida. Válidas: ${ZONAS.join(', ')}` }, { status: 400 });
  if (zona_destino === 'Canceled' && !notas?.trim()) return Response.json({ error: 'Para cancelar requiere notas' }, { status: 400 });

  const ops = await ifFetch(`/rest/v1/operaciones?id=eq.${operacion_id}&limit=1`);
  if (!ops?.length) return Response.json({ error: 'Operación no encontrada' }, { status: 404 });

  const op = ops[0];
  const now = new Date().toISOString();
  let historial = op.historial_zonas || '[]';
  if (typeof historial === 'string') historial = JSON.parse(historial);
  historial.push({ zona: zona_destino, timestamp: now, notas: notas || '' });

  await ifFetch(`/rest/v1/operaciones?id=eq.${operacion_id}`, {
    method: 'PATCH',
    body: JSON.stringify({ zona_actual: zona_destino, historial_zonas: JSON.stringify(historial), updated_at: now }),
  });

  return Response.json({
    success: true, operacion_id, zona_anterior: op.zona_actual,
    zona_nueva: zona_destino, historial, fecha_cambio: now,
  });
}

async function handleLeadIntake(body) {
  const { lead } = body;
  if (!lead?.nombre_completo || !lead?.email) return Response.json({ error: 'nombre_completo y email requeridos' }, { status: 400 });

  const capacityScores = { '€1M-5M': 20, '€5M-10M': 40, '€10M-20M': 60, '€20M+': 80 };
  const timelineScores = { 'Inmediato': 80, 'Corto (1-3m)': 60, 'Medio (3-6m)': 40, 'Largo (>6m)': 20 };
  const originScores = { 'Referido': 100, 'Evento': 80, 'LinkedIn': 60, 'Cold': 40, 'Otro': 30 };

  const cap = capacityScores[lead.capacidad_inversion] || 0;
  const time = timelineScores[lead.timeline] || 0;
  const orig = originScores[lead.origen_lead] || 30;
  const total = Math.round(cap * 0.30 + time * 0.25 + orig * 0.20 + 30 * 0.25); // fit=30 default

  let nivel = total >= 70 ? 'Premium' : total >= 50 ? 'Alto' : total >= 30 ? 'Medio' : 'Estándar';
  const now = new Date().toISOString();

  // Check capacidad
  const capacidadMap = { '€1M-5M': 1, '€5M-10M': 5, '€10M-20M': 10, '€20M+': 20 };
  if ((capacidadMap[lead.capacidad_inversion] || 0) < 1) {
    return Response.json({ declined: true, message: 'Alea Signature trabaja con inversores de al menos €1M de capacidad.' });
  }

  const record = {
    id: crypto.randomUUID(),
    nombre_completo: lead.nombre_completo,
    email: lead.email,
    telefono: lead.telefono || null,
    entidad: lead.entidad || null,
    tipo_perfil: lead.tipo_perfil || 'Particular',
    capacidad_inversion: lead.capacidad_inversion,
    ubicacion_preferida: lead.ubicacion_preferida || null,
    timeline: lead.timeline || 'Medio (3-6m)',
    perfil_busqueda: lead.perfil_busqueda || null,
    origen_lead: lead.origen_lead || 'Otro',
    score: total,
    nivel,
    zona: 'New Lead',
    kyc_estado: 'Pendiente',
    created_at: now,
    updated_at: now,
  };

  await ifFetch('/rest/v1/leads_pipeline', { method: 'POST', body: JSON.stringify(record) });

  return Response.json({
    success: true, lead_id: record.id, nombre: record.nombre_completo,
    tipo_perfil: record.tipo_perfil, capacidad: record.capacidad_inversion,
    pipeline_zona: record.zona, score: total, nivel,
    siguiente_paso: nivel === 'Premium' ? 'Contactar en 24h' : nivel === 'Alto' ? 'Invitar al portal' : 'Nurturing',
  });
}

module.exports = async function handler(request) {
  let body = {};
  try { body = await request.json(); } catch { return Response.json({ error: 'JSON body requerido' }, { status: 400 }); }
  const { action } = body;

  try {
    switch (action) {
      case 'insert':           return handleInsert(body);
      case 'update':           return handleUpdate(body);
      case 'delete':           return handleDelete(body);
      case 'list':             return handleList(body);
      case 'pipeline_create':  return handlePipelineCreate(body);
      case 'pipeline_move':    return handlePipelineMove(body);
      case 'lead_intake':      return handleLeadIntake(body);
      default:
        return Response.json({
          error: 'Action desconocida',
          available: ['insert', 'update', 'delete', 'list', 'pipeline_create', 'pipeline_move', 'lead_intake']
        }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};