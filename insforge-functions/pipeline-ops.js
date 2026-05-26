/**
 * Alea Signature - Pipeline Operations Edge Function
 * Full CRUD para gestión de operaciones Kanban
 * 
 * POST /functions/pipeline-ops
 * 
 * Tabla: operaciones (crear si no existe)
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

// Estados válidos
const ZONAS = ['New Lead', 'Qualified', 'Due Diligence', 'Offer', 'Closing', 'Done', 'Canceled'];

// Transiciones válidas
const TRANSICIONES = {
  'New Lead':     ['Qualified'],
  'Qualified':    ['Due Diligence', 'New Lead'],
  'Due Diligence':['Offer', 'Qualified'],
  'Offer':        ['Closing', 'Due Diligence'],
  'Closing':      ['Done', 'Offer'],
  'Done':         [],
  'Canceled':     [],
};

function validarTransicion(zonaActual, zonaDestino) {
  if (zonaActual === zonaDestino) return { valid: true };
  const permitidas = TRANSICIONES[zonaActual] || [];
  if (!permitidas.includes(zonaDestino)) {
    return {
      valid: false,
      error: `No se puede mover de "${zonaActual}" a "${zonaDestino}". Estados válidos: ${permitidas.join(', ') || 'ninguno'}`
    };
  }
  return { valid: true };
}

async function ensureTable() {
  // Intentar crear tabla operaciones si no existe
  // NOTA: Esta creación requiere permisos de admin - en la práctica se hace via dashboard InsForge
  try {
    await fetchInsForge('/rest/v1/operaciones?select=id&limit=1');
  } catch {
    // Tabla no existe - registrar para creación manual
    console.log('Tabla operaciones no existe - crear via InsForge dashboard');
  }
}

async function handleCreate(body) {
  const { activo_id, comprador_id, vendedor_id, mandatorio_id, nombre } = body;

  if (!activo_id && !nombre) {
    return Response.json({ error: 'activo_id o nombre requerido' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const record = {
    id: crypto.randomUUID(),
    nombre: nombre || `Operación ${new Date().toISOString().slice(0, 10)}`,
    activo_id: activo_id || null,
    comprador_id: comprador_id || null,
    vendedor_id: vendedor_id || null,
    mandatorio_id: mandatorio_id || null,
    zona_actual: 'New Lead',
    historial_zonas: [{ zona: 'New Lead', timestamp: now, notas: 'Creación de operación' }],
    created_at: now,
    updated_at: now,
  };

  const result = await fetchInsForge('/rest/v1/operaciones', {
    method: 'POST',
    body: JSON.stringify(record),
  });

  return Response.json({
    success: true,
    operacion_id: record.id,
    zona_actual: record.zona_actual,
    created_at: record.created_at,
  });
}

async function handleGet(body) {
  const { id } = body;
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 });

  const data = await fetchInsForge(`/rest/v1/operaciones?id=eq.${id}&limit=1`);
  if (!data?.length) return Response.json({ error: 'Operación no encontrada' }, { status: 404 });

  return Response.json({ success: true, operacion: data[0] });
}

async function handleList(body = {}) {
  const { zona, limit = 50, offset = 0 } = body;
  
  let query = `/rest/v1/operaciones?select=*&order=updated_at.desc&limit=${limit}&offset=${offset}`;
  if (zona) query += `&zona_actual=eq.${zona}`;

  const data = await fetchInsForge(query);
  
  // Stats por zona
  const statsRes = await fetchInsForge('/rest/v1/operaciones?select=zona_actual');
  const stats = {};
  if (Array.isArray(statsRes)) {
    for (const op of statsRes) {
      stats[op.zona_actual] = (stats[op.zona_actual] || 0) + 1;
    }
  }

  return Response.json({
    success: true,
    operaciones: data,
    stats,
    limit,
    offset,
  });
}

async function handleMove(body) {
  const { operacion_id, zona_destino, notas = '' } = body;
  if (!operacion_id || !zona_destino) {
    return Response.json({ error: 'operacion_id y zona_destino requeridos' }, { status: 400 });
  }
  if (!ZONAS.includes(zona_destino)) {
    return Response.json({ error: `Zona inválida. Válidas: ${ZONAS.join(', ')}` }, { status: 400 });
  }

  // Obtener estado actual
  const ops = await fetchInsForge(`/rest/v1/operaciones?id=eq.${operacion_id}&limit=1`);
  if (!ops?.length) return Response.json({ error: 'Operación no encontrada' }, { status: 404 });

  const op = ops[0];
  const zonaAnterior = op.zona_actual;

  // Validar transición
  const validacion = validarTransicion(zonaAnterior, zona_destino);
  if (!validacion.valid) {
    return Response.json({ error: validacion.error }, { status: 400 });
  }

  // Si es Canceled, notas obligatorias
  if (zona_destino === 'Canceled' && !notas.trim()) {
    return Response.json({ error: 'Para cancelar requiere notas obligatorias' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const historial = op.historial_zonas || [];
  historial.push({ zona: zona_destino, timestamp: now, notas });

  await fetchInsForge(`/rest/v1/operaciones?id=eq.${operacion_id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      zona_actual: zona_destino,
      historial_zonas: historial,
      updated_at: now,
    }),
  });

  return Response.json({
    success: true,
    operacion_id,
    zona_anterior: zonaAnterior,
    zona_nueva: zona_destino,
    historial,
    fecha_cambio: now,
    notificacion: zona_destino === 'Done' ? '¡Operación completada!' :
                 zona_destino === 'Canceled' ? 'Operación cancelada' : null,
  });
}

async function handleGetHistory(body) {
  const { operacion_id } = body;
  if (!operacion_id) return Response.json({ error: 'ID requerido' }, { status: 400 });

  const ops = await fetchInsForge(`/rest/v1/operaciones?id=eq.${operacion_id}&select=historial_zonas,zona_actual&limit=1`);
  if (!ops?.length) return Response.json({ error: 'Operación no encontrada' }, { status: 404 });

  return Response.json({
    success: true,
    operacion_id,
    zona_actual: ops[0].zona_actual,
    historial: ops[0].historial_zonas || [],
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
      case 'create':  return handleCreate(body);
      case 'get':     return handleGet(body);
      case 'list':    return handleList(body);
      case 'move':    return handleMove(body);
      case 'history': return handleGetHistory(body);
      default:
        return Response.json({
          error: 'Action desconocida',
          available: ['create', 'get', 'list', 'move', 'history']
        }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
