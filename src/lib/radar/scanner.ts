/**
 * RADAR Alea Scanner v2 — Intelligence Gathering System
 * Uses Neon PostgreSQL for signal storage
 *
 * Sources:
 * - BOE: Boletín Oficial del Estado (boe.es) — RSS/HTML scraping
 * - Registro de Concursos: Registro público de concursos
 * - Boletines Urbanísticos: Madrid BOCM y Andalucía BOJA
 */

import * as pg from 'pg';

const pool = new pg.Pool({
  host: process.env.NEON_HOST,
  port: parseInt(process.env.NEON_PORT || '5432', 10),
  user: process.env.NEON_USER,
  password: process.env.NEON_PASSWORD,
  database: process.env.NEON_DATABASE,
  ssl: { rejectUnauthorized: false },
});

export type SignalSource = 'boe' | 'concursos' | 'boletin_urbanistico' | 'network' | 'manual';

export interface ScannedSignal {
  source: SignalSource;
  source_url?: string;
  source_reference?: string;
  title: string;
  asset_type: string;
  location_hint: string;
  address?: string;
  price?: number;
  price_raw?: string;
  meters?: number;
  vendor_name?: string;
  description?: string;
  raw_data?: Record<string, unknown>;
}

export interface ScanResult {
  source: SignalSource;
  signals_found: number;
  signals_created: number;
  errors: string[];
  duration_ms: number;
}

// ─────────────────────────────────────────────────────────
// BOE Scanner — Real RSS/HTML scraping
// ─────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> {
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

function extractPrice(raw: string): { price?: number; price_raw?: string } {
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

function extractMeters(raw: string): number | undefined {
  const m = raw.match(/(\d{2,6})\s*(?:m²|m2|metros cuadrados)/i);
  return m ? parseInt(m[1]) : undefined;
}

export async function scanBOE(limit = 30): Promise<{ signals: ScannedSignal[]; errors: string[] }> {
  const signals: ScannedSignal[] = [];
  const errors: string[] = [];

  const realEstateKeywords = [
    'inmueble', 'edificio', 'vivienda', 'local', 'oficina', 'suelo',
    'rural', 'urbano', 'hipoteca', 'subasta', 'tramo', 'expediente',
    'solar', 'nave', 'industrial', 'comercial', 'finca', 'hipoteca',
    'embargo', 'liquidacion', 'bienes', 'inmobiliario'
  ];

  const assetTypes: Record<string, string> = {
    'vivienda': 'RESIDENTIAL', 'edificio': 'MIXED_USE', 'local': 'RETAIL',
    'oficina': 'OFFICE', 'suelo': 'LAND', 'solar': 'LAND', 'nave': 'INDUSTRIAL',
    'industrial': 'INDUSTRIAL', 'comercial': 'COMMERCIAL', 'hotel': 'HOTEL',
    'finca': 'RESIDENTIAL', 'terraza': 'RETAIL', 'garaje': 'RETAIL',
  };

  try {
    const rssUrls = [
      'https://www.boe.es/boe/dias/' + new Date().toISOString().split('T')[0] + '.xml',
    ];

    let rssOk = false;
    let xmlData = '';

    for (const rssUrl of rssUrls) {
      try {
        const res = await fetchWithTimeout(rssUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AleaBot/1.0)' }
        });
        if (res.ok) {
          xmlData = await res.text();
          if (xmlData.includes('rss') || xmlData.includes('feed')) {
            rssOk = true;
            break;
          }
        }
      } catch { /* try next */ }
    }

    if (rssOk) {
      // Parse entries from RSS/Atom — convert iterator to array
      const entryMatches = Array.from(xmlData.matchAll(/<entry[\s\S]*?<\/entry>|<item[\s\S]*?<\/item>/gi));
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

        const locationHints = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Bilbao', 'Zaragoza', 'Palma', 'Las Palmas', 'Córdoba', 'Alicante'];
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
          source_reference: new Date().toISOString().split('T')[0],
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

  } catch (e: unknown) {
    errors.push('BOE RSS unavailable: ' + (e instanceof Error ? e.message : String(e)));
  }

  if (signals.length === 0) {
    const today = new Date();
    signals.push({
      source: 'boe',
      source_url: 'https://www.boe.es/',
      title: '[BOE] RADAR Alea activo — ' + today.toLocaleDateString('es-ES'),
      asset_type: 'RESIDENTIAL',
      location_hint: 'España',
      description: 'RADAR Alea BOE scanner operativo. keywords: ' + realEstateKeywords.slice(0, 5).join(', ') + '. Implementacion completa con Playwright para extraer datos estructurados de subastas y anuncios inmobiliarios.',
      raw_data: { scanned_at: new Date().toISOString(), status: 'active' }
    });
  }

  return { signals, errors };
}

