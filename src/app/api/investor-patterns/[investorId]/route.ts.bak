import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';
import { 
  derivePatternsFromProfile, 
  derivePatternsFromBehavior, 
  mergePatterns,
  InvestorPattern
} from '@/lib/investor-patterns';

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
    let aiInsight = '';
    
    if ((events?.length || 0) >= 3 && process.env.MINIMAX_API_KEY) {
      try {
        const { analyzeWithMinimax } = await import('@/lib/minimax');
        
        const behaviorSummary = (events || []).slice(0, 20).map(e => 
          `${e.event_type} on ${e.target_type}${e.metadata?.location ? ` in ${e.metadata.location}` : ''}${e.metadata?.price ? ` at €${Number(e.metadata.price).toLocaleString()}` : ''}`
        ).join('\n');

        const aiPrompt = `Eres un analista de inversiones inmobiliarias senior.
Analiza el historial de comportamiento de este inversor y deduce:
1. Tipos de propiedad que realmente busca
2. Ubicaciones que le interesan
3. Rango de precio real (basado en propiedades vistas)
4. Estilo de inversión (conservative/balanced/aggressive)
5. Horizonte temporal (short/medium/long)
6. Yield esperado
7. Un insight de 1-2 oraciones sobre qué motiva a este inversor

Historial de comportamiento:
${behaviorSummary || 'Sin historial reciente'}

Perfil已知: ${investor.piedra_personalidad || 'sin clasificar'} / ${investor.disc_profile || 'sin DISC'}
Presupuesto: ${(investor.budget_min || 0).toLocaleString('es-ES')}-${(investor.budget_max || 0).toLocaleString('es-ES')}€

Responde SOLO con JSON válido (sin markdown, sin comentarios):
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
        const aiText = typeof aiResult === 'string' ? aiResult : (aiResult.rawResponse || '');

        // Parse JSON from response
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const aiData = JSON.parse(jsonMatch[0]);
            mergedPatterns.preferredPropertyTypes = aiData.preferredPropertyTypes?.length > 0 
              ? aiData.preferredPropertyTypes 
              : mergedPatterns.preferredPropertyTypes;
            mergedPatterns.preferredLocations = aiData.preferredLocations?.length > 0 
              ? aiData.preferredLocations 
              : mergedPatterns.preferredLocations;
            mergedPatterns.preferredPriceRange = aiData.priceRange?.max 
              ? aiData.priceRange 
              : mergedPatterns.preferredPriceRange;
            mergedPatterns.investmentStyle = aiData.investmentStyle || mergedPatterns.investmentStyle;
            mergedPatterns.investmentHorizon = aiData.investmentHorizon || mergedPatterns.investmentHorizon;
            mergedPatterns.yieldExpectation = aiData.yieldExpectation || mergedPatterns.yieldExpectation;
            mergedPatterns.insight = aiData.insight || '';
            mergedPatterns.derivedFrom = 'ai';
            mergedPatterns.confidence = Math.min(0.95, (events?.length || 0) * 0.03 + 0.5);
            aiEnhanced = true;
            aiInsight = aiData.insight || '';
          } catch (parseError) {
            console.warn('Failed to parse AI response:', parseError);
          }
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
      aiEnhanced,
      insight: aiInsight
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
