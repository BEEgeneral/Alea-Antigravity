# Investor Patterns System — Implementation Plan

> **For Hermes:** Implementar task-by-task usando subagent-driven-development.

**Goal:** Sistema de patrones de inversión en Alea — detectar qué tipo de activos interesan a cada inversor, derivar patrones automáticamente, y alertar cuando nuevas oportunidades matchean.

**Architecture:**

```
INVESTOR PROFILE          BEHAVIOR TRACKING           PATTERN ENGINE
─────────────────         ─────────────────           ──────────────
piedra + DISC             • Vistas property            Reglas piedra → tipo
budget + type             • Clicks en blind listing    Comportamiento → pref.
preferred_location        • Mensajes enviados          MiniMax extrae patrones
investment_thesis         • Visitas programadas        Historial → señales
                          • Docs abiertos
                                │
                                ▼
                    ┌───────────────────────┐
                    │  PATTERN EXTRACTION   │
                    │  1. Reglas piedras    │
                    │  2. Comportamiento   │
                    │  3. MiniMax AI       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  ACTIVE MATCHING      │
                    │  Nueva opp → investors│
                    │  Score + alert       │
                    └───────────────────────┘
```

**Tech Stack:** Next.js 16, InsForge (Supabase), MiniMax API

---

## TASK 1: Nueva tabla `investor_behavior`

**Objective:** Crear tabla para registrar eventos de comportamiento por inversor.

**Files:**
- Modify: `.env.local` (añadir SCHEMA SQL si aplica)

**Step 1: Verificar que la tabla no existe**

Ejecutar en InsForge SQL editor o via API:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'investor_behavior%';
```

Si no existe, crear con:

```sql
CREATE TABLE investor_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'view', 'inquiry', 'visit', 'message', 'document_open', 'favorite', 'share'
  target_type TEXT NOT NULL, -- 'property', 'opportunity', 'blind_listing', 'document'
  target_id TEXT,
  metadata JSONB DEFAULT '{}', -- {property_id, price, location, property_type, ...}
  source TEXT, -- 'radar', 'email', 'chat', 'direct', 'agent_referral'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_behavior_investor ON investor_behavior(investor_id);
CREATE INDEX idx_behavior_type ON investor_behavior(event_type);
CREATE INDEX idx_behavior_created ON investor_behavior(created_at DESC);
```

**Step 2: Verificar**

```bash
# Test via API (after Task 2)
curl -X POST "https://if8rkq6j.eu-central.insforge.app/rest/v1/rpc/track_behavior" \
  -H "apikey: ik_dbb952a6fd01508d4ae7f53b36e23eaf" \
  -H "Authorization: Bearer ik_dbb952a6fd01508d4ae7f53b36e23eaf" \
  -H "Content-Type: application/json" \
  -d '{"investor_id":"TEST","event_type":"view","target_type":"property"}'
```

Expected: 201 o error de RPC (normal si no está creada la función todavía)

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(investor-patterns): add investor_behavior table"
```

---

## TASK 2: API track behavior — `/api/investor-behavior/track`

**Objective:** Endpoint para registrar eventos de comportamiento.

**Files:**
- Create: `src/app/api/investor-behavior/track/route.ts`

**Step 1: Crear el archivo**

```typescript
import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function POST(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { investor_id, event_type, target_type, target_id, metadata, source } = await req.json();

    if (!investor_id || !event_type || !target_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validEventTypes = ['view', 'inquiry', 'visit', 'message', 'document_open', 'favorite', 'share', 'match_shown', 'alert_sent'];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    const { data, error } = await client
      .database
      .from('investor_behavior')
      .insert({
        investor_id,
        event_type,
        target_type,
        target_id,
        metadata: metadata || {},
        source: source || 'direct',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Track behavior error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, behavior: data }, { status: 201 });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/investor-behavior/track/route.ts
git commit -m "feat(investor-behavior): add track endpoint"
```

---

## TASK 3: API get behavior — `/api/investor-behavior/[investorId]`

**Objective:** Obtener historial de comportamiento de un inversor (para derivar patrones).

**Files:**
- Create: `src/app/api/investor-behavior/[investorId]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ investorId: string }> }
) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { investorId } = await params;
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('eventType');
    const days = parseInt(searchParams.get('days') || '90');
    const limit = parseInt(searchParams.get('limit') || '100');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let query = client
      .database
      .from('investor_behavior')
      .select('*')
      .eq('investor_id', investorId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data: events, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate statistics
    const stats = {
      total: events?.length || 0,
      byType: {} as Record<string, number>,
      uniqueProperties: new Set(events?.filter(e => e.target_type === 'property').map(e => e.target_id)).size,
      lastActivity: events?.[0]?.created_at || null
    };

    (events || []).forEach((e: any) => {
      stats.byType[e.event_type] = (stats.byType[e.event_type] || 0) + 1;
    });

    return NextResponse.json({ 
      events: events || [], 
      stats,
      investorId 
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Step 4: Commit**

```bash
git add src/app/api/investor-behavior/[investorId]/route.ts
git commit -m "feat(investor-behavior): add get behavior endpoint"
```

---

## TASK 4: Motor de extracción de patrones — `/src/lib/investor-patterns.ts`

**Objective:** Módulo central que deriva patrones de inversión desde comportamiento + perfil.

**Files:**
- Create: `src/lib/investor-patterns.ts`

**Step 1: Crear el módulo**

```typescript
/**
 * Investor Patterns Engine
 * Deriva patrones de inversión desde:
 * 1. Profile estático (piedra + DISC + budget + location)
 * 2. Comportamiento histórico (eventos de investor_behavior)
 * 3. Preferencias declaradas (investment_thesis)
 */

import { PIEDRAS_PRECIOSAS, TARGET_DISC, INVESTOR_TYPES } from './investor-personality';

// Tipos de propiedad preferidos por piedra
const PIEDRA_PROPERTY_TYPES: Record<string, string[]> = {
  ZAFIRO: ['luxury_villa', 'penthouse', 'exclusive', 'prime_location', 'sea_view'],
  PERLA: ['family_house', 'residential', 'garden', 'community', 'suburban'],
  ESMERALDA: ['rental_investment', 'value_add', 'renovation', 'commercial', 'rental_yield'],
  RUBI: ['high_yield', 'quick_sale', 'auction', 'distressed', 'opportunity', 'renovation']
};