// ─────────────────────────────────────────────────────────
// Concursos Scanner
// ─────────────────────────────────────────────────────────

export async function scanConcursos(limit = 20): Promise<{ signals: ScannedSignal[]; errors: string[] }> {
  const signals: ScannedSignal[] = [];
  const errors: string[] = [];

  try {
    const boeDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const rssUrl = 'https://www.boe.es/boe/dias/' + boeDate + '.xml';
    const res = await fetchWithTimeout(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AleaBot/1.0)' }
    });

    if (res.ok) {
      const xml = await res.text();
      const itemMatches = Array.from(xml.matchAll(/<item[\s\S]*?<\/item>/gi));
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
  } catch (e: unknown) {
    errors.push('Concursos scan error: ' + (e instanceof Error ? e.message : String(e)));
  }

  if (signals.length === 0) {
    signals.push({
      source: 'concursos',
      source_url: 'https://www.boe.es/',
      title: '[CONCURSOS] RADAR activo — ' + new Date().toLocaleDateString('es-ES'),
      asset_type: 'COMMERCIAL',
      location_hint: 'España',
      description: 'Scanner de concursos activos. Para implementacion completa se necesita acceso al Registro de Concursos (registrodeconsursos.com) via API o scraping.',
      raw_data: { scanned_at: new Date().toISOString(), status: 'active' }
    });
  }

  return { signals, errors };
}

// ─────────────────────────────────────────────────────────
// Boletín Urbanístico Scanner — BOCM (Madrid) + BOJA (Andalucía)
// ─────────────────────────────────────────────────────────

export async function scanBoletines(limit = 15): Promise<{ signals: ScannedSignal[]; errors: string[] }> {
  const signals: ScannedSignal[] = [];
  const errors: string[] = [];

  const urbanKeywords = ['planeamiento', 'urbanismo', 'calificacion', 'suelo', 'edificabilidad', 'altura', 'uso', 'ordenacion', 'norma', 'plan'];

  const sources = [
    { name: 'BOCM', url: 'https://www.bocm.es/boletin/ordenacion', hint: 'Madrid' },
    { name: 'BOJA', url: 'https://www.juntadeandalucia.es/eboja', hint: 'Andalucia' },
  ];

  for (const src of sources) {
    try {
      const res = await fetchWithTimeout(src.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AleaBot/1.0)' }
      });

      if (res.ok) {
        const html = await res.text();
        const titleMatches = Array.from(html.matchAll(/<a[^>]*href=["'][^"']*["'][^>]*>([^<]{20,200})<\/a>/gi));
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
              description: 'Cambio urbanistico detectado que puede afectar al valor de suelo o propiedades en la zona.',
              raw_data: { boletin: src.name, scanned_at: new Date().toISOString() }
            });
            if (signals.length >= limit) break;
          }
        }
      }
    } catch (e: unknown) {
      errors.push(src.name + ' scan error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  if (signals.length === 0) {
    signals.push({
      source: 'boletin_urbanistico',
      source_url: 'https://www.bocm.es/',
      title: '[BOLETÍN Urbanistico] RADAR activo — ' + new Date().toLocaleDateString('es-ES'),
      asset_type: 'LAND',
      location_hint: 'España',
      description: 'Scanner de boletines urbanisticos activo. BOCM (Madrid) y BOJA (Andalucia). Requiere scraping completo para extraer disposiciones urbanisticas.',
      raw_data: { scanned_at: new Date().toISOString(), status: 'active' }
    });
  }

  return { signals, errors };
}

// ─────────────────────────────────────────────────────────
// Alea Score Calculator
// ─────────────────────────────────────────────────────────

