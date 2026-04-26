import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';
import { PIEDRAS_PRECIOSAS, INVESTOR_TYPES } from '@/lib/investor-personality';

// Match rules: which piedra types prefer which property types
const PIEDRA_PROPERTY_MATCH: Record<string, string[]> = {
  ZAFIRO: ['luxury', 'prime', 'high-end', 'exclusive'],
  PERLA: ['family', 'residential', 'comfort', 'community'],
  ESMERALDA: ['investment', 'rental', 'value-add', 'renovation'],
  RUBI: ['quick-sale', 'auction', 'distressed', 'high-yield']
};

// Match rules: investor type by budget
const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  FAMILY_OFFICE: { min: 5_000_000, max: 100_000_000 },
  HNW_INDIVIDUAL: { min: 1_000_000, max: 4_999_999 },
  REGIONAL_INVESTOR: { min: 100_000, max: 999_999 },
  INSTITUTIONAL: { min: 10_000_000, max: 100_000_000 },
  REAL_ESTATE_FUND: { min: 5_000_000, max: 100_000_000 }
};

export async function GET(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get('investorId');
    const opportunityId = searchParams.get('opportunityId');
    const piedra = searchParams.get('piedra');
    const investorType = searchParams.get('type');
    const minBudget = parseFloat(searchParams.get('minBudget') || '0');
    const maxBudget = parseFloat(searchParams.get('maxBudget') || '100000000');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get investors
    let investorsQuery = client
      .database
      .from('investors')
      .select('*')
      .not('piedra_personalidad', 'is', null)
      .limit(limit);

    if (investorId) {
      investorsQuery = investorsQuery.eq('id', investorId);
    }
    if (piedra) {
      investorsQuery = investorsQuery.eq('piedra_personalidad', piedra);
    }
    if (investorType) {
      investorsQuery = investorsQuery.eq('investor_type', investorType);
    }

    const { data: investors } = await investorsQuery;

    // Get opportunities (blind listings for radar)
    let opportunitiesQuery = client
      .database
      .from('opportunities')
      .select('*')
      .eq('status', 'active')
      .limit(100);

    const { data: opportunities } = await opportunitiesQuery;

    // Match investors to opportunities
    const matches = [];

    for (const investor of (investors || [])) {
      const invBudgetMin = investor.budget_min || 0;
      const invBudgetMax = investor.budget_max || 100_000_000;
      const invPiedra = investor.piedra_personalidad;

      for (const opp of (opportunities || [])) {
        const oppPrice = opp.price || 0;
        
        // Budget compatibility check
        if (oppPrice < invBudgetMin || oppPrice > invBudgetMax) continue;
        if (oppPrice < minBudget || oppPrice > maxBudget) continue;

        // Calculate match score
        let score = 50; // Base score
        const reasons = [];

        // piedra type match
        if (invPiedra && opp.property_type) {
          const preferredTypes = PIEDRA_PROPERTY_MATCH[invPiedra] || [];
          const oppType = opp.property_type.toLowerCase();
          if (preferredTypes.some(t => oppType.includes(t))) {
            score += 30;
            reasons.push(`Piedra ${invPiedra} compatible con tipo ${opp.property_type}`);
          }
        }

        // Same location bonus
        if (investor.preferred_location && opp.location) {
          if (opp.location.toLowerCase().includes(investor.preferred_location.toLowerCase())) {
            score += 15;
            reasons.push('Ubicación preferida coincide');
          }
        }

        // Investor type budget match
        if (investor.investor_type) {
          const typeRange = BUDGET_RANGES[investor.investor_type];
          if (typeRange && oppPrice >= typeRange.min && oppPrice <= typeRange.max) {
            score += 10;
            reasons.push('Presupuesto dentro del rango del tipo');
          }
        }

        // Confidence bonus
        if (investor.classification_data?.confidence) {
          score += Math.round(investor.classification_data.confidence * 10);
        }

        // Clamp score to 100
        score = Math.min(score, 100);

        matches.push({
          investorId: investor.id,
          investorName: investor.full_name,
          investorPiedra: invPiedra,
          investorDisc: investor.disc_profile,
          investorType: investor.investor_type,
          opportunityId: opp.id,
          opportunityTitle: opp.title || opp.address,
          opportunityPrice: oppPrice,
          opportunityLocation: opp.location,
          opportunityType: opp.property_type,
          matchScore: score,
          matchReasons: reasons,
          investorBudget: { min: invBudgetMin, max: invBudgetMax }
        });
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      matches: matches.slice(0, limit),
      stats: {
        totalInvestors: investors?.length || 0,
        totalOpportunities: opportunities?.length || 0,
        totalMatches: matches.length,
        avgScore: matches.length > 0 
          ? Math.round(matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length)
          : 0
      }
    });

  } catch (error: any) {
    console.error('Matching API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get recommended properties for a specific investor
export async function POST(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { investorId, limit = 10 } = await req.json();

    if (!investorId) {
      return NextResponse.json({ error: 'Investor ID required' }, { status: 400 });
    }

    // Get investor
    const { data: investor } = await client
      .database
      .from('investors')
      .select('*')
      .eq('id', investorId)
      .single();

    if (!investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
    }

    // Build query for opportunities
    const budgetMin = investor.budget_min || 0;
    const budgetMax = investor.budget_max || 100_000_000;

    let query = client
      .database
      .from('opportunities')
      .select('*')
      .eq('status', 'active')
      .gte('price', budgetMin)
      .lte('price', budgetMax)
      .limit(limit);

    const { data: opportunities } = await query;

    // Score each opportunity
    const recommendations = (opportunities || []).map(opp => {
      let score = 60;
      const reasons = [];

      const invPiedra = investor.piedra_personalidad;
      if (invPiedra && opp.property_type) {
        const preferred = PIEDRA_PROPERTY_MATCH[invPiedra] || [];
        const oppType = opp.property_type.toLowerCase();
        if (preferred.some(t => oppType.includes(t))) {
          score += 25;
          reasons.push(`Ideal para piedra ${invPiedra}`);
        }
      }

      // DISC communication preference match
      const piedraInfo = invPiedra ? (PIEDRAS_PRECIOSAS as any)[invPiedra] : null;
      if (piedraInfo && opp.closing_strategy) {
        score += 15;
        reasons.push(`Estrategia de cierre: ${piedraInfo.preferredContactStyle}`);
      }

      return {
        opportunity: opp,
        score,
        reasons,
        piedraMatch: invPiedra,
        investorBudget: { min: budgetMin, max: budgetMax }
      };
    });

    recommendations.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      investor: {
        id: investor.id,
        name: investor.full_name,
        piedra: investor.piedra_personalidad,
        disc: investor.disc_profile,
        investorType: investor.investor_type
      },
      recommendations: recommendations.slice(0, limit)
    });

  } catch (error: any) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