// Zonas preferidas por piedra (heurística)
const PIEDRA_LOCATIONS: Record<string, string[]> = {
  ZAFIRO: ['marbella', 'ibiza', 'barcelona', 'madrid', 'costa del sol'],
  PERLA: [' residential', 'suburban', 'family_area', 'near_school'],
  ESMERALDA: ['city_center', 'business_district', 'rental_zone'],
  RUBI: ['coastal', 'tourist_area', 'undervalued', 'emerging_zone']
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
    return { derivedFrom: 'profile', confidence: 0.1 };
  }
  
  const piedraInfo = piedra ? (PIEDRAS_PRECIOSAS as any)[piedra] : null;
  const discInfo = disc ? (TARGET_DISC as any)[disc] : null;
  
  return {
    piedra,
    disc,
    preferredPropertyTypes: piedra ? PIEDRA_PROPERTY_TYPES[piedra] || [] : [],
    preferredLocations: piedra ? PIEDRA_LOCATIONS[piedra] || [] : [],
    preferredPriceRange: {
      min: investor.budget_min || 0,
      max: investor.budget_max || 10_000_000
    },
    investmentStyle: deriveInvestmentStyle(piedra, disc),
    yieldExpectation: deriveYieldExpectation(piedra),
    investmentHorizon: deriveHorizon(piedra),
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
    return { derivedFrom: 'behavior', confidence: 0 };
  }
  
  // Agregar eventos por tipo
  const byType: Record<string, number> = {};
  const byLocation: Record<string, number> = {};
  const byPropertyType: Record<string, number> = {};
  const prices: number[] = [];
  
  events.forEach(e => {
    byType[e.event_type] = (byType[e.event_type] || 0) + 1;
    
    if (e.metadata) {
      const loc = e.metadata.location;
      const propType = e.metadata.property_type;
      const price = e.metadata.price;
      
      if (loc) byLocation[loc] = (byLocation[loc] || 0) + 1;
      if (propType) byPropertyType[propType] = (byPropertyType[propType] || 0) + 1;
      if (price) prices.push(price);
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
  return {
    investorId: '',
    piedra: profilePatterns.piedra || behaviorPatterns.piedra || 'UNKNOWN',
    disc: profilePatterns.disc || behaviorPatterns.disc || 'UNKNOWN',
    preferredPropertyTypes: behaviorPatterns.preferredPropertyTypes?.length > 0
      ? behaviorPatterns.preferredPropertyTypes
      : profilePatterns.preferredPropertyTypes || [],
    preferredLocations: behaviorPatterns.preferredLocations?.length > 0
      ? behaviorPatterns.preferredLocations
      : profilePatterns.preferredLocations || [],
    preferredPriceRange: behaviorPatterns.preferredPriceRange?.max
      ? behaviorPatterns.preferredPriceRange
      : profilePatterns.preferredPriceRange || { min: 0, max: 10_000_000 },
    investmentStyle: behaviorPatterns.investmentStyle 
      || profilePatterns.investmentStyle 
      || 'balanced',
    yieldExpectation: behaviorPatterns.yieldExpectation 
      || profilePatterns.yieldExpectation 
      || { min: 4, max: 8 },
    investmentHorizon: behaviorPatterns.investmentHorizon 
      || profilePatterns.investmentHorizon 
      || 'medium',
    signals: behaviorPatterns.signals || { mostActiveEventType: 'view', avgTimeToInquiry: 0, preferredSource: 'direct', engagementScore: 0 },
    confidence: Math.max(
      profilePatterns.confidence || 0,
      behaviorPatterns.confidence || 0
    ),
    derivedFrom: (behaviorPatterns.confidence || 0) > (profilePatterns.confitude || 0) 
      ? 'behavior' 
      : 'profile',
    lastUpdated: new Date().toISOString()
  } as InvestorPattern;
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
    reasons.push(`Precio por debajo del rango preferido`);
  } else {
    score -= 10;
    reasons.push(`Precio por encima del rango preferido`);
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
```

**Step 2: Commit**

```bash
git add src/lib/investor-patterns.ts
git commit -m "feat(investor-patterns): add patterns engine lib"
```

---

## TASK 5: API derive patterns — `/api/investor-patterns/[investorId]`

**Objective:** Deriva patrones para un inversor usando perfil + comportamiento + MiniMax.

**Files:**
- Create: `src/app/api/investor-patterns/[investorId]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';
import { 
  derivePatternsFromProfile, 
  derivePatternsFromBehavior, 
  mergePatterns,
  scoreOpportunityMatch,
  InvestorPattern
} from '@/lib/investor-patterns';
import { analyzeWithMinimax } from '@/lib/minimax';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ investorId: string }> }
) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { investorId } = await params;

    // 1. Get investor profile
    const { data: investor } = await client
      .database
      .from('investors')
      .select('*')
      .eq('id', investorId)
      .single();

    if (!investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
    }

    // 2. Get recent behavior (last 90 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const { data: events } = await client
      .database
      .from('investor_behavior')
      .select('*')
      .eq('investor_id', investorId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    // 3. Derive from profile
    const profilePatterns = derivePatternsFromProfile(investor);

    // 4. Derive from behavior
    const behaviorPatterns = derivePatternsFromBehavior(investor, events || []);

    // 5. Merge
    const mergedPatterns = mergePatterns(profilePatterns, behaviorPatterns);
    mergedPatterns.investorId = investorId;

    // 6. Try AI enhancement with MiniMax if we have enough data
    let aiEnhanced = false;
    if ((events?.length || 0) >= 5 && process.env.MINIMAX_API_KEY) {
      try {
        const behaviorSummary = (events || []).slice(0, 20).map(e => 
          `${e.event_type} on ${e.target_type} (${JSON.stringify(e.metadata)})`
        ).join('\n');

        const aiPrompt = `Eres un analista de inversiones inmobiliarias senior.
Analiza el historial de comportamiento de este inversor y deduce:
1. Tipo de propiedad que realmente busca
2. Ubicaciones que le interesan
3. Rango de precio real (basado en propiedades vistas)
4. Estilo de inversión (conservative/balanced/aggressive)
5. Horizonte temporal (short/medium/long)
6. Yield esperado

Historial:
${behaviorSummary}

Perfil已知: ${investor.piedra_personalidad || 'sin clasificar'}, presupuesto: ${investor.budget_min || 0}-${investor.budget_max || '?'}€

Responde en JSON con este formato:
{
  "preferredPropertyTypes": ["type1", "type2"],
  "preferredLocations": ["location1"],
  "priceRange": {"min": 100000, "max": 500000},
  "investmentStyle": "balanced",
  "investmentHorizon": "medium",
  "yieldExpectation": {"min": 5, "max": 8},
  "insight": "Breve análisis del patrón detectado"
}`;

        const aiResult = await analyzeWithMinimax(aiPrompt);
        const aiText = typeof aiResult === 'string' ? aiResult : (aiResult.rawResponse || aiResult.text || '');

        // Parse JSON from response
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const aiData = JSON.parse(jsonMatch[0]);
          mergedPatterns.preferredPropertyTypes = aiData.preferredPropertyTypes || mergedPatterns.preferredPropertyTypes;
          mergedPatterns.preferredLocations = aiData.preferredLocations || mergedPatterns.preferredLocations;
          mergedPatterns.preferredPriceRange = aiData.priceRange || mergedPatterns.preferredPriceRange;
          mergedPatterns.investmentStyle = aiData.investmentStyle || mergedPatterns.investmentStyle;
          mergedPatterns.investmentHorizon = aiData.investmentHorizon || mergedPatterns.investmentHorizon;
          mergedPatterns.yieldExpectation = aiData.yieldExpectation || mergedPatterns.yieldExpectation;
          mergedPatterns.derivedFrom = 'ai';
          mergedPatterns.confidence = Math.min(0.95, (events?.length || 0) * 0.03 + 0.5);
          aiEnhanced = true;
        }
      } catch (aiError) {
        console.warn('AI enhancement failed, using merged patterns:', aiError);
      }
    }

    if (!aiEnhanced) {
      mergedPatterns.derivedFrom = mergedPatterns.confidence > 0.3 ? 'hybrid' : 'profile';
    }

    return NextResponse.json({
      investor: {
        id: investor.id,
        name: investor.full_name,
        piedra: investor.piedra_personalidad,
        disc: investor.disc_profile
      },
      patterns: mergedPatterns,
      behaviorStats: {
        totalEvents: events?.length || 0,
        dateRange: { from: cutoffDate.toISOString(), to: new Date().toISOString() }
      },
      aiEnhanced
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/investor-patterns/[investorId]/route.ts
git commit -m "feat(investor-patterns): add derive patterns endpoint with MiniMax"
```

---

## TASK 6: API match new opportunity — `/api/match-opportunity`

**Objective:** Cuando entra una nueva oportunidad, encontrar inversores interesados.

**Files:**
- Create: `src/app/api/match-opportunity/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';
import { derivePatternsFromProfile, scoreOpportunityMatch, InvestorPattern } from '@/lib/investor-patterns';

export async function POST(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { opportunityId, opportunity } = await req.json();

    if (!opportunity && !opportunityId) {
      return NextResponse.json({ error: 'Opportunity ID or object required' }, { status: 400 });
    }

    // Get opportunity if only ID provided
    let opp = opportunity;
    if (!opp && opportunityId) {
      const { data } = await client
        .database
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single();
      opp = data;
    }

    if (!opp) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Get all classified investors
    const { data: investors } = await client
      .database
      .from('investors')
      .select('*')
      .not('piedra_personalidad', 'is', null);

    const matches: any[] = [];

    for (const investor of (investors || [])) {
      const profilePatterns = derivePatternsFromProfile(investor);
      const pattern: InvestorPattern = {
        ...profilePatterns,
        investorId: investor.id
      } as InvestorPattern;

      const { score, reasons } = scoreOpportunityMatch(pattern, opp);

      if (score >= 50) {
        matches.push({
          investorId: investor.id,
          investorName: investor.full_name,
          piedra: investor.piedra_personalidad,
          disc: investor.disc_profile,
          investorType: investor.investor_type,
          budgetMin: investor.budget_min,
          budgetMax: investor.budget_max,
          matchScore: score,
          matchReasons: reasons,
          alertEligible: score >= 70
        });
      }
    }

    // Sort by score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Save matches to investor_interests if opportunityId
    if (opportunityId) {
      for (const match of matches.slice(0, 10)) {
        if (match.alertEligible) {
          await client
            .database
            .from('investor_interests')
            .insert({
              investor_id: match.investorId,
              opportunity_id: opportunityId,
              status: 'new',
              metadata: { matchScore: match.matchScore, matchReasons: match.matchReasons }
            })
            .select();
        }
      }
    }

    return NextResponse.json({
      opportunity: {
        id: opp.id,
        title: opp.title || opp.address,
        price: opp.price,
        location: opp.location,
        propertyType: opp.property_type
      },
      matches: matches.slice(0, 20),
      stats: {
        totalInvestors: investors?.length || 0,
        matched: matches.length,
        highPriority: matches.filter(m => m.matchScore >= 70).length
      }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/match-opportunity/route.ts
git commit -m "feat(investor-patterns): add match opportunity endpoint"
```

---

## TASK 7: Centurion — Pagina de Patrones `/centrion/patterns`

**Objective:** UI en Centurion para ver patrones de inversores y matches activos.

**Files:**
- Create: `src/app/centrion/patterns/page.tsx`

**Step 1: Crear la pagina** (她会 большой, ~400 lines)

La UI debe incluir:

1. **Vista principal — Lista de inversores con patrones**
   - Tarjetas con: nombre, piedra, DISC, engagement score
   - Filtros: piedra, tipo de inversor, engagement score
   - Search por nombre

2. **Al seleccionar un inversor — Panel de detalle**
   - Patrones detectados (tipos de propiedad, ubicaciones, rango precio)
   - Historial de comportamiento (últimos eventos)
   - Oportunidades que matchean con score

3. **Seccion "Nuevos Matches"**
   - Lista de oportunidades que acaban de entrar
   - Cuantos inversores les interesan y con qué score

4. **Acciones**
   - "Derivar patrones" — fuerza recalculo con MiniMax
   - "Ver en mapa" — muestra ubicación de preferencias
   - "Enviar alert" — notifica al inversor

```tsx
// Path: src/app/centrion/patterns/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Brain, MapPin, TrendingUp, Clock, Filter, Search, 
  ChevronRight, AlertTriangle, Star, Eye, MessageSquare,
  Calendar, BarChart3, Sparkles, Building2, Target
} from 'lucide-react';

interface InvestorPattern {
  investorId: string;
  piedra: string;
  disc: string;
  preferredPropertyTypes: string[];
  preferredLocations: string[];
  preferredPriceRange: { min: number; max: number };
  investmentStyle: string;
  yieldExpectation: { min: number; max: number };
  investmentHorizon: string;
  signals: {
    mostActiveEventType: string;
    engagementScore: number;
    preferredSource: string;
  };
  confidence: number;
  derivedFrom: string;
}

const PIEDRA_COLORS: Record<string, string> = {
  ZAFIRO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PERLA: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ESMERALDA: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  RUBI: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const PIEDRA_ICONS: Record<string, string> = {
  ZAFIRO: '💎', PERLA: '🔮', ESMERALDA: '💚', RUBI: '💠'
};

const STYLE_LABELS: Record<string, string> = {
  conservative: 'Conservador', balanced: 'Equilibrado', aggressive: 'Agresivo'
};

const EVENT_ICONS: Record<string, string> = {
  view: '👁️', inquiry: '💬', visit: '📍', message: '✉️', 
  document_open: '📄', favorite: '❤️', share: '↗️'
};

export default function PatternsPage() {
  const [investors, setInvestors] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<Record<string, InvestorPattern>>({});
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ piedra: '', search: '' });
  const [view, setView] = useState<'patterns' | 'matches'>('patterns');
  const [recentMatches, setRecentMatches] = useState<any[]>([]);

  // Fetch investors with patterns
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch classified investors
      const params = new URLSearchParams({ limit: '100' });
      if (filter.piedra) params.set('piedra', filter.piedra);
      if (filter.search) params.set('search', filter.search);
      
      const res = await fetch(`/api/investors?${params}`);
      const data = await res.json();
      
      setInvestors(data.investors || []);
      
      // Fetch patterns for each investor
      const patternPromises = (data.investors || []).map(async (inv: any) => {
        try {
          const patternRes = await fetch(`/api/investor-patterns/${inv.id}`);
          const patternData = await patternRes.json();
          return { id: inv.id, pattern: patternData.patterns };
        } catch {
          return { id: inv.id, pattern: null };
        }
      });
      
      const patternResults = await Promise.all(patternPromises);
      const patternMap: Record<string, InvestorPattern> = {};
      patternResults.forEach(({ id, pattern }) => {
        if (pattern) patternMap[id] = pattern;
      });
      
      setPatterns(patternMap);
      
      // Fetch recent matches (opportunities with investor matches)
      const matchesRes = await fetch('/api/investor-matching?limit=20');
      const matchesData = await matchesRes.json();
      setRecentMatches(matchesData.matches?.slice(0, 10) || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-gray-400';
  };

  const formatPrice = (min: number, max: number) => {
    const fmt = (n: number) => n >= 1_000_000 
      ? `${(n / 1_000_000).toFixed(1)}M€` 
      : `${(n / 1000).toFixed(0)}K€`;
    return `${fmt(min)} - ${fmt(max)}`;
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar — Investor list */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white mb-3">Patrones de Inversión</h2>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar inversor..."
              value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {['', 'ZAFIRO', 'PERLA', 'ESMERALDA', 'RUBI'].map(p => (
              <button
                key={p}
                onClick={() => setFilter(f => ({ ...f, piedra: p }))}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  filter.piedra === p 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {p || 'Todos'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Investor list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-gray-400 text-sm">Cargando...</div>
          ) : investors.length === 0 ? (
            <div className="p-4 text-gray-400 text-sm">No hay inversores clasificados</div>
          ) : (
            investors.map(inv => {
              const pattern = patterns[inv.id];
              const engagementScore = pattern?.signals?.engagementScore || 0;
              
              return (
                <button
                  key={inv.id}
                  onClick={() => setSelectedInvestor(inv)}
                  className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${
                    selectedInvestor?.id === inv.id ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-white text-sm">{inv.full_name}</div>
                      {inv.company_name && (
                        <div className="text-xs text-gray-500">{inv.company_name}</div>
                      )}
                    </div>
                    {pattern?.piedra && (
                      <span className={`px-2 py-0.5 rounded text-xs border ${PIEDRA_COLORS[pattern.piedra]}`}>
                        {PIEDRA_ICONS[pattern.piedra]} {pattern.piedra}
                      </span>
                    )}
                  </div>
                  
                  {pattern && (
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className={`flex items-center gap-1 ${getEngagementColor(engagementScore)}`}>
                        <BarChart3 className="w-3 h-3" />
                        {engagementScore}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {pattern.confidence ? `${Math.round(pattern.confidence * 100)}%` : 'N/A'}
                      </span>
                      <span className="text-gray-600">
                        via {pattern.derivedFrom}
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {selectedInvestor ? (
          <InvestorPatternDetail 
            investor={selectedInvestor} 
            pattern={patterns[selectedInvestor.id]}
            onRefresh={fetchData}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Selecciona un inversor para ver sus patrones</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InvestorPatternDetail({ investor, pattern, onRefresh }: { 
  investor: any; 
  pattern: InvestorPattern | null;
  onRefresh: () => void;
}) {
  const [deriveLoading, setDeriveLoading] = useState(false);

  const handleDerivePatterns = async () => {
    setDeriveLoading(true);
    try {
      await fetch(`/api/investor-patterns/${investor.id}`, { method: 'GET' });
      onRefresh();
    } finally {
      setDeriveLoading(false);
    }
  };

  if (!pattern) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No hay patrones disponibles</p>
        <button
          onClick={handleDerivePatterns}
          disabled={deriveLoading}
          className="mt-4 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30 disabled:opacity-50"
        >
          {deriveLoading ? 'Derivando...' : 'Derivar patrones con IA'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">{investor.full_name}</h2>
          {investor.company_name && (
            <p className="text-gray-400 text-sm">{investor.company_name}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {pattern.piedra && (
              <span className={`px-3 py-1 rounded-lg text-sm border ${PIEDRA_COLORS[pattern.piedra]}`}>
                {PIEDRA_ICONS[pattern.piedra]} {pattern.piedra}
              </span>
            )}
            {pattern.disc && (
              <span className="px-3 py-1 rounded-lg text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {pattern.disc}
              </span>
            )}
            <span className={`px-3 py-1 rounded-lg text-sm ${
              pattern.investmentStyle === 'aggressive' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              pattern.investmentStyle === 'conservative' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              {STYLE_LABELS[pattern.investmentStyle] || pattern.investmentStyle}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleDerivePatterns}
          disabled={deriveLoading}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {deriveLoading ? 'Derivando...' : 'Derivar con IA'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<BarChart3 className="w-5 h-5 text-amber-400" />}
          label="Engagement"
          value={`${pattern.signals?.engagementScore || 0}%`}
          sub={`Más activo: ${EVENT_ICONS[pattern.signals?.mostActiveEventType || 'view']} ${pattern.signals?.mostActiveEventType || 'N/A'}`}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          label="Yield Esperado"
          value={`${pattern.yieldExpectation?.min || 0}-${pattern.yieldExpectation?.max || 0}%`}
          sub="Rentabilidad anual bruta"
        />
        <StatCard
          icon={<Building2 className="w-5 h-5 text-blue-400" />}
          label="Rango Precio"
          value={formatPrice(pattern.preferredPriceRange?.min || 0, pattern.preferredPriceRange?.max || 10_000_000)}
          sub={`Horizonte: ${pattern.investmentHorizon || 'medium'}`}
        />
        <StatCard
          icon={<Brain className="w-5 h-5 text-purple-400" />}
          label="Confianza"
          value={pattern.confidence ? `${Math.round(pattern.confidence * 100)}%` : 'N/A'}
          sub={`Derivado: ${pattern.derivedFrom || 'profile'}`}
        />
      </div>

      {/* Property Types */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Tipos de Propiedad Preferidos
        </h3>
        <div className="flex flex-wrap gap-2">
          {pattern.preferredPropertyTypes?.length > 0 ? (
            pattern.preferredPropertyTypes.map((type, i) => (
              <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
                {type}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-sm">No detectado aún — hace falta más historial</span>
          )}
        </div>
      </div>

      {/* Locations */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Ubicaciones Preferidas
        </h3>
        <div className="flex flex-wrap gap-2">
          {pattern.preferredLocations?.length > 0 ? (
            pattern.preferredLocations.map((loc, i) => (
              <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
                📍 {loc}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-sm">No detectado aún</span>
          )}
        </div>
      </div>

      {/* Pattern insight */}
      {pattern.insight && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-amber-400 mb-1">Análisis IA</div>
              <p className="text-sm text-gray-300">{pattern.insight}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  sub: string;
}) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-lg font-semibold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500">{sub}</div>
    </div>
  );
}
```

**Step 2: Actualizar navigation en layout**

Modify: `src/app/centrion/layout.tsx`

Añadir item de navegación:

```tsx
{
  label: 'Patrones',
  href: '/centrion/patterns',
  icon: <Brain className="w-5 h-5" />
},
```

**Step 3: Commit**

```bash
git add src/app/centrion/patterns/page.tsx src/app/centrion/layout.tsx
git commit -m "feat(centrion): add investor patterns UI page"
```

---

## TASK 8: Integrar tracking en frontend

**Objective:** Hacer tracking automatico de eventos cuando usuarios interactuan con propiedades.

**Files:**
- Modify: `src/components/property/PropertyCard.tsx` o similar
- Modify: `src/app/centrion/investors/page.tsx`

**Step 1: Crear hook de tracking**

Create: `src/hooks/useInvestorBehavior.ts`

```typescript
'use client';

import { useCallback } from 'react';

export function useInvestorBehavior() {
  const track = useCallback(async (
    investorId: string,
    eventType: string,
    targetType: string,
    metadata: Record<string, any> = {},
    source: string = 'direct'
  ) => {
    try {
      await fetch('/api/investor-behavior/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investor_id: investorId, event_type: eventType, target_type: targetType, metadata, source })
      });
    } catch (error) {
      console.warn('Behavior tracking failed:', error);
    }
  }, []);

  return {
    trackView: (investorId: string, propertyId: string, metadata: any) => 
      track(investorId, 'view', 'property', metadata, 'direct'),
    trackInquiry: (investorId: string, propertyId: string, metadata: any) => 
      track(investorId, 'inquiry', 'property', metadata, 'direct'),
    trackFavorite: (investorId: string, propertyId: string, metadata: any) => 
      track(investorId, 'favorite', 'property', metadata, 'direct'),
    trackAlertSent: (investorId: string, opportunityId: string, metadata: any) => 
      track(investorId, 'alert_sent', 'opportunity', metadata, 'system')
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useInvestorBehavior.ts
git commit -m "feat(investor-patterns): add behavior tracking hook"
```

---

## TASK 9: Build y deploy

**Step 1: Build**

```bash
cd /opt/data/Alea-Antigravity
npm run build 2>&1
```

Expected: Build successful, no errors

**Step 2: Deploy**

```bash
npm run deploy 2>&1
# or git push to trigger deployment
```

**Step 3: Verificar**

- Visitar https://if8rkq6j.insforge.site/centrion/patterns
- Login con credenciales admin
- Verificar que la pagina carga y muestra inversores

---

## Verification Checklist

- [ ] Tabla `investor_behavior` creada en InsForge
- [ ] `/api/investor-behavior/track` responde 201
- [ ] `/api/investor-behavior/[id]` devuelve eventos
- [ ] `/api/investor-patterns/[id]` deriva patrones desde profile + behavior
- [ ] MiniMax enhancement funciona si hay 5+ eventos y API key
- [ ] `/api/match-opportunity` encuentra inversores para nueva opp
- [ ] `/centrion/patterns` UI muestra inversores con patrones
- [ ] Filtros por piedra funcionan
- [ ] Panel de detalle muestra patrones detectados
- [ ] Botón "Derivar con IA" funciona
- [ ] Build pasa sin errores
- [ ] Deploy exitoso

---

## Dependencias

- InsForge database accesible (ya configurado)
- MINIMAX_API_KEY en entorno (ya existe)
- Tabla `investors` con columnas `piedra_personalidad`, `disc_profile`, `budget_min`, `budget_max` (ya existen tras investor-classification work)
- Tabla `opportunities` accesible (ya existe)