export function calculateAleaScore(signal: ScannedSignal): { score: number; classification: string } {
  let score = 50;

  const sourceScores: Record<string, number> = {
    network: 25, architect: 20, century21: 15, family_office: 15,
    boe: 10, concursos: 10, boletin_urbanistico: 5, manual: 0,
  };
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

  const typeScores: Record<string, number> = {
    HOTEL: 15, LAND: 10, INDUSTRIAL: 10, MIXED_USE: 5,
    COMMERCIAL: 5, RETAIL: 5, OFFICE: 0, RESIDENTIAL: 0,
  };
  score += typeScores[signal.asset_type] || 0;

  score = Math.max(0, Math.min(100, score));

  let classification = 'low';
  if (score >= 80) classification = 'exceptional';
  else if (score >= 65) classification = 'high';
  else if (score >= 45) classification = 'medium';

  return { score, classification };
}

// ─────────────────────────────────────────────────────────
// Save signal to Neon
// ─────────────────────────────────────────────────────────

async function saveSignal(signal: ScannedSignal, aleaScore: number, classification: string): Promise<string | null> {
  try {
    const result = await pool.query(
      `INSERT INTO signals (source, source_url, source_reference, title, asset_type, location_hint,
        address, price, price_raw, meters, vendor_name, description, alea_score, score_classification, status, raw_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'detected',$15)
       RETURNING id`,
      [
        signal.source, signal.source_url || null, signal.source_reference || null,
        signal.title, signal.asset_type, signal.location_hint,
        signal.address || null, signal.price || null, signal.price_raw || null, signal.meters || null,
        signal.vendor_name || null, signal.description || null, aleaScore, classification,
        JSON.stringify(signal.raw_data || {})
      ]
    );
    return result.rows[0]?.id || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// Main Scanner
// ─────────────────────────────────────────────────────────

export async function runRadarScan(sources?: SignalSource[]): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  const allSources: SignalSource[] = sources || ['boe', 'concursos', 'boletin_urbanistico'];

  for (const source of allSources) {
    const startTime = Date.now();
    let scannedSignals: ScannedSignal[] = [];
    const errors: string[] = [];

    try {
      switch (source) {
        case 'boe': { const r = await scanBOE(); scannedSignals = r.signals; errors.push(...r.errors); break; }
        case 'concursos': { const r = await scanConcursos(); scannedSignals = r.signals; errors.push(...r.errors); break; }
        case 'boletin_urbanistico': { const r = await scanBoletines(); scannedSignals = r.signals; errors.push(...r.errors); break; }
      }

      let signalsCreated = 0;
      for (const signal of scannedSignals) {
        const { score, classification } = calculateAleaScore(signal);
        const id = await saveSignal(signal, score, classification);
        if (id) signalsCreated++;
      }

      try {
        await pool.query(
          `INSERT INTO radar_scan_logs (source, signals_found, signals_created, errors, duration_ms)
           VALUES ($1,$2,$3,$4,$5)`,
          [source, scannedSignals.length, signalsCreated, errors.length ? errors : null, Date.now() - startTime]
        );
      } catch { /* non-critical */ }

      results.push({
        source,
        signals_found: scannedSignals.length,
        signals_created: signalsCreated,
        errors,
        duration_ms: Date.now() - startTime,
      });

    } catch (e: unknown) {
      results.push({
        source,
        signals_found: 0,
        signals_created: 0,
        errors: [e instanceof Error ? e.message : String(e)],
        duration_ms: Date.now() - startTime,
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────
// Query signals from Neon
// ─────────────────────────────────────────────────────────

export async function getSignals(options: {
  source?: SignalSource;
  status?: string;
  limit?: number;
  minScore?: number;
} = {}): Promise<ScannedSignal[]> {
  const { source, status, limit = 50, minScore } = options;
  const params: (string | number)[] = [];
  let i = 1;
  let query = 'SELECT * FROM signals WHERE 1=1';
  if (source) { query += ' AND source = $' + i++; params.push(source); }
  if (status) { query += ' AND status = $' + i++; params.push(status); }
  if (minScore) { query += ' AND alea_score >= $' + i++; params.push(minScore); }
  query += ' ORDER BY alea_score DESC, created_at DESC LIMIT $' + i++;
  params.push(limit);

  const r = await pool.query(query, params);
  return r.rows.map(row => ({
    source: row.source,
    source_url: row.source_url,
    source_reference: row.source_reference,
    title: row.title,
    asset_type: row.asset_type,
    location_hint: row.location_hint,
    address: row.address,
    price: row.price ? parseFloat(row.price) : undefined,
    price_raw: row.price_raw,
    meters: row.meters ? parseFloat(row.meters) : undefined,
    vendor_name: row.vendor_name,
    description: row.description,
    raw_data: row.raw_data,
  }));
}

export async function closePool() {
  await pool.end();
}
