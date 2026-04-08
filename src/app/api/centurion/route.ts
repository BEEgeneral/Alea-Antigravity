import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/lib/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Known Alea Signature team members to exclude from profiles
const KNOWN_TEAM = [
  'alberto gala', 'albertogala', 'alberto',
  'alicia', 'vanessa', 'vanessa rios',
  'alejandro', 'pablo', 'pelayo',
  'alea signature', 'alea'
];

function isKnownTeam(name: string): boolean {
  const lower = name.toLowerCase();
  return KNOWN_TEAM.some(member => lower.includes(member));
}

export async function POST(req: Request) {
  try {
    const { text, sourceType, sourceId, createdBy } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Missing text to analyze' }, { status: 400 });
    }

    // Use AI to extract names and companies
    const prompt = `
Eres un extractor de entidades. Analiza el siguiente texto y extrae TODAS las personas mencionadas con su información.

Texto:
"""
${text.substring(0, 10000)}
"""

Devuelve SOLO un JSON array con este formato:
[
  {
    "name": "Nombre completo de la persona",
    "company": "Empresa a la que pertenece (si se menciona)",
    "role": "Cargo/posición (si se menciona)",
    "email": "Email (si se menciona)",
    "phone": "Teléfono (si se menciona)"
  }
]

Sé exhaustivo. Si no hay personas claras, devuelve un array vacío.
Devuelve null si no encuentras personas.
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
    });

    const responseText = result.response.text().trim();
    let extractedPeople: any[] = [];

    try {
      extractedPeople = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ profiles: [], message: 'No se pudieron extraer personas' });
    }

    // Filter out known team members
    const externalPeople = extractedPeople.filter(
      (p: any) => p.name && !isKnownTeam(p.name)
    );

    // Create or update profiles
    const createdProfiles = [];
    const existingProfiles = [];

    for (const person of externalPeople) {
      // Check if profile already exists
      const { data: existing } = await supabaseAdmin
        .from('centurion_profiles')
        .select('*')
        .or(`full_name.ilike.%${person.name}%,email.ilike.%${person.email}%`)
        .maybeSingle();

      if (existing) {
        // Update existing profile
        const { data: updated } = await supabaseAdmin
          .from('centurion_profiles')
          .update({
            company_name: person.company || existing.company_name,
            company_role: person.role || existing.company_role,
            email: person.email || existing.email,
            phone: person.phone || existing.phone,
            last_contact_date: new Date().toISOString().split('T')[0],
            interaction_count: (existing.interaction_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        existingProfiles.push(updated);
      } else {
        // Create new profile
        const { data: newProfile } = await supabaseAdmin
          .from('centurion_profiles')
          .insert({
            full_name: person.name,
            company_name: person.company,
            company_role: person.role,
            email: person.email,
            phone: person.phone,
            source_type: sourceType || 'document_analysis',
            source_id: sourceId,
            created_by: createdBy,
            needs_deep_scrape: true,
            scrape_status: 'pending',
            is_verified: false
          })
          .select()
          .single();

        if (newProfile) {
          createdProfiles.push(newProfile);
        }
      }
    }

    return NextResponse.json({
      created: createdProfiles,
      existing: existingProfiles,
      totalFound: externalPeople.length,
      filtered: extractedPeople.length - externalPeople.length
    });

  } catch (error: any) {
    console.error('Catfish analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assignedAgentId = searchParams.get('assignedAgentId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabaseAdmin
      .from('centurion_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (assignedAgentId) {
      query = query.eq('assigned_agent_id', assignedAgentId);
    }

    if (status && status !== 'all') {
      query = query.eq('scrape_status', status);
    }

    const { data: profiles, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profiles: profiles || [] });

  } catch (error: any) {
    console.error('Catfish GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { 
      profileId, 
      assignedAgentId,
      communication_style,
      tone_preference,
      personality_type,
      decision_maker,
      influence_level,
      interests,
      values,
      pain_points,
      private_notes,
      agent_visible_notes,
      sentiment_trend,
      is_verified
    } = await req.json();

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };

    if (assignedAgentId !== undefined) updateData.assigned_agent_id = assignedAgentId;
    if (communication_style) updateData.communication_style = communication_style;
    if (tone_preference) updateData.tone_preference = tone_preference;
    if (personality_type) updateData.personality_type = personality_type;
    if (decision_maker !== undefined) updateData.decision_maker = decision_maker;
    if (influence_level) updateData.influence_level = influence_level;
    if (interests) updateData.interests = interests;
    if (values) updateData.values = values;
    if (pain_points) updateData.pain_points = pain_points;
    if (private_notes !== undefined) updateData.private_notes = private_notes;
    if (agent_visible_notes !== undefined) updateData.agent_visible_notes = agent_visible_notes;
    if (sentiment_trend) updateData.sentiment_trend = sentiment_trend;
    if (is_verified !== undefined) updateData.is_verified = is_verified;

    const { data: updated, error } = await supabaseAdmin
      .from('centurion_profiles')
      .update(updateData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updated });

  } catch (error: any) {
    console.error('Catfish PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
