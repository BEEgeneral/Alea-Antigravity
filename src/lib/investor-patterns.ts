/**
 * Investor Patterns Engine
 * Deriva patrones de inversión desde:
 * 1. Profile estático (piedra + DISC + budget + location)
 * 2. Comportamiento histórico (eventos de investor_behavior)
 * 3. Preferencias declaradas (investment_thesis)
 * 4. MiniMax AI enhancement
 */

import { PIEDRAS_PRECIOSAS, TARGET_DISC } from './investor-personality';

// Tipos de propiedad preferidos por piedra
const PIEDRA_PROPERTY_TYPES: Record<string, string[]> = {
  ZAFIRO: ['luxury_villa', 'penthouse', 'exclusive', 'prime_location', 'sea_view', 'luxury'],
  PERLA: ['family_house', 'residential', 'garden', 'community', 'suburban', 'family'],
  ESMERALDA: ['rental_investment', 'value_add', 'renovation', 'commercial', 'rental_yield', 'investment'],
  RUBI: ['high_yield', 'quick_sale', 'auction', 'distressed', 'opportunity', 'renovation', 'yield']
};

// Zonas preferidas por piedra (heurística)
const PIEDRA_LOCATIONS: Record<string, string[]> = {
  ZAFIRO: ['marbella', 'ibiza', 'barcelona', 'madrid', 'costa del sol', 'prime'],
  PERLA: ['residential', 'suburban', 'family_area', 'near_school', 'quiet'],
  ESMERALDA: ['city_center', 'business_district', 'rental_zone', 'commercial'],
  RUBI: ['coastal', 'tourist_area', 'undervalued', 'emerging_zone', 'yield']
};

export interface InvestorPattern {
  investorId: string;
  piedra: string;
  disc: string;
  
  // Patrones derivados
  preferredPropertyTypes: string[];
  preferredLocations: string[];
  preferredPriceRange: { min: number; max: number };
  investmentStyle: 'conservative' | 'balanced' | 'aggressive';
  yieldExpectation: { min: number; max: number }; // percentage
  investmentHorizon: 'short' | 'medium' | 'long';
  
  // Señales de comportamiento
  signals: {
    mostActiveEventType: string;
    avgTimeToInquiry: number; // days from view to inquiry
    preferredSource: string;
    engagementScore: number; // 0-100
  };
  
  // Insight IA
  insight?: string;
  
  // Confianza del patrón
  confidence: number; // 0-1
  derivedFrom: 'profile' | 'behavior' | 'ai' | 'hybrid';
  lastUpdated: string;
}

export interface PatternMatch {
  investorId: string;
  investorName: string;
  pattern: InvestorPattern;
  matchScore: number;
  matchedOn: string[]; // reasons
  opportunityId?: string;
  opportunityTitle?: string;
  opportunityPrice?: number;
}

// Deriva patrones desde el perfil estático (piedra + DISC)
export function derivePatternsFromProfile(investor: any): Partial<InvestorPattern> {
  const piedra = investor.piedra_personalidad;
  const disc = investor.disc_profile;
  
  if (!piedra && !disc) {
    return { derivedFrom: 'profile', confidence: 0.1, signals: { mostActiveEventType: 'view', avgTimeToInquiry: 0, preferredSource: 'direct', engagementScore: 0 } };
  }
  
  const piedraInfo = piedra ? (PIEDRAS_PRECIOSAS as any)[piedra] : null;
  const discInfo = disc ? (TARGET_DISC as any)[disc] : null;
  
  return {
    piedra: piedra || 'UNKNOWN',
    disc: disc || 'UNKNOWN',
    preferredPropertyTypes: piedra ? PIEDRA_PROPERTY_TYPES[piedra] || [] : [],
    preferredLocations: piedra ? PIEDRA_LOCATIONS[piedra] || [] : [],
    preferredPriceRange: {
      min: investor.budget_min || 0,
      max: investor.budget_max || 10_000_000
    },
    investmentStyle: deriveInvestmentStyle(piedra, disc),
    yieldExpectation: deriveYieldExpectation(piedra),
    investmentHorizon: deriveHorizon(piedra),
    signals: { mostActiveEventType: 'view', avgTimeToInquiry: 0, preferredSource: 'direct', engagementScore: 0 },
    derivedFrom: 'profile',
    confidence: piedraInfo?.confidence || 0.5,
    lastUpdated: new Date().toISOString()
  };
}

