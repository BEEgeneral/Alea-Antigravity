import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';
import { classifyInvestor, getClassificationPrompt } from '@/lib/investor-personality';
import { analyzeWithMinimax } from '@/lib/minimax';

export async function POST(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      investorId, 
      name, 
      company, 
      email, 
      documents, 
      communicationStyle,
      budgetMin,
      budgetMax,
      triggerOSINT = false 
    } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Missing investor name' }, { status: 400 });
    }

    // Try AI-powered classification first using MiniMax
    let classification = classifyInvestor({
      name,
      company,
      documents,
      communicationStyle,
      budgetMin,
      budgetMax,
      source: 'manual_classification'
    });

    // Enhance with AI if communication style is provided
    if (communicationStyle || email) {
      try {
        const prompt = getClassificationPrompt({
          name,
          company,
          source: communicationStyle || email
        });

        const aiResult = await analyzeWithMinimax(prompt);
        if (aiResult && aiResult.rawResponse) {
          // Try to parse AI response
          const jsonMatch = aiResult.rawResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.piedraPrimaria && parsed.discProfile) {
                classification = {
                  ...classification,
                  piedraPrimaria: parsed.piedraPrimaria,
                  piedraSecundaria: parsed.piedraSecundaria,
                  discProfile: parsed.discProfile,
                  confidence: parsed.confidence || 0.75
                };
              }
            } catch (parseErr) {
              console.warn('Could not parse AI classification response:', parseErr);
            }
          }
        }
      } catch (aiErr) {
        console.warn('AI classification failed, using rule-based:', aiErr);
      }
    }

    // If we have an investorId, update the existing record
    if (investorId) {
      const { data: updated } = await client
        .database
        .from('investors')
        .update({
          investor_type: classification.investorType,
          risk_profile: classification.riskProfile,
          piedra_personalidad: classification.piedraPrimaria,
          disc_profile: classification.discProfile,
          communication_preference: classification.communicationPreference,
          closing_strategy: classification.closingStrategy,
          follow_up_priority: classification.followUpPriority,
          budget_min: classification.budgetRange.min,
          budget_max: classification.budgetRange.max,
          classification_data: classification,
          classified_at: new Date().toISOString(),
          classified_by: user.id
        })
        .eq('id', investorId)
        .select()
        .single();

      return NextResponse.json({
        success: true,
        classification,
        investor: updated
      });
    }

    // Create a new classification record
    const { data: classificationRecord } = await client
      .database
      .from('investor_classifications')
      .insert({
        investor_name: name,
        investor_email: email,
        company_name: company,
        piedra_primaria: classification.piedraPrimaria,
        piedra_secundaria: classification.piedraSecundaria,
        disc_profile: classification.discProfile,
        investor_type: classification.investorType,
        risk_profile: classification.riskProfile,
        communication_preference: classification.communicationPreference,
        closing_strategy: classification.closingStrategy,
        follow_up_priority: classification.followUpPriority,
        budget_range: classification.budgetRange,
        estimated_decision_time: classification.estimatedDecisionTime,
        classification_data: classification,
        source: 'manual',
        created_by: user.id
      })
      .select()
      .single();

    // Optionally trigger OSINT search
    if (triggerOSINT) {
      // Create a centurion profile for OSINT
      const { data: profile } = await client
        .database
        .from('centurion_profiles')
        .insert({
          full_name: name,
          company_name: company,
          email,
          source_type: 'investor_classification',
          created_by: user.id,
          needs_deep_scrape: true,
          scrape_status: 'pending'
        })
        .select()
        .single();

      // Trigger the scrape job
      if (profile) {
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.aleasignature.com'}/api/centurion-scrape`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${req.headers.get('Authorization')?.replace('Bearer ', '')}`
          },
          body: JSON.stringify({
            profileId: profile.id,
            name,
            company
          })
        }).catch(() => {
          // Silently ignore scrape trigger failure - already returned success
        });
      }

      return NextResponse.json({
        success: true,
        classification,
        classificationId: classificationRecord?.id,
        profileId: profile?.id,
        osintTriggered: true
      });
    }

    return NextResponse.json({
      success: true,
      classification,
      classificationId: classificationRecord?.id
    });

  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get('investorId');
    const piedraType = searchParams.get('piedra');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = client
      .database
      .from('investor_classifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (investorId) {
      query = query.eq('investor_id', investorId);
    }

    if (piedraType) {
      query = query.eq('piedra_primaria', piedraType);
    }

    const { data: classifications, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ classifications: classifications || [] });

  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};