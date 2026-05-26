/**
 * Alea Signature - Properties List Edge Function
 * Lista properties desde InsForge DB con filtros
 * 
 * POST /functions/properties-list
 * Body: {
 *   filters?: { status?, asset_type?, city?, minPrice?, maxPrice? },
 *   limit?: number,
 *   offset?: number,
 *   includeBlurred?: boolean  // si false, oculta precio real (off-market)
 * }
 */

async function handler(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-AllowMethods': 'POST, OPTIONS',
    'Access-Control-AllowHeaders': 'Content-Type, x-insforge-key',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const API_KEY = request.headers.get('x-insforge-key') || process.env.INSFORGE_API_KEY || '';
  const BASE = process.env.INSFORGE_APP_URL || 'https://if8rkq6j.eu-central.insforge.app';

  let body = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {}

  const { filters = {}, limit = 20, offset = 0, includeBlurred = true } = body;
  const selectFields = includeBlurred
    ? 'id,title,price,status,asset_type,location_hint,created_at,agent_name,reference'
    : 'id,title,status,asset_type,location_hint,created_at,agent_name';

  async function fetchJSON(path) {
    const url = `${BASE}${path}`;
    const res = await fetch(url, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    return res.json();
  }

  try {
    // Build query params
    const params = new URLSearchParams();
    params.set('select', selectFields);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    params.set('order', 'created_at.desc');

    if (filters.status) params.set('status', `eq.${filters.status}`);
    if (filters.asset_type) params.set('asset_type', `eq.${filters.asset_type}`);

    let data = await fetchJSON(`/rest/v1/properties?${params.toString()}`);
    if (!Array.isArray(data)) data = [];

    // Apply price filters client-side (PostgREST range syntax can be tricky)
    if (filters.minPrice != null) {
      data = data.filter(p => parseFloat(p.price) >= filters.minPrice);
    }
    if (filters.maxPrice != null) {
      data = data.filter(p => parseFloat(p.price) <= filters.maxPrice);
    }

    // Count total
    let total = 0;
    try {
      const countParams = new URLSearchParams({ 'select': 'id', ...(filters.status && { 'status': `eq.${filters.status}` }) });
      const countData = await fetchJSON(`/rest/v1/properties?${countParams.toString()}&limit=0&offset=0`);
      total = Array.isArray(countData) ? countData.length : 0;
    } catch {}

    // Format response
    const properties = data.map(p => ({
      id: p.id,
      title: p.title || p.location_hint || 'Sin nombre',
      status: p.status,
      asset_type: p.asset_type,
      location_hint: p.location_hint,
      created_at: p.created_at,
      ...(includeBlurred ? {
        price: p.price ? parseFloat(p.price) : null,
        agent_name: p.agent_name,
        reference: p.reference,
      } : {
        price: p.price ? '—' : null,
        blurred: !p.price,
      })
    }));

    return new Response(JSON.stringify({
      properties,
      total,
      limit,
      offset,
      cached_at: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: `properties-list: ${msg}` }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

module.exports = async function(request) {
  return handler(request);
};
