import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

const ENRIC_LLORENS_DATA = {
  full_name: 'Enric Llorens',
  email: 'ellorens@ineocorporate.com',
  company_name: 'INEO Corporate',
  company_role: 'CEO',
  phone: null,
  linkedin_url: null,
  twitter_url: null,
  website_url: 'https://ineocorporate.com',
  piedra_personalidad: 'RUBI', // Based on: CEO, ambitious, results-oriented
  disc_profile: 'D', // Dominancia - decisive, competitive
  investor_type: 'INSTITUTIONAL',
  risk_profile: 'moderate',
  communication_preference: 'efficient_brief_meetings',
  closing_strategy: [
    'Mantenlo rápido',
    'Resultados concretos',
    'Mencionar metas frecuentemente',
    'Ellos quieren ser los primeros',
    'Validar sus ideas'
  ],
  classification_data: {
    source: 'manual_entry',
    confidence: 0.7,
    reasoning: 'CEO de empresa corporativa, perfil orientado a resultados y toma de decisiones. Comportamiento típico de RUBÍ.'
  },
  notes: 'INEO Corporate - empresa de servicios corporativos. Potencial cliente de alto valor.',
  scrape_status: 'completed'
};

export async function GET(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already exists
    const { data: existing } = await client
      .database
      .from('centurion_profiles')
      .select('*')
      .ilike('email', 'ellorens@ineocorporate.com')
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Enric Llorens ya existe en la base de datos',
        profile: existing
      });
    }

    // Create new profile
    const { data: profile, error: profileError } = await client
      .database
      .from('centurion_profiles')
      .insert({
        full_name: ENRIC_LLORENS_DATA.full_name,
        email: ENRIC_LLORENS_DATA.email,
        company_name: ENRIC_LLORENS_DATA.company_name,
        company_role: ENRIC_LLORENS_DATA.company_role,
        linkedin_url: ENRIC_LLORENS_DATA.linkedin_url,
        website_url: ENRIC_LLORENS_DATA.website_url,
        piedra_personalidad: ENRIC_LLORENS_DATA.piedra_personalidad,
        disc_profile: ENRIC_LLORENS_DATA.disc_profile,
        personality_summary: ENRIC_LLORENS_DATA.classification_data.reasoning,
        scrape_status: ENRIC_LLORENS_DATA.scrape_status,
        source_type: 'manual_entry',
        created_by: user.id,
        needs_deep_scrape: false
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Create classification
    const { data: classification, error: classError } = await client
      .database
      .from('investor_classifications')
      .insert({
        investor_name: ENRIC_LLORENS_DATA.full_name,
        investor_email: ENRIC_LLORENS_DATA.email,
        company_name: ENRIC_LLORENS_DATA.company_name,
        piedra_primaria: ENRIC_LLORENS_DATA.piedra_personalidad,
        disc_profile: ENRIC_LLORENS_DATA.disc_profile,
        investor_type: ENRIC_LLORENS_DATA.investor_type,
        risk_profile: ENRIC_LLORENS_DATA.risk_profile,
        communication_preference: ENRIC_LLORENS_DATA.communication_preference,
        closing_strategy: ENRIC_LLORENS_DATA.closing_strategy,
        classification_data: ENRIC_LLORENS_DATA.classification_data,
        source: 'manual_entry',
        created_by: user.id,
        confidence_score: 0.7
      })
      .select()
      .single();

    if (classError) {
      console.error('Classification error:', classError);
    }

    // Also create investor record
    const { data: investor, error: investorError } = await client
      .database
      .from('investors')
      .insert({
        full_name: ENRIC_LLORENS_DATA.full_name,
        email: ENRIC_LLORENS_DATA.email,
        company_name: ENRIC_LLORENS_DATA.company_name,
        investor_type: ENRIC_LLORENS_DATA.investor_type,
        piedra_personalidad: ENRIC_LLORENS_DATA.piedra_personalidad,
        disc_profile: ENRIC_LLORENS_DATA.disc_profile,
        risk_profile: ENRIC_LLORENS_DATA.risk_profile,
        classification_data: ENRIC_LLORENS_DATA.classification_data,
        created_by: user.id
      })
      .select()
      .single();

    if (investorError) {
      console.error('Investor error:', investorError);
    }

    return NextResponse.json({
      success: true,
      message: 'Enric Llorens guardado correctamente',
      profile,
      classification,
      investor,
      ficha: {
        nombre: ENRIC_LLORENS_DATA.full_name,
        email: ENRIC_LLORENS_DATA.email,
        empresa: ENRIC_LLORENS_DATA.company_name,
        cargo: ENRIC_LLORENS_DATA.company_role,
        piedra: ENRIC_LLORENS_DATA.piedra_personalidad,
        disc: ENRIC_LLORENS_DATA.disc_profile,
        tipo: ENRIC_LLORENS_DATA.investor_type,
        estrategia: ENRIC_LLORENS_DATA.closing_strategy
      }
    });

  } catch (error: any) {
    console.error('Save Enric Llorens error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}