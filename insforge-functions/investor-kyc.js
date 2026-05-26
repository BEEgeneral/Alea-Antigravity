/**
 * Alea Signature - Investor KYC Edge Function
 * Full CRUD para directorio de inversores y proceso KYC
 * 
 * POST /functions/investor-kyc
 * 
 * Actions:
 *   register   → Registrar nuevo inversor
 *   get        → Obtener inversor
 *   list       → Listar inversores
 *   update     → Actualizar datos
 *   request_docs → Solicitar documentos KYC
 *   verify     → Verificar inversor
 *   reject     → Rechazar inversor
 * 
 * Tabla: investors (existente)
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

const KYC_ESTADOS = ['Pendiente', 'Verificado', 'Rechazado'];
const TIPO_INVERSOR = ['HNWI', 'UHNW', 'Family Office', 'Fondo Institucional', 'Particular'];
const VISIBILIDAD = ['private', 'public'];

const DOCS_POR_TIPO = {
  'HNWI': ['DNI/NIE', 'Certificado bancario', 'Referencias'],
  'UHNW': ['DNI/NIE', 'Estructura societaria', 'Referencias'],
  'Family Office': ['Certificación', 'Documentación corporativa', 'Referencias'],
  'Fondo': ['FCA/registro', 'Estructura', 'Referencias'],
  'Particular': ['DNI/NIE', 'Certificado ingresos'],
};

async function handleRegister(body) {
  const { data } = body;
  if (!data?.nombre || !data?.email) {
    return Response.json({ error: 'nombre y email requeridos' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const record = {
    id: crypto.randomUUID(),
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono || null,
    entidad: data.entidad || null,
    tipo_inversor: data.tipo_inversor || 'HNWI',
    visibilidad: data.visibilidad || 'private',
    capacidad_estimada: data.capacidad_estimada || null,
    kyc_estado: 'Pendiente',
    inversores_asociados: data.inversores_asociados || [],
    origen_lead: data.origen_lead || 'Otro',
    timeline: data.timeline || 'Medio (3-6m)',
    etiquetas: data.etiquetas || [],
    fecha_alta: now,
    ultima_actividad: now,
    profile_data: data.profile_data || {},
  };

  // Crear también en leads_pipeline si viene de lead
  if (data.lead_id) {
    try {
      await fetchInsForge('/rest/v1/leads_pipeline?id=eq.' + data.lead_id, {
        method: 'PATCH',
        body: JSON.stringify({ zona: 'Qualified', updated_at: now }),
      });
    } catch { /* ignore */ }
  }

  const result = await fetchInsForge('/rest/v1/investors', {
    method: 'POST',
    body: JSON.stringify(record),
  });

  return Response.json({
    success: true,
    investor_id: record.id,
    kyc_estado: 'Pendiente',
    documentos_requeridos: DOCS_POR_TIPO[record.tipo_inversor] || [],
    siguiente_accion: 'Solicitar documentos KYC',
  });
}

async function handleGet(body) {
  const { investor_id } = body;
  if (!investor_id) return Response.json({ error: 'investor_id requerido' }, { status: 400 });

  const data = await fetchInsForge(`/rest/v1/investors?id=eq.${investor_id}&limit=1`);
  if (!data?.length) return Response.json({ error: 'Inversor no encontrado' }, { status: 404 });

  const investor = data[0];
  return Response.json({
    success: true,
    investor: {
      ...investor,
      documentos_requeridos: DOCS_POR_TIPO[investor.tipo_inversor] || [],
    },
  });
}

async function handleList(body = {}) {
  const { kyc_estado, tipo_inversor, limit = 50, offset = 0 } = body;
  
  let query = `/rest/v1/investors?select=*&order=fecha_alta.desc&limit=${limit}&offset=${offset}`;
  if (kyc_estado) query += `&kyc_estado=eq.${kyc_estado}`;
  if (tipo_inversor) query += `&tipo_inversor=eq.${tipo_inversor}`;

  const data = await fetchInsForge(query);

  // Stats
  const statsRes = await fetchInsForge('/rest/v1/investors?select=kyc_estado,tipo_inversor');
  const stats = { por_estado: {}, por_tipo: {}, total_capacidad: 0 };
  if (Array.isArray(statsRes)) {
    for (const inv of statsRes) {
      stats.por_estado[inv.kyc_estado] = (stats.por_estado[inv.kyc_estado] || 0) + 1;
      stats.por_tipo[inv.tipo_inversor] = (stats.por_tipo[inv.tipo_inversor] || 0) + 1;
    }
  }

  return Response.json({ success: true, investors: data, stats, limit, offset });
}

async function handleUpdate(body) {
  const { investor_id, updates } = body;
  if (!investor_id) return Response.json({ error: 'investor_id requerido' }, { status: 400 });

  const now = new Date().toISOString();
  await fetchInsForge(`/rest/v1/investors?id=eq.${investor_id}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...updates, ultima_actividad: now }),
  });

  return Response.json({ success: true, investor_id });
}

async function handleRequestDocs(body) {
  const { investor_id, docs_especificos } = body;
  if (!investor_id) return Response.json({ error: 'investor_id requerido' }, { status: 400 });

  const investors = await fetchInsForge(`/rest/v1/investors?id=eq.${investor_id}&select=tipo_inversor&limit=1`);
  if (!investors?.length) return Response.json({ error: 'Inversor no encontrado' }, { status: 404 });

  const tipo = investors[0].tipo_inversor;
  const docs = docs_especificos || DOCS_POR_TIPO[tipo] || [];

  // Guardar checklist en profile_data
  await fetchInsForge(`/rest/v1/investors?id=eq.${investor_id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      kyc_docs_requested: docs,
      kyc_docs_requested_at: new Date().toISOString(),
      ultima_actividad: new Date().toISOString(),
    }),
  });

  return Response.json({
    success: true,
    investor_id,
    documentos_requeridos: docs,
    siguiente_accion: 'Recibir y verificar documentos',
  });
}

async function handleVerify(body) {
  const { investor_id, notas } = body;
  if (!investor_id) return Response.json({ error: 'investor_id requerido' }, { status: 400 });

  const now = new Date().toISOString();
  await fetchInsForge(`/rest/v1/investors?id=eq.${investor_id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      kyc_estado: 'Verificado',
      kyc_verificado_at: now,
      kyc_verificado_por: 'sistema',
      kyc_notas: notas || null,
      ultima_actividad: now,
    }),
  });

  return Response.json({
    success: true,
    investor_id,
    kyc_estado: 'Verificado',
    siguiente_accion: 'Inversor verificado. Listo para operaciones.',
  });
}

async function handleReject(body) {
  const { investor_id, motivo } = body;
  if (!investor_id) return Response.json({ error: 'investor_id requerido' }, { status: 400 });
  if (!motivo) return Response.json({ error: 'motivo requerido para rechazo' }, { status: 400 });

  const now = new Date().toISOString();
  await fetchInsForge(`/rest/v1/investors?id=eq.${investor_id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      kyc_estado: 'Rechazado',
      kyc_rechazado_at: now,
      kyc_rechazado_motivo: motivo,
      ultima_actividad: now,
    }),
  });

  return Response.json({
    success: true,
    investor_id,
    kyc_estado: 'Rechazado',
    motivo,
  });
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
      case 'register':     return handleRegister(body);
      case 'get':         return handleGet(body);
      case 'list':        return handleList(body);
      case 'update':      return handleUpdate(body);
      case 'request_docs': return handleRequestDocs(body);
      case 'verify':      return handleVerify(body);
      case 'reject':      return handleReject(body);
      default:
        return Response.json({
          error: 'Action desconocida',
          available: ['register', 'get', 'list', 'update', 'request_docs', 'verify', 'reject']
        }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
