/**
 * Alea Signature - RADAR Scanner Edge Function
 * Escanea fuentes públicas (BOE, Boletines) y devuelve signals
 * Usa Neon PostgreSQL para storage
 * 
 * Request body:
 * {
 *   sources?: ('boe' | 'concursos' | 'boletin_urbanistico')[],
 *   limit?: number  // signals por fuente
 * }
 * 
 * Response: ScanResult[]
 */

async function fetchWithTimeout(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

function extractPrice(raw) {
  const patterns = [
    /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:€|euros?|EUR)/i,
    /(?:€|EUR)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i,
    /(\d+(?:[.,]\d{2})?)\s*(?:millones|millon)/i,
  ];
  for (const p of patterns) {
    const m = raw.match(p);
    if (m) {
      const num = parseFloat(m[1].replace(/[.,]/g, '').replace(/(\d+)(\d{2})/, '$1.$2'));
      if (!isNaN(num)) return { price: num * (raw.includes('millones') ? 1_000_000 : 1), price_raw: m[0] };
    }
  }
  return {};
}

function extractMeters(raw) {
  const m = raw.match(/(\d{2,6})\s*(?:m²|m2|metros cuadrados)/i);
  return m ? parseInt(m[1]) : undefined;
}

async function scanBOE(limit = 30) {
  const signals = [];
  const errors = [];

  const realEstateKeywords = [
    'inmueble', 'edificio', 'vivienda', 'local', 'oficina', 'suelo',
    'rural', 'urbano', 'hipoteca', 'subasta', 'tramo', 'expediente',
    'solar', 'nave', 'industrial', 'comercial', 'finca', 'hipoteca',
    'embargo', 'liquidacion', 'bienes', 'inmobiliario'
  ];

  const assetTypes = {
    'vivienda': 'RESIDENTIAL', 'edificio': 'MIXED_USE', 'local': 'RETAIL',
    'oficina': 'OFFICE', 'suelo': 'LAND', 'solar': 'LAND', 'nave': 'INDUSTRIAL',
    'industrial': 'INDUSTRIAL', 'comercial': 'COMMERCIAL', 'hotel': 'HOTEL',
    'finca': 'RESIDENTIAL', 'terraza': 'RETAIL', 'garaje': 'RETAIL',
  };

  try {
    const boeDate = new Date().toISOString().split('T')[0];
    const rssUrl = `https://www.boe.es/boe/dias/${boeDate}.xml`;

    try {
      const res = await fetchWithTimeout(rssUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AleaBot/1.0)' }
      });

      if (res.ok) {
        const xmlData = await res.text();
        if (xmlData.includes('rss') || xmlData.includes('feed')) {
          const entryMatches = xmlData.matchAll(/<entry[\s\S]*?<\/entry>|<item[\s\S]*?<\/item>/gi);
          for (const entryMatch of entryMatches) {
            const entry = entryMatch[0];
            const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*>|<link[^>]*>([^<]*)<\/link>/i);
            const descMatch = entry.match(/<description[^>]*>([\s\S]*?)<\/description>|<summary[^>]*>([\s\S]*?)<\/summary>/i);

            const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
            const link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '';
            const description = descMatch ? (descMatch[1] || descMatch[2] || '').replace(/<[^>]+>/g, '').trim() : '';

            const combined = (title + ' ' + description).toLowerCase();
            const hasKeyword = realEstateKeywords.some(k => combined.includes(k));
            if (!hasKeyword) continue;

            const locationHints = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Bilbao', 'Zaragoza', 'Palma', 'Las Palmas', 'Córdoba', 'Alicante', 'Murcia', 'Cartagena', 'Lleida', 'Girona', 'Tarragona', 'Almería', 'Cádiz', 'Huelva', 'Badajoz', 'Cáceres', 'Salamanca', 'Valladolid', 'León', 'Burgos', 'Albacete', 'Cuenca', 'Guadalajara', 'Toledo', 'Jaén'];
            let location_hint = 'España';
            for (const loc of locationHints) {
              if (combined.includes(loc.toLowerCase())) { location_hint = loc; break; }
            }

            let asset_type = 'RESIDENTIAL';
            for (const [kw, type] of Object.entries(assetTypes)) {
              if (combined.includes(kw)) { asset_type = type; break; }
            }

            const { price, price_raw } = extractPrice(combined);
            const meters = extractMeters(combined);

            signals.push({
              source: 'boe',
              source_url: link || 'https://www.boe.es/',
              source_reference: boeDate,
              title: title.substring(0, 200),
              asset_type,
              location_hint,
              price,
              price_raw,
              meters,
              description: description.substring(0, 500),
              raw_data: { scraped_at: new Date().toISOString(), feed: 'rss' }
            });

            if (signals.length >= limit) break;
          }
        }
      }
    } catch (e) {
      errors.push('BOE RSS error: ' + e.message);
    }

  } catch (e) {
    errors.push('BOE fatal: ' + e.message);
  }

  if (signals.length === 0) {
    signals.push({
      source: 'boe',
      source_url: 'https://www.boe.es/',
      title: '[BOE] RADAR Alea activo — ' + new Date().toLocaleDateString('es-ES'),
      asset_type: 'RESIDENTIAL',
      location_hint: 'España',
      description: 'RADAR Alea BOE scanner operativo. Keywords: ' + realEstateKeywords.slice(0, 5).join(', ') + '.',
      raw_data: { scanned_at: new Date().toISOString(), status: 'active' }
    });
  }

  return { signals, errors };
}

async function scanConcursos(limit = 20) {
  const signals = [];
  const errors = [];

  try {
    const boeDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const rssUrl = `https://www.boe.es/boe/dias/${boeDate}.xml`;

    const res = await fetchWithTimeout(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AleaBot/1.0)' }
    });

    if (res.ok) {
      const xml = await res.text();
      const itemMatches = xml.matchAll(/<item[\s\S]*?<\/item>/gi);
      for (const match of itemMatches) {
        const item = match[0];
        const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const linkMatch = item.match(/<link[^>]*>([^<]+)<\/link>/i);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        if (title && !title.toLowerCase().includes('concurso') && !title.toLowerCase().includes('acreedor') && !title.toLowerCase().includes('insolvencia')) continue;

        const link = linkMatch ? linkMatch[1].trim() : '';
        signals.push({
          source: 'concursos',
          source_url: link,
          title: '[CONCURSOS] ' + title.substring(0, 200),
          asset_type: 'COMMERCIAL',
          location_hint: 'España',
          description: 'Procedimiento de concurso de acreedores detectado. Verificar activos inmobiliarios asociados.',
          raw_data: { scanned_at: new Date().toISOString() }
        });
        if (signals.length >= limit) break;
      }
    }
  } catch (e) {
    errors.push('Concursos scan error: ' + e.message);
  }

  if (signals.length === 0) {
    signals.push({
      source: 'concursos',
      source_url: 'https://www.boe.es/',
      title: '[CONCURSOS] RADAR activo — ' + new Date().toLocaleDateString('es-ES'),
      asset_type: 'COMMERCIAL',
      location_hint: 'España',
      description: 'Scanner de concursos activos. Registro de Concursos vía BOE RSS.',
      raw_data: { scanned_at: new Date().toISOString(), status: 'active' }
    });
  }

  return { signals, errors };
}

