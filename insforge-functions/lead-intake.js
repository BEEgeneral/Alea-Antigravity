/**
 * Alea Signature - Lead Intake Edge Function
 * Full CRUD para captura y cualificación de leads inversores
 * 
 * POST /functions/lead-intake
 * 
 * Actions:
 *   intake     → Registrar nuevo lead
 *   get        → Obtener lead por ID
 *   list       → Listar leads (con filtros)
 *   update     → Actualizar lead
 *   score      → Recalcular score
 *   qualify    → Marcar como qualificado
 * 
 * Tabla: leads_pipeline (existente)
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

// Scoring algorithm
function calculateScore(lead) {
  const capacityScores = { '€1M-5M': 20, '€5M-10M': 40, '€10M-20M': 60, '€20M+': 80 };
  const timelineScores = { 'Inmediato': 80, 'Corto (1-3m)': 60, 'Medio (3-6m)': 40, 'Largo (>6m)': 20 };
  const fitScores = { 'Exact match': 100, 'Partial': 60, 'Weak': 30 };
  const originScores = { 'Referido': 100, 'Evento': 80, 'LinkedIn': 60, 'Cold': 40, 'Otro': 30 };

  const cap = capacityScores[lead.capacidad_inversion] || 0;
  const time = timelineScores[lead.timeline] || 0;
  const fit = fitScores[lead.fit_score] || 30;
  const orig = originScores[lead.origen_lead] || 30;

  const total = Math.round(cap * 0.30 + time * 0.25 + fit * 0.25 + orig * 0.20);
  
  let nivel = 'Estándar';
  if (total >= 70) nivel = 'Premium';
  else if (total >= 50) nivel = 'Alto';
  else if (total >= 30) nivel = 'Medio';

  return { score: total, nivel };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handleIntake(body) {
  const { lead } = body;
  
  // Validaciones
  if (!lead?.nombre_completo || !lead?.email) {
    return Response.json({ error: 'Faltan campos requeridos: nombre_completo, email' }, { status: 400 });
  }
  if (!validateEmail(lead.email)) {
    return Response.json({ error: 'Email inválido', campo: 'email' }, { status: 400 });
  }
  
  // Filtrar capacidad < €1M
  const capacidadMap = { '€1M-5M': 1, '€5M-10M': 5, '€10M-20M': 10, '€20M+': 20 };
  const capacidadMin = capacidadMap[lead.capacidad_inversion] || 0;
  if (capacidadMin < 1) {
    return Response.json({
      declined: true,
      message: 'Alea Signature trabaja con inversores de al menos €1M de capacidad. Le mantendremos en reserva.'
    }, { status: 200 });
  }

  const { score, nivel } = calculateScore(lead);
  const now = new Date().toISOString();

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
    score,
    nivel,
    zona: 'New Lead',
    kyc_estado: 'Pendiente',
    created_at: now,
    updated_at: now,
  };

  const result = await fetchInsForge('/rest/v1/leads_pipeline', {
    method: 'POST',
    body: JSON.stringify(record),
  });

  return Response.json({
    success: true,
    lead_id: record.id,
    nombre: record.nombre_completo,
    tipo_perfil: record.tipo_perfil,
    capacidad: record.capacidad_inversion,
    pipeline_zona: record.zona,
    score,
    nivel,
    siguiente_paso: nivel === 'Premium' ? 'Contactar en 24h para qualificar perfil' :
                     nivel === 'Alto' ? 'Invitar a registrase en portal' :
                     'Mantener en nurturing',
  });
}

async function handleGet(body) {
  const { id } = body;
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 });

  const data = await fetchInsForge(`/rest/v1/leads_pipeline?id=eq.${id}&limit=1`);
  if (!data?.length) return Response.json({ error: 'Lead no encontrado' }, { status: 404 });

  return Response.json({ success: true, lead: data[0] });
}

async function handleList(body = {}) {
  const { zona, nivel, limit = 50, offset = 0 } = body;
  
  let query = `/rest/v1/leads_pipeline?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
  if (zona) query += `&zona=eq.${zona}`;
  if (nivel) query += `&nivel=eq.${nivel}`;

  const data = await fetchInsForge(query);
  const countRes = await fetchInsForge(`/rest/v1/leads_pipeline?select=id&zona=eq.${zona || 'New Lead'}`);
  
  return Response.json({
    success: true,
    leads: data,
    total: Array.isArray(countRes) ? countRes.length : 0,
    limit,
    offset,
  });
}

async function handleUpdate(body) {
  const { id, updates } = body;
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 });

  const { score, nivel } = calculateScore(updates);
  const now = new Date().toISOString();

  const result = await fetchInsForge(`/rest/v1/leads_pipeline?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...updates, score, nivel, updated_at: now }),
  });

  return Response.json({ success: true, updated: result });
}

async function handleScore(body) {
  const { id } = body;
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 });

  const data = await fetchInsForge(`/rest/v1/leads_pipeline?id=eq.${id}&limit=1`);
  if (!data?.length) return Response.json({ error: 'Lead no encontrado' }, { status: 404 });

  const { score, nivel } = calculateScore(data[0]);
  await fetchInsForge(`/rest/v1/leads_pipeline?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ score, nivel, updated_at: new Date().toISOString() }),
  });

  return Response.json({ success: true, lead_id: id, score, nivel });
}

async function handleQualify(body) {
  const { id, zona = 'Qualified' } = body;
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 });

  await fetchInsForge(`/rest/v1/leads_pipeline?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ zona, updated_at: new Date().toISOString() }),
  });

  return Response.json({ success: true, lead_id: id, zona });
}

module.exports = async function handler(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON body requerido' }, { status: 400 });
  }

  const { action } = body;

  try {
    switch (action) {
      case 'intake':    return handleIntake(body);
      case 'get':       return handleGet(body);
      case 'list':      return handleList(body);
      case 'update':    return handleUpdate(body);
      case 'score':     return handleScore(body);
      case 'qualify':   return handleQualify(body);
      default:
        return Response.json({
          error: 'Action desconocida',
          available: ['intake', 'get', 'list', 'update', 'score', 'qualify']
        }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
