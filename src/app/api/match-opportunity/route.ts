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
          try {
            await client
              .database
              .from('investor_interests')
              .insert({
                investor_id: match.investorId,
                opportunity_id: opportunityId,
                status: 'new',
                metadata: { matchScore: match.matchScore, matchReasons: match.matchReasons }
              });
          } catch (e) {
            // Ignore duplicate errors
          }
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
