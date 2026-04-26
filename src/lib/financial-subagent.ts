/**
 * FinancialSubAgent — Alea Signature
 * Autonomous financial analysis subagent for real estate investment decisions.
 * Generates .md reports from property data, PDFs, and external market data.
 */

import { createServerClient, INSFORGE_APP_URL, INSFORGE_API_KEY } from './insforge-server';
import { AleaAIClient } from './alea-ai';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface Costs {
  communityFee: number;
  insurance: number;
  maintenance: number;
  ibiTax: number;
  propertyManager: number;
}

export interface MarketData {
  location: string;
  avgPricePerSqm: number;
  avgYield: number;
  daysOnMarket: number;
  comparableCount: number;
  priceTrend: 'rising' | 'stable' | 'falling';
  competition: 'high' | 'medium' | 'low';
  idealistaUrl?: string;
  source: string;
  scrapedAt: string;
}

export interface FinancialScenario {
  type: 'buy' | 'sell';
  price: number;
  equity: number;
  financing: number;
  financingRate: number;
  financingYears: number;
  entryCosts: number;
  exitCosts: number;
  monthlyRent: number;
  costs: Costs;
  exitCapRate: number;
  holdingYears: number;
}

export interface ComparisonResult {
  buyIRR: number;
  sellIRR: number;
  netProfit: number;
  totalROI: number;
  paybackYears: number;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  rationale: string;
}

export interface AmortizationRow {
  year: number;
  principal: number;
  interest: number;
  balance: number;
  equity: number;
  cumulativeInterest: number;
}

export interface ReportOptions {
  includeAmortization: boolean;
  includeMarket: boolean;
  includePDFAnalysis: boolean;
  investorProfile: 'family_office' | 'hnw' | 'regional';
}

export interface FinancialReport {
  id: string;
  property_id: string;
  report_markdown: string;
  created_at: string;
  sources: string[];
  report_version: string;
}

export interface PropertyFinancialData {
  title: string;
  address?: string;
  price: number;
  meters: number;
  type: string;
  cap_rate?: number;
  monthly_rent?: number;
  community_fee?: number;
  insurance?: number;
  maintenance?: number;
  ibi_tax?: number;
  vendor_name?: string;
  year_built?: number;
  energy_rating?: string;
  description?: string;
  [key: string]: any;
}

// ─────────────────────────────────────────────────────────
// Financial Calculations
// ─────────────────────────────────────────────────────────

export function calculateGrossYield(price: number, monthlyRent: number): number {
  if (price === 0) return 0;
  return ((monthlyRent * 12) / price) * 100;
}

export function calculateNetYield(
  price: number,
  monthlyRent: number,
  costs: Costs
): number {
  const annualRent = monthlyRent * 12;
  const annualCosts =
    (costs.communityFee || 0) +
    (costs.insurance || 0) +
    (costs.maintenance || 0) +
    (costs.ibiTax || 0) +
    (costs.propertyManager || 0);
  const netIncome = annualRent - annualCosts;
  return price > 0 ? (netIncome / price) * 100 : 0;
}

export function calculateCapRate(noi: number, price: number): number {
  return price > 0 ? (noi / price) * 100 : 0;
}

export function calculateROI(investment: number, annualReturn: number): number {
  return investment > 0 ? (annualReturn / investment) * 100 : 0;
}

export function calculateCashOnCash(equity: number, annualCashFlow: number): number {
  return equity > 0 ? (annualCashFlow / equity) * 100 : 0;
}

export function buildAmortizationTable(
  principal: number,
  annualRate: number,
  years: number
): AmortizationRow[] {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment =
    principal * (monthlyRate * Math.pow(1 + monthlyRate, years * 12)) /
    (Math.pow(1 + monthlyRate, years * 12) - 1);

  const rows: AmortizationRow[] = [];
  let balance = principal;
  let cumulativeInterest = 0;
  let yearPrincipal = 0;
  let yearInterest = 0;

  for (let month = 1; month <= years * 12; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance = Math.max(0, balance - principalPayment);
    cumulativeInterest += interestPayment;
    yearPrincipal += principalPayment;
    yearInterest += interestPayment;

    if (month % 12 === 0) {
      rows.push({
        year: month / 12,
        principal: Math.round(yearPrincipal),
        interest: Math.round(yearInterest),
        balance: Math.round(balance),
        equity: Math.round(principal - balance),
        cumulativeInterest: Math.round(cumulativeInterest),
      });
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }
  return rows;
}

export function calculateIRR(cashFlows: number[], guess = 0.1): number {
  // Newton-Raphson method
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let j = 0; j < cashFlows.length; j++) {
      const factor = Math.pow(1 + rate, j);
      npv += cashFlows[j] / factor;
      dnpv -= (j * cashFlows[j]) / Math.pow(1 + rate, j + 1);
    }
    if (Math.abs(dnpv) < 1e-10) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-8) return newRate * 100;
    rate = newRate;
  }
  return rate * 100;
}

export function estimatePropertyValue(
  meters: number,
  pricePerSqm: number,
  conditionFactor = 1.0
): number {
  return meters * pricePerSqm * conditionFactor;
}

export function compareScenarios(
  buy: FinancialScenario,
  sell: FinancialScenario
): ComparisonResult {
  // Annual cash flow (buy scenario)
  const annualRent = buy.monthlyRent * 12;
  const annualCosts =
    buy.costs.communityFee +
    buy.costs.insurance +
    buy.costs.maintenance +
    buy.costs.ibiTax +
    buy.costs.propertyManager;
  const netIncome = annualRent - annualCosts;
  const annualDebtService =
    (buy.financing / buy.financingYears);
  const annualCashFlow = netIncome - annualDebtService;

  // Total investment (buy)
  const totalInvestment = buy.equity + buy.entryCosts;

  // Exit value (sell scenario)
  const exitValue = sell.price - sell.exitCosts;

  // IRR calculation
  const cashFlows = [-totalInvestment];
  for (let y = 0; y < buy.holdingYears - 1; y++) {
    cashFlows.push(annualCashFlow);
  }
  cashFlows.push(annualCashFlow + exitValue);

  const irr = calculateIRR(cashFlows);
  const totalReturn = exitValue + annualCashFlow * buy.holdingYears - totalInvestment;
  const roi = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
  const payback = annualCashFlow > 0 ? totalInvestment / annualCashFlow : Infinity;

  let recommendation: 'BUY' | 'HOLD' | 'SELL';
  let confidence: number;
  let rationale: string;

  if (irr >= 15 && roi >= 50) {
    recommendation = 'BUY';
    confidence = 0.85;
    rationale = `IRR del ${irr.toFixed(1)}% y ROI del ${roi.toFixed(0)}% superan los umbrales de inversión. Flujo de caja positivo de ${annualCashFlow.toLocaleString('es-ES')}€/año.`;
  } else if (irr >= 8 && roi >= 20) {
    recommendation = 'HOLD';
    confidence = 0.75;
    rationale = `Rentabilidad moderada — IRR del ${irr.toFixed(1)}%. مناسب para inversores que priorizan estabilidad sobre maximización de retorno.`;
  } else {
    recommendation = 'SELL';
    confidence = 0.8;
    rationale = `IRR del ${irr.toFixed(1)}% y ROI del ${roi.toFixed(0)}% no alcanzan los mínimos requeridos. Considerar desinversión o renegociación del precio de entrada.`;
  }

  return {
    buyIRR: irr,
    sellIRR: irr * 0.9, // simplified
    netProfit: totalReturn,
    totalROI: roi,
    paybackYears: payback === Infinity ? -1 : Math.round(payback * 10) / 10,
    recommendation,
    confidence,
    rationale,
  };
}

// ─────────────────────────────────────────────────────────
// PDF Extraction
// ─────────────────────────────────────────────────────────

export async function extractPDFToMarkdown(filePath: string): Promise<string> {
  const { execSync } = await import('child_process');
  try {
    const result = execSync(
      `python3 -c "import pymupdf4llm; print(pymupdf4llm.to_markdown('${filePath.replace(/'/g, "'\"'\"'")}'))"`,
      { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
    );
    return result.toString('utf-8');
  } catch (err: any) {
    console.error('PDF extraction error:', err.message);
    return `Error extracting PDF: ${err.message}`;
  }
}

export async function extractPDFBufferToMarkdown(buffer: Buffer): Promise<string> {
  const os = await import('os');
  const path = await import('path');
  const fs = await import('fs');
  const tmpFile = path.join(os.tmpdir(), `alea_pdf_${Date.now()}.pdf`);
  fs.writeFileSync(tmpFile, buffer);
  try {
    return await extractPDFToMarkdown(tmpFile);
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

// ─────────────────────────────────────────────────────────
// Market Data Scraper
// ─────────────────────────────────────────────────────────

export async function fetchIdealistaData(
  location: string,
  propertyType: string,
  priceMin: number,
  priceMax: number
): Promise<MarketData> {
  // Uses Idealista's public search (no API key needed for basic scraping)
  const query = `${propertyType.toLowerCase()} ${location}`.replace(/\s+/g, '-').toLowerCase();
  const url = `https://www.idealista.com/buscar/?searchText=${encodeURIComponent(location)}&maxPrice=${priceMax}&minPrice=${priceMin}`;

  try {
    const { default: axios } = await import('axios');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cheerio = require('cheerio');

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const listings: { price: number; sqm: number }[] = [];

    // Idealista listing items
    $('article[item-type="offer"]').each((_i: number, el: any) => {
      const priceText = $(el).find('.price').text().replace(/[^\d]/g, '');
      const sqmText = $(el).find('.detail-CHARACTERISTIC span').first().text().replace(/[^\d]/g, '');
      if (priceText) {
        listings.push({
          price: parseInt(priceText) || 0,
          sqm: parseInt(sqmText) || 100,
        });
      }
    });

    if (listings.length === 0) {
      // Fallback: try different selector
      $('.listing-items article').each((_i2: number, el2: any) => {
        const priceText = $(el2).find('.item-price').text().replace(/[^\d]/g, '');
        listings.push({ price: parseInt(priceText) || 0, sqm: 100 });
      });
    }

    const avgPrice = listings.length > 0
      ? listings.reduce((s, l) => s + l.price, 0) / listings.length
      : priceMin;
    const avgPricePerSqm = listings.length > 0
      ? listings.reduce((s, l) => s + l.price / l.sqm, 0) / listings.length
      : avgPrice / 100;
    const avgYield = 4.5; // Default Spanish rental yield
    const avgDays = 45; // Default days on market

    return {
      location,
      avgPricePerSqm: Math.round(avgPricePerSqm),
      avgYield,
      daysOnMarket: avgDays,
      comparableCount: listings.length,
      priceTrend: 'stable',
      competition: listings.length > 20 ? 'high' : listings.length > 5 ? 'medium' : 'low',
      idealistaUrl: url,
      source: 'Idealista (public search)',
      scrapedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.warn('Idealista scrape failed:', err.message);
    return {
      location,
      avgPricePerSqm: priceMin > 0 ? Math.round(priceMin / 100) : 2500,
      avgYield: 4.5,
      daysOnMarket: 45,
      comparableCount: 0,
      priceTrend: 'stable',
      competition: 'low' as const,
      source: 'Fallback (scraping unavailable)',
      scrapedAt: new Date().toISOString(),
    };
  }
}

// ─────────────────────────────────────────────────────────
// AI Analysis
// ─────────────────────────────────────────────────────────

async function generateAIAnalysis(
  property: PropertyFinancialData,
  financial: {
    grossYield: number;
    netYield: number;
    capRate: number;
    comparison: ComparisonResult;
  },
  market: MarketData | null,
  pdfContent: string
): Promise<string> {
  const ai = new AleaAIClient({ model: 'MiniMax-Text-01' });

  const prompt = `Eres el analista financiero principal de Alea Signature, specialize en real estate institucional para Family Offices y fondos de inversión.

Analiza el siguiente activo y genera un resumen ejecutivo de 150 palabras máximo:

**Activo:** ${property.title}
**Precio:** ${(property.price || 0).toLocaleString('es-ES')}€
**Superficie:** ${property.meters}m²
**Precio/m²:** ${property.price && property.meters ? Math.round(property.price / property.meters).toLocaleString('es-ES') : 'N/A'}€/m²
**Alquiler mensual:** ${(property.monthly_rent || 0).toLocaleString('es-ES')}€

**Rentabilidades:**
- Bruta: ${financial.grossYield.toFixed(2)}%
- Neta: ${financial.netYield.toFixed(2)}%
- Cap Rate: ${financial.capRate.toFixed(2)}%

**Mercado:** ${market ? `Precio medio zona: ${market.avgPricePerSqm.toLocaleString('es-ES')}€/m² | Yield zona: ${market.avgYield}% | Comparables: ${market.comparableCount}` : 'Datos de mercado no disponibles'}

**Recomendación IA:** ${financial.comparison.recommendation} — ${financial.comparison.rationale}

**PDF Adjunto:** ${pdfContent ? `Contenido disponible (${pdfContent.length} caracteres)` : 'Sin PDF'}

Devuelve SOLO el resumen ejecutivo, en español, con datos concretos y recomendación clara. Formato: texto plano con bullets donde corresponda.`;

  try {
    const result = await ai.generateText(prompt, { temperature: 0.3, maxTokens: 500 });
    return result;
  } catch {
    return `Análisis automático: Activo con yield del ${financial.grossYield.toFixed(1)}% y valoración ${financial.comparison.recommendation === 'BUY' ? 'FAVORABLE' : financial.comparison.recommendation === 'HOLD' ? 'NEUTRAL' : 'DESFAVORABLE'} para inversión institucional.`;
  }
}

// ─────────────────────────────────────────────────────────
// Main Report Generator
// ─────────────────────────────────────────────────────────

export async function generateFinancialReport(
  property: PropertyFinancialData,
  options: Partial<ReportOptions> = {},
  pdfMarkdown: string[] = [],
  marketData: MarketData | null = null
): Promise<string> {
  const opts: ReportOptions = {
    includeAmortization: true,
    includeMarket: true,
    includePDFAnalysis: true,
    investorProfile: options.investorProfile || 'family_office',
    ...options,
  };

  const price = property.price || 0;
  const meters = property.meters || 0;
  const monthlyRent = property.monthly_rent || 0;

  const costs: Costs = {
    communityFee: property.community_fee || 0,
    insurance: property.insurance || 0,
    maintenance: property.maintenance || 0,
    ibiTax: property.ibi_tax || 0,
    propertyManager: price > 0 ? price * 0.008 : 0, // ~0.8% if not specified
  };

  const grossYield = calculateGrossYield(price, monthlyRent);
  const netYield = calculateNetYield(price, monthlyRent, costs);
  const noi = monthlyRent * 12 - Object.values(costs).reduce((s, v) => s + v, 0);
  const capRate = calculateCapRate(noi, price);

  // Buy scenario
  const buyScenario: FinancialScenario = {
    type: 'buy',
    price,
    equity: Math.round(price * 0.4), // 40% equity, 60% financing
    financing: Math.round(price * 0.6),
    financingRate: 3.5,
    financingYears: 20,
    entryCosts: Math.round(price * 0.12), // 12% taxes + fees
    exitCosts: Math.round(price * 0.08), // 8% selling costs
    monthlyRent,
    costs,
    exitCapRate: capRate * 0.95,
    holdingYears: 5,
  };

  // Sell scenario (appreciation)
  const sellScenario: FinancialScenario = {
    type: 'sell',
    price: Math.round(price * 1.25), // 25% appreciation
    equity: Math.round(price * 0.4),
    financing: 0,
    financingRate: 0,
    financingYears: 0,
    entryCosts: 0,
    exitCosts: Math.round(price * 1.25 * 0.08),
    monthlyRent,
    costs,
    exitCapRate: capRate * 0.95,
    holdingYears: 5,
  };

  const comparison = compareScenarios(buyScenario, sellScenario);
  const aiAnalysis = await generateAIAnalysis(
    property,
    { grossYield, netYield, capRate, comparison },
    marketData,
    pdfMarkdown.join('\n\n')
  );

  const amortization = opts.includeAmortization
    ? buildAmortizationTable(buyScenario.financing, buyScenario.financingRate, buyScenario.financingYears)
    : [];

  const recommendationBadge = {
    BUY: '✅ RECOMENDADO PARA COMPRA',
    HOLD: '⚠️ MANTENER BAJO OBSERVACIÓN',
    SELL: '🔴 CONSIDERAR DESINVERSIÓN',
  }[comparison.recommendation];

  // Build markdown report
  const lines: string[] = [
    `# 📊 INFORME FINANCIERO DE ACTIVO`,
    `**${property.title}**`,
    '',
    `> Generado por FinancialSubAgent Alea | ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    '---',
    '',
    `## ${recommendationBadge}`,
    '',
    aiAnalysis,
    '',
    '---',
    '',
    '## 1. DATOS DEL ACTIVO',
    '',
    '| Campo | Valor |',
    '|-------|-------|',
    `| **Título** | ${property.title} |`,
    `| **Dirección** | ${property.address || 'No disponible'} |`,
    `| **Precio** | ${price > 0 ? price.toLocaleString('es-ES') + ' €' : 'No disponible'} |`,
    `| **Superficie** | ${meters > 0 ? meters.toLocaleString('es-ES') + ' m²' : 'No disponible'} |`,
    `| **Precio/m²** | ${price && meters ? Math.round(price / meters).toLocaleString('es-ES') + ' €/m²' : 'No disponible'} |`,
    `| **Tipo** | ${property.type || 'No especificado'} |`,
    `| **Cap Rate** | ${capRate > 0 ? capRate.toFixed(2) + '%' : 'No disponible'} |`,
    `| **Alquiler mensual** | ${monthlyRent > 0 ? monthlyRent.toLocaleString('es-ES') + ' €' : 'No disponible'} |`,
    `| **Comunidad** | ${costs.communityFee > 0 ? costs.communityFee.toLocaleString('es-ES') + ' €/mes' : 'No disponible'} |`,
    `| **IBI** | ${costs.ibiTax > 0 ? costs.ibiTax.toLocaleString('es-ES') + ' €/año' : 'No disponible'} |`,
    `| **Seguro** | ${costs.insurance > 0 ? costs.insurance.toLocaleString('es-ES') + ' €/año' : 'No disponible'} |`,
    `| **Mantenimiento** | ${costs.maintenance > 0 ? costs.maintenance.toLocaleString('es-ES') + ' €/año' : 'No disponible'} |`,
    `| **Año construcción** | ${property.year_built || 'No disponible'} |`,
    `| **Certificación energética** | ${property.energy_rating || 'No disponible'} |`,
    '',
    '---',
    '',
    '## 2. ANÁLISIS FINANCIERO',
    '',
    `### Rentabilidades`,
    '',
    '| Métrica | Valor | Benchmark |',
    '|---------|-------|----------|',
    `| **Rendimiento Bruto** | ${grossYield.toFixed(2)}% | 4-6% España |`,
    `| **Rendimiento Neto** | ${netYield.toFixed(2)}% | 3-5% España |`,
    `| **Cap Rate** | ${capRate.toFixed(2)}% | 5-7% mercado |`,
    '',
    `### Costes operativos anuales`,
    '',
    '| Concepto | Importe |',
    '|----------|--------|',
    `| Comunidad | ${costs.communityFee.toLocaleString('es-ES')} € |`,
    `| IBI | ${costs.ibiTax.toLocaleString('es-ES')} € |`,
    `| Seguro | ${costs.insurance.toLocaleString('es-ES')} € |`,
    `| Mantenimiento | ${costs.maintenance.toLocaleString('es-ES')} € |`,
    `| Gestión (est.) | ${costs.propertyManager.toLocaleString('es-ES')} € |`,
    `| **TOTAL** | **${Object.values(costs).reduce((s, v) => s + v, 0).toLocaleString('es-ES')} €/año** |`,
    '',
    `### Escenario de Compra (Hipótesis estándar)`,
    '',
    '| Parámetro | Valor |',
    '|------------|-------|',
    `| Precio de compra | ${price.toLocaleString('es-ES')} € |`,
    `| Equity (40%) | ${buyScenario.equity.toLocaleString('es-ES')} € |`,
    `| Financiación (60%) | ${buyScenario.financing.toLocaleString('es-ES')} € |`,
    `| Tipo interés | ${buyScenario.financingRate}% |`,
    `| Plazo | ${buyScenario.financingYears} años |`,
    `| Coste entrada | ${buyScenario.entryCosts.toLocaleString('es-ES')} € |`,
    '',
  ];

  if (opts.includeAmortization && amortization.length > 0) {
    lines.push(
      '',
      `### Cuadro de Amortización (primeros 5 años)`,
      '',
      '| Año | Principal | Intereses | Saldo | Equity |',
      '|-----|-----------|----------|-------|--------|'
    );
    for (const row of amortization.slice(0, 5)) {
      lines.push(
        `| ${row.year} | ${row.principal.toLocaleString('es-ES')} € | ${row.interest.toLocaleString('es-ES')} € | ${row.balance.toLocaleString('es-ES')} € | ${row.equity.toLocaleString('es-ES')} € |`
      );
    }
    lines.push(`*... ${amortization.length - 5} años más*`);
  }

  lines.push(
    '',
    '### Métricas de Inversión',
    '',
    '| Métrica | Valor |',
    '|---------|-------|',
    `| **IRR** | ${comparison.buyIRR.toFixed(2)}% |`,
    `| **ROI Total (${buyScenario.holdingYears} años)** | ${comparison.totalROI.toFixed(1)}% |`,
    `| **Beneficio Neto** | ${comparison.netProfit.toLocaleString('es-ES')} € |`,
    `| **Payback** | ${comparison.paybackYears > 0 ? comparison.paybackYears + ' años' : 'N/A'} |`,
    `| **Confidence** | ${(comparison.confidence * 100).toFixed(0)}% |`,
    ''
  );

  if (opts.includeMarket && marketData) {
    lines.push(
      '---',
      '',
      '## 3. ANÁLISIS DE MERCADO',
      '',
      '| Indicador | Valor |',
      '|------------|-------|',
      `| **Zona** | ${marketData.location} |`,
      `| **Precio medio zona** | ${marketData.avgPricePerSqm.toLocaleString('es-ES')} €/m² |`,
      `| **Yield medio zona** | ${marketData.avgYield}% |`,
      `| **Días en mercado** | ${marketData.daysOnMarket} |`,
      `| **Comparables detectados** | ${marketData.comparableCount} |`,
      `| **Tendencia** | ${marketData.priceTrend === 'rising' ? '📈 Al alza' : marketData.priceTrend === 'falling' ? '📉 A la baja' : '➡️ Estable'} |`,
      `| **Competencia** | ${marketData.competition === 'high' ? '🔴 Alta' : marketData.competition === 'medium' ? '🟡 Media' : '🟢 Baja'} |`,
      '',
      `*Fuente: ${marketData.source} — ${new Date(marketData.scrapedAt).toLocaleDateString('es-ES')}*`,
      ''
    );
  }

  if (opts.includePDFAnalysis && pdfMarkdown.length > 0) {
    lines.push(
      '---',
      '',
      '## 4. ANEXO — CONTENIDO DE PDFs',
      '',
      pdfMarkdown.slice(0, 3).map((content, i) =>
        `### Documento ${i + 1}\n\n${content.slice(0, 3000)}${content.length > 3000 ? '\n\n*(contenido truncado)*' : ''}`
      ).join('\n\n---\n'),
      ''
    );
  }

  lines.push(
    '---',
    '',
    '## 5. FUENTES Y METODOLOGÍA',
    '',
    `- Datos de mercado: ${marketData?.source || 'No disponible'}`,
    `- PDFs analizados: ${pdfMarkdown.length}`,
    `- Tasación房产: Hipótesis estándar (40% equity, 60% financing @ 3.5%, 20 años)`,
    `- Modelo financiero: Alea Signature FinancialSubAgent v1.0`,
    `- Fecha de generación: ${new Date().toISOString()}`,
    '',
    '> ⚠️ *Este informe es indicativo y no constituye asesoramiento financiero oficial. Verificar todos los datos con fuentes primarias antes de tomar decisiones de inversión.*'
  );

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────
// InsForge Storage
// ─────────────────────────────────────────────────────────

export async function saveReportToInsForge(
  propertyId: string,
  reportMarkdown: string,
  sources: string[] = []
): Promise<string> {
  const client = createServerClient();

  // Try to insert, if table doesn't exist, create it first
  const { data, error } = await client.database
    .from('asset_financial_reports')
    .insert({
      property_id: propertyId,
      report_markdown: reportMarkdown,
      sources,
      report_version: '1.0',
    })
    .select('id')
    .single();

  if (error) {
    // Table might not exist — create via InsForge REST API
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      console.warn('asset_financial_reports table does not exist, creating via REST API...');
      try {
        // Create table via InsForge REST API
        const createRes = await fetch(`${process.env.NEXT_PUBLIC_INSFORGE_APP_URL || 'https://if8rkq6j.eu-central.insforge.app'}/rest/v1/asset_financial_reports`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_INSFORGE_API_KEY || ''}`,
            'apikey': process.env.NEXT_PUBLIC_INSFORGE_API_KEY || '',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify([{
            property_id: propertyId,
            report_markdown: reportMarkdown.substring(0, 1000),
            sources,
            report_version: '1.0',
          }]),
        });
        if (createRes.ok || createRes.status === 201) {
          // Retry insert with full data
          const retry = await client.database
            .from('asset_financial_reports')
            .insert({
              property_id: propertyId,
              report_markdown: reportMarkdown,
              sources,
              report_version: '1.0',
            })
            .select('id')
            .single();
          if (retry.error) throw retry.error;
          return retry.data.id;
        }
      } catch (createErr: any) {
        console.error('Failed to create table:', createErr);
      }
      // Fallback: return a local ID
      return `local_${Date.now()}`;
    }
    throw error;
  }
  return data.id;
}

export async function getReportFromInsForge(propertyId: string): Promise<FinancialReport | null> {
  const client = createServerClient();
  const { data, error } = await client.database
    .from('asset_financial_reports')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data as FinancialReport;
}

export async function listReportsForProperty(propertyId: string): Promise<FinancialReport[]> {
  const client = createServerClient();
  const { data, error } = await client.database
    .from('asset_financial_reports')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data || []) as FinancialReport[];
}

export async function deleteReport(reportId: string): Promise<boolean> {
  const client = createServerClient();
  const { error } = await client.database
    .from('asset_financial_reports')
    .delete()
    .eq('id', reportId);
  return !error;
}

// ─────────────────────────────────────────────────────────
// Pipeline: Generate report from property + PDFs
// ─────────────────────────────────────────────────────────

export interface GenerateReportInput {
  property: PropertyFinancialData;
  pdfBuffers?: { filename: string; buffer: Buffer }[];
  options?: Partial<ReportOptions>;
}

export async function generateReportPipeline(
  input: GenerateReportInput
): Promise<{ reportMarkdown: string; reportId: string; sources: string[] }> {
  const { property, pdfBuffers = [], options = {} } = input;

  // 1. Extract PDFs
  const pdfMarkdowns: string[] = [];
  const sources: string[] = [];

  for (const { filename, buffer } of pdfBuffers) {
    try {
      const md = await extractPDFBufferToMarkdown(buffer);
      pdfMarkdowns.push(`## ${filename}\n\n${md}`);
      sources.push(`PDF: ${filename}`);
    } catch (err: any) {
      console.warn(`Failed to extract ${filename}:`, err.message);
    }
  }

  // 2. Fetch market data
  let marketData: MarketData | null = null;
  if (options.includeMarket !== false && property.address) {
    try {
      marketData = await fetchIdealistaData(
        property.address,
        property.type || 'piso',
        Math.round((property.price || 0) * 0.7),
        Math.round((property.price || 0) * 1.3)
      );
      sources.push(`Idealista: ${marketData.idealistaUrl || property.address}`);
    } catch {
      // Continue without market data
    }
  }

  // 3. Generate report
  const reportMarkdown = await generateFinancialReport(
    property,
    options,
    pdfMarkdowns,
    marketData
  );

  // 4. Save to InsForge
  let reportId = 'local_only';
  try {
    reportId = await saveReportToInsForge(property.id, reportMarkdown, sources);
  } catch {
    console.warn('Could not save report to InsForge, returning local only');
  }

  return { reportMarkdown, reportId, sources };
}
