/**
 * RADAR Alea Scanner - Intelligence Gathering System
 * 
 * Sources:
 * - BOE: Boletín Oficial del Estado (boe.es)
 * - Registro de Concursos: Registro público de concursos de acreedores
 * - Boletines Urbanísticos: Madrid y Málaga
 */

import { createServerClient } from '@/lib/insforge-server';

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
  raw_data?: Record<string, any>;
}

export interface ScanResult {
  source: SignalSource;
  signals_found: number;
  signals_created: number;
  errors: string[];
  duration_ms: number;
}

// ─────────────────────────────────────────────────────────
// BOE Scanner
// ─────────────────────────────────────────────────────────

export async function scanBOE(limit = 20): Promise<{ signals: ScannedSignal[]; errors: string[] }> {
  const signals: ScannedSignal[] = [];
  const errors: string[] = [];

  try {
    // BOE API pública - Sección de Subastas y Anuncios
    // Usamos el feed RSS/JSON del BOE
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // BOE公开数据API (no requiere autenticación)
    const boeUrl = `https://www.boe.es/boe/dias/${today.toISOString().split('T')[0]}.xml`;
    
    // Intentar acceder al BOE (puede requerir scraping real en producción)
    // Por ahora devolvemos estructura para implementar
    
    // Palabras clave immobiliarias
    const keywords = [
      'inmueble', 'edificio', 'vivienda', 'local', 'oficina', 'suelo',
      'rural', 'urbano', 'hipoteca', 'subasta', 'tramo', 'expediente',
      'solar', 'nave', 'industrial', 'comercial'
    ];

    // Estructura de señal BOE detectada
    // En implementación real: parsing del XML del BOE
    signals.push({
      source: 'boe',
      source_url: 'https://www.boe.es/',
      title: `[BOE] Subasta inmobiliaria - Día ${today.toLocaleDateString('es-ES')}`,
      asset_type: 'RESIDENTIAL',
      location_hint: 'España',
      description: 'Señales detectadas del BOE - requiere análisis detallado',
      raw_data: { scanned_at: new Date().toISOString(), url: boeUrl }
    });

  } catch (e: any) {
    errors.push(`BOE scan error: ${e.message}`);
  }

  return { signals, errors };
}

// ─────────────────────────────────────────────────────────
// Concurso Scanner (Registro de Concursos de Acreedores)
// ─────────────────────────────────────────────────────────

export async function scanConcursos(limit = 20): Promise<{ signals: ScannedSignal[]; errors: string[] }> {
  const signals: ScannedSignal[] = [];
  const errors: string[] = [];

  try {
    // Registro público de concursos -橘子
    // URL: https://www.registrodeconsursos.com o similar
    // En producción: scraping con playwright o API oficial
    
    const today = new Date();
    
    signals.push({
      source: 'concursos',
      source_url: 'https://www registrodeconsursos.com/',
      title: `[CONCURSOS] Activo en procedimiento - ${today.toLocaleDateString('es-ES')}`,
      asset_type: 'COMMERCIAL',
      location_hint: 'España',
      description: 'Procedimientos de concurso detectados - requiere verificación',
      raw_data: { scanned_at: new Date().toISOString() }
    });

  } catch (e: any) {
    errors.push(`Concursos scan error: ${e.message}`);
  }

  return { signals, errors };
}

// ─────────────────────────────────────────────────────────
// Boletín Urbanístico Scanner (Madrid + Málaga)
// ─────────────────────────────────────────────────────────

export async function scanBoletines(limit = 20): Promise<{ signals: ScannedSignal[]; errors: string[] }> {
  const signals: ScannedSignal[] = [];
  const errors: string[] = [];

  try {
    // Boletín Oficial de la Comunidad de Madrid
    const madridUrl = 'https://www.bocm.es/';
    
    // Boletín Oficial de la Junta de Andalucía (Málaga)
    const malagaUrl = 'https://www.juntadeandalucia.eseboja';
    
    // En producción: scraping de boletines con keywords inmobiliarios
    
    signals.push({
      source: 'boletin_urbanistico',
      source_url: madridUrl,
      title: '[BOLETÍN Madrid] Modificación urbanística detectada',
      asset_type: 'LAND',
      location_hint: 'Madrid',
      description: 'Cambios urbanísticos que pueden afectar a valores de suelo',
      raw_data: { 
        source: 'BOCM',
        scanned_at: new Date().toISOString() 
      }
    });

  } catch (e: any) {
    errors.push(`Boletines scan error: ${e.message}`);
  }

  return { signals, errors };
}

// ─────────────────────────────────────────────────────────
// Alea Score Calculator
// ─────────────────────────────────────────────────────────

export function calculateAleaScore(signal: ScannedSignal): { score: number; classification: string } {
  let score = 50;

  // Source quality scoring
  const sourceScores: Record<string, number> = {
    network: 25,
    architect: 20,
    century21: 15,
    family_office: 15,
    boe: 10,
    concursos: 10,
    boletin_urbanistico: 5,
    manual: 0,
  };
  score += sourceScores[signal.source] || 0;

  // Price scoring (lower price = higher score for opp)
  if (signal.price) {
    if (signal.price < 500000) score += 15;
    else if (signal.price < 1000000) score += 10;
    else if (signal.price < 2000000) score += 5;
    else if (signal.price > 10000000) score -= 10;
  }

  // Size scoring
  if (signal.meters) {
    if (signal.meters > 5000) score += 15;
    else if (signal.meters > 1000) score += 10;
    else if (signal.meters > 500) score += 5;
  }

  // Asset type scoring
  const typeScores: Record<string, number> = {
    HOTEL: 15,
    LAND: 10,
    INDUSTRIAL: 10,
    MIXED_USE: 5,
    COMMERCIAL: 5,
    RETAIL: 5,
    OFFICE: 0,
    RESIDENTIAL: 0,
  };
  score += typeScores[signal.asset_type] || 0;

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  // Classification
  let classification = 'low';
  if (score >= 80) classification = 'exceptional';
  else if (score >= 65) classification = 'high';
  else if (score >= 45) classification = 'medium';
  else classification = 'low';

  return { score, classification };
}

// ─────────────────────────────────────────────────────────
// Main Scanner - Run all sources
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
        case 'boe':
          const boeResult = await scanBOE();
          scannedSignals = boeResult.signals;
          errors.push(...boeResult.errors);
          break;
        case 'concursos':
          const concoursResult = await scanConcursos();
          scannedSignals = concoursResult.signals;
          errors.push(...concoursResult.errors);
          break;
        case 'boletin_urbanistico':
          const boletinResult = await scanBoletines();
          scannedSignals = boletinResult.signals;
          errors.push(...boletinResult.errors);
          break;
      }

      // Save signals to database
      const client = createServerClient();
      let signalsCreated = 0;

      for (const signal of scannedSignals) {
        try {
          const { score, classification } = calculateAleaScore(signal);
          
          const { error } = await client
            .database
            .from('signals')
            .insert({
              source: signal.source,
              source_url: signal.source_url,
              source_reference: signal.source_reference,
              title: signal.title,
              asset_type: signal.asset_type,
              location_hint: signal.location_hint,
              address: signal.address,
              price: signal.price,
              price_raw: signal.price_raw,
              meters: signal.meters,
              vendor_name: signal.vendor_name,
              description: signal.description,
              alea_score: score,
              score_classification: classification,
              status: 'detected',
              raw_data: signal.raw_data,
            });

          if (!error) signalsCreated++;
        } catch (e: any) {
          errors.push(`Save signal error: ${e.message}`);
        }
      }

      results.push({
        source,
        signals_found: scannedSignals.length,
        signals_created: signalsCreated,
        errors,
        duration_ms: Date.now() - startTime,
      });

    } catch (e: any) {
      results.push({
        source,
        signals_found: 0,
        signals_created: 0,
        errors: [e.message],
        duration_ms: Date.now() - startTime,
      });
    }
  }

  return results;
}