// Deriva patrones desde comportamiento histórico
export function derivePatternsFromBehavior(
  investor: any, 
  events: any[]
): Partial<InvestorPattern> {
  if (!events || events.length === 0) {
    return { derivedFrom: 'behavior', confidence: 0, signals: { mostActiveEventType: 'view', avgTimeToInquiry: 0, preferredSource: 'direct', engagementScore: 0 } };
  }
  
  // Agregar eventos por tipo
  const byType: Record<string, number> = {};
  const byLocation: Record<string, number> = {};
  const byPropertyType: Record<string, number> = {};
  const prices: number[] = [];
  
  events.forEach((e: any) => {
    byType[e.event_type] = (byType[e.event_type] || 0) + 1;
    
    if (e.metadata) {
      const loc = e.metadata.location;
      const propType = e.metadata.property_type;
      const price = e.metadata.price;
      
      if (loc) byLocation[loc] = (byLocation[loc] || 0) + 1;
      if (propType) byPropertyType[propType] = (byPropertyType[propType] || 0) + 1;
      if (price) prices.push(Number(price));
    }
  });
  
  // Top signals
  const mostActiveEventType = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'view';
  
  const preferredLocations = Object.entries(byLocation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);
  
  const preferredPropertyTypes = Object.entries(byPropertyType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);
  
  const avgPrice = prices.length > 0 
    ? prices.reduce((a, b) => a + b, 0) / prices.length 
    : 0;
  
  const engagementScore = Math.min(100, Math.round(events.length * 2));
  
  return {
    preferredLocations,
    preferredPropertyTypes,
    preferredPriceRange: {
      min: avgPrice * 0.7,
      max: avgPrice * 1.3
    },
    signals: {
      mostActiveEventType,
      avgTimeToInquiry: 0, // Would need view→inquiry pairs
      preferredSource: events[0]?.source || 'direct',
      engagementScore
    },
    derivedFrom: 'behavior',
    confidence: Math.min(0.8, events.length * 0.02),
    lastUpdated: new Date().toISOString()
  };
}

// Combina patrones de perfil + comportamiento
export function mergePatterns(
  profilePatterns: Partial<InvestorPattern>,
  behaviorPatterns: Partial<InvestorPattern>
): InvestorPattern {
  const hasBehaviorData = (behaviorPatterns.confidence || 0) > 0.1;
  const hasProfileData = (profilePatterns.confidence || 0) > 0.1;
  
  return {
    investorId: '',
    piedra: profilePatterns.piedra || behaviorPatterns.piedra || 'UNKNOWN',
    disc: profilePatterns.disc || behaviorPatterns.disc || 'UNKNOWN',
    preferredPropertyTypes: hasBehaviorData && (behaviorPatterns.preferredPropertyTypes?.length || 0) > 0
      ? behaviorPatterns.preferredPropertyTypes!
      : profilePatterns.preferredPropertyTypes || [],
    preferredLocations: hasBehaviorData && (behaviorPatterns.preferredLocations?.length || 0) > 0
      ? behaviorPatterns.preferredLocations!
      : profilePatterns.preferredLocations || [],
    preferredPriceRange: hasBehaviorData && behaviorPatterns.preferredPriceRange?.max
      ? behaviorPatterns.preferredPriceRange!
      : profilePatterns.preferredPriceRange || { min: 100_000, max: 10_000_000 },
    investmentStyle: behaviorPatterns.investmentStyle 
      || profilePatterns.investmentStyle 
      || 'balanced',
    yieldExpectation: behaviorPatterns.yieldExpectation 
      || profilePatterns.yieldExpectation 
      || { min: 4, max: 8 },
    investmentHorizon: behaviorPatterns.investmentHorizon 
      || profilePatterns.investmentHorizon 
      || 'medium',
    signals: {
      mostActiveEventType: behaviorPatterns.signals?.mostActiveEventType || profilePatterns.signals?.mostActiveEventType || 'view',
      avgTimeToInquiry: behaviorPatterns.signals?.avgTimeToInquiry || profilePatterns.signals?.avgTimeToInquiry || 0,
      preferredSource: behaviorPatterns.signals?.preferredSource || profilePatterns.signals?.preferredSource || 'direct',
      engagementScore: behaviorPatterns.signals?.engagementScore || profilePatterns.signals?.engagementScore || 0
    },
    confidence: Math.max(
      profilePatterns.confidence || 0.1,
      behaviorPatterns.confidence || 0
    ),
    derivedFrom: hasBehaviorData && (behaviorPatterns.confidence || 0) > (profilePatterns.confidence || 0.1) 
      ? 'hybrid' 
      : 'profile',
    lastUpdated: new Date().toISOString()
  };
}

// Score de match entre patrón y oportunidad
export function scoreOpportunityMatch(
  pattern: InvestorPattern,
  opportunity: any
): { score: number; reasons: string[] } {
  let score = 50; // Base
  const reasons: string[] = [];
  
  const oppPrice = opportunity.price || 0;
  const oppLocation = (opportunity.location || '').toLowerCase();
  const oppType = (opportunity.property_type || '').toLowerCase();
  
  // Price range match
  if (oppPrice >= pattern.preferredPriceRange.min && oppPrice <= pattern.preferredPriceRange.max) {
    score += 20;
    reasons.push(`Precio ${oppPrice.toLocaleString('es-ES')}€ dentro del rango`);
  } else if (oppPrice < pattern.preferredPriceRange.min) {
    score -= 10;
    reasons.push('Precio por debajo del rango preferido');
  } else {
    score -= 10;
    reasons.push('Precio por encima del rango preferido');
  }
  
  // Location match
  const locationMatch = pattern.preferredLocations.some(loc => 
    oppLocation.includes(loc.toLowerCase())
  );
  if (locationMatch) {
    score += 15;
    reasons.push('Ubicación coincide con preferencias');
  }
  
  // Property type match
  const typeMatch = pattern.preferredPropertyTypes.some(type => 
    oppType.includes(type.toLowerCase())
  );
  if (typeMatch) {
    score += 20;
    reasons.push(`Tipo de propiedad coincide con perfil ${pattern.piedra}`);
  }
  
  // Yield match (for ESMERALDA/RUBI)
  if (pattern.piedra === 'ESMERALDA' || pattern.piedra === 'RUBI') {
    const oppYield = opportunity.estimated_yield || opportunity.rental_yield;
    if (oppYield && oppYield >= pattern.yieldExpectation.min) {
      score += 10;
      reasons.push(`Yield ${oppYield}% cumple expectativa`);
    }
  }
  
  return { score: Math.max(0, Math.min(100, score)), reasons };
}

// Helpers
function deriveInvestmentStyle(piedra?: string, disc?: string): 'conservative' | 'balanced' | 'aggressive' {
  if (piedra === 'ESMERALDA' || piedra === 'PERLA') return 'conservative';
  if (piedra === 'RUBI') return 'aggressive';
  if (disc === 'D' || disc === 'I') return 'aggressive';
  return 'balanced';
}

function deriveYieldExpectation(piedra?: string): { min: number; max: number } {
  switch (piedra) {
    case 'ZAFIRO': return { min: 3, max: 6 };
    case 'PERLA': return { min: 4, max: 7 };
    case 'ESMERALDA': return { min: 6, max: 10 };
    case 'RUBI': return { min: 8, max: 15 };
    default: return { min: 4, max: 8 };
  }
}

function deriveHorizon(piedra?: string): 'short' | 'medium' | 'long' {
  switch (piedra) {
    case 'RUBI': return 'short';
    case 'PERLA': return 'long';
    case 'ZAFIRO': return 'medium';
    case 'ESMERALDA': return 'medium';
    default: return 'medium';
  }
}