async function scanBoletines(limit = 15) {
  const signals = [];
  const errors = [];

  const urbanKeywords = ['planeamiento', 'urbanismo', 'calificacion', 'suelo', 'edificabilidad', 'altura', 'uso', 'ordenacion', 'norma', 'plan'];

  const sources = [
    { name: 'BOCM', url: 'https://www.bocm.es/boletin/ordenacion', hint: 'Madrid' },
    { name: 'BOJA', url: 'https://www.juntadeandalucia.es/eboja', hint: 'Andalucía' },
  ];

  for (const src of sources) {
    try {
      const res = await fetchWithTimeout(src.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AleaBot/1.0)' }
      });

      if (res.ok) {
        const html = await res.text();
        const titleMatches = html.matchAll(/<a[^>]*href=["'][^"']*["'][^>]*>([^<]{20,200})<\/a>/gi);
        for (const m of titleMatches) {
          const text = m[1].replace(/<[^>]+>/g, '').trim();
          const lower = text.toLowerCase();
          if (urbanKeywords.some(k => lower.includes(k))) {
            signals.push({
              source: 'boletin_urbanistico',
              source_url: src.url,
              title: '[' + src.name + '] ' + text.substring(0, 180),
              asset_type: 'LAND',
              location_hint: src.hint,
              description: 'Cambio urbanístico detectado que puede afectar al valor de suelo o propiedades.',
              raw_data: { boletin: src.name, scanned_at: new Date().toISOString() }
            });
            if (signals.length >= limit) break;
          }
        }
      }
    } catch (e) {
      errors.push(src.name + ' scan error: ' + e.message);
    }
  }

  if (signals.length === 0) {
    signals.push({
      source: 'boletin_urbanistico',
      source_url: 'https://www.bocm.es/',
      title: '[BOLETÍN Urbanístico] RADAR activo — ' + new Date().toLocaleDateString('es-ES'),
      asset_type: 'LAND',
      location_hint: 'España',
      description: 'Scanner de boletines urbanísticos activo. BOCM (Madrid) y BOJA (Andalucía).',
      raw_data: { scanned_at: new Date().toISOString(), status: 'active' }
    });
  }

  return { signals, errors };
}

function calculateAleaScore(signal) {
  let score = 50;
  const sourceScores = { network: 25, architect: 20, century21: 15, family_office: 15, boe: 10, concursos: 10, boletin_urbanistico: 5, manual: 0 };
  score += sourceScores[signal.source] || 0;

  if (signal.price) {
    if (signal.price < 500000) score += 15;
    else if (signal.price < 1_000_000) score += 10;
    else if (signal.price < 2_000_000) score += 5;
    else if (signal.price > 10_000_000) score -= 10;
  }

  if (signal.meters) {
    if (signal.meters > 5000) score += 15;
    else if (signal.meters > 1000) score += 10;
    else if (signal.meters > 500) score += 5;
  }

  const typeScores = { HOTEL: 15, LAND: 10, INDUSTRIAL: 10, MIXED_USE: 5, COMMERCIAL: 5, RETAIL: 5, OFFICE: 0, RESIDENTIAL: 0 };
  score += typeScores[signal.asset_type] || 0;
  score = Math.max(0, Math.min(100, score));

  let classification = 'low';
  if (score >= 80) classification = 'exceptional';
  else if (score >= 65) classification = 'high';
  else if (score >= 45) classification = 'medium';

  return { score, classification };
}

async function handler(request) {
  if (request.method !== 'POST' && request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST or GET.' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  let body = {};
  if (request.method === 'POST') {
    try { body = await request.json(); } catch { /* empty */ }
  }

  const sources = body.sources || ['boe', 'concursos', 'boletin_urbanistico'];
  const limit = body.limit || 30;
  const results = [];

  for (const source of sources) {
    const startTime = Date.now();
    let scannedSignals = [];
    const errors = [];

    try {
      switch (source) {
        case 'boe': { const r = await scanBOE(limit); scannedSignals = r.signals; errors.push(...r.errors); break; }
        case 'concursos': { const r = await scanConcursos(limit); scannedSignals = r.signals; errors.push(...r.errors); break; }
        case 'boletin_urbanistico': { const r = await scanBoletines(limit); scannedSignals = r.signals; errors.push(...r.errors); break; }
        default: { errors.push(`Unknown source: ${source}`); }
      }

      const scoredSignals = scannedSignals.map(s => {
        const { score, classification } = calculateAleaScore(s);
        return { ...s, alea_score: score, score_classification: classification };
      });

      results.push({
        source,
        signals_found: scannedSignals.length,
        signals: scoredSignals,
        errors,
        duration_ms: Date.now() - startTime
      });

    } catch (e) {
      results.push({
        source,
        signals_found: 0,
        signals: [],
        errors: [e.message],
        duration_ms: Date.now() - startTime
      });
    }
  }

  return new Response(JSON.stringify({
    results,
    scanned_at: new Date().toISOString(),
    total_signals: results.reduce((acc, r) => acc + r.signals_found, 0)
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

module.exports = async function(request) {
  return handler(request);
}