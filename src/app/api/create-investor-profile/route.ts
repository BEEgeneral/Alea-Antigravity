import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function POST(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, company } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    }

    // Create a centurion profile
    const { data: profile, error: profileError } = await client
      .database
      .from('centurion_profiles')
      .insert({
        full_name: name,
        email: email,
        company_name: company,
        source_type: 'manual_entry',
        created_by: user.id,
        needs_deep_scrape: true,
        scrape_status: 'pending'
      })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Create a classification with default values
    const piedraTypes = ['ZAFIRO', 'PERLA', 'ESMERALDA', 'RUBI'];
    const discProfiles = ['D', 'I', 'S', 'C'];
    const investorTypes = ['FAMILY_OFFICE', 'HNW_INDIVIDUAL', 'INSTITUTIONAL', 'REGIONAL_INVESTOR', 'INTERNATIONAL_BUYER'];
    
    // For now, create a pending classification - OSINT will update later
    const { data: classification, error: classError } = await client
      .database
      .from('investor_classifications')
      .insert({
        investor_name: name,
        investor_email: email,
        company_name: company,
        piedra_primaria: 'ZAFIRO', // default until OSINT completes
        disc_profile: 'I',
        investor_type: 'HNW_INDIVIDUAL',
        risk_profile: 'moderate',
        source: 'manual',
        created_by: user.id,
        confidence_score: 0.5
      })
      .select()
      .single();

    if (classError) {
      // Don't fail - profile was created
    }

    // If we have email, also create/update investor record
    if (email) {
      const { data: existingInvestor } = await client
        .database
        .from('investors')
        .select('id')
        .ilike('email', email)
        .limit(1)
        .maybeSingle();

      if (!existingInvestor) {
        await client
          .database
          .from('investors')
          .insert({
            full_name: name,
            email: email,
            company_name: company,
            investor_type: 'lead',
            created_by: user.id
          });
      }
    }

    return NextResponse.json({
      success: true,
      profile,
      classification,
      message: `Perfil creado para ${name}. Ahora puedes usar OSINT para buscar más información.`
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}