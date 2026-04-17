/**
 * Pelayo Chat API Route
 * AI Assistant for Alea Signature CRM
 * 
 * Capabilities:
 * - CRM queries (leads, properties, investors, mandatarios)
 * - Investor classification (Piedras Preciosas)
 * - Agenda management
 * - OSINT research integration
 * - Memory Palace context
 */

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';
import { generateText, analyzeWithAI, isMiniMaxConfigured } from '@/lib/ai-minimax';

interface Tables {
  leads: any;
  properties: any;
  investors: any;
  mandatarios: any;
  collaborators: any;
}

async function getCRMData(client: Awaited<ReturnType<typeof createAuthenticatedClient>>) {
  const [leads, properties, investors, mandatarios, collaborators] = await Promise.all([
    client.database.from('leads').select('*').order('created_at', { ascending: false }).limit(50),
    client.database.from('properties').select('*').order('created_at', { ascending: false }).limit(50),
    client.database.from('investors').select('*').order('created_at', { ascending: false }).limit(50),
    client.database.from('mandatarios').select('*').order('full_name', { ascending: true }).limit(50),
    client.database.from('collaborators').select('*').order('full_name', { ascending: true }).limit(50),
  ]);

  return {
    leads: leads.data || [],
    properties: properties.data || [],
    investors: investors.data || [],
    mandatarios: mandatarios.data || [],
    collaborators: collaborators.data || [],
  };
}

async function getAgendaActions(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, userId: string) {
  const { data } = await client
    .database
    .from('agenda_actions')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
    .limit(20);

  return data || [];
}

async function saveConversation(
  client: Awaited<ReturnType<typeof createAuthenticatedClient>>,
  userId: string,
  role: 'user' | 'assistant',
  content: string
) {
  await client.database.from('pelayo_conversations').insert({
    user_id: userId,
    role,
    content,
  });
}

async function classifyInvestor(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, investor: any) {
  // Classify based on available data
  let piedra = 'ZAFIRO';
  let disc = 'I';
  
  // Simple heuristic classification
  if (investor.budget_max >= 1000000) {
    piedra = 'RUBI';
    disc = 'D';
  } else if (investor.full_name?.toLowerCase().includes('fund') || investor.company_name?.toLowerCase().includes('fund')) {
    piedra = 'ESMERALDA';
    disc = 'C';
  }

  // Save classification
  await client.database.from('investor_classifications').insert({
    investor_name: investor.full_name,
    investor_email: investor.email,
    company_name: investor.company_name,
    piedra_primaria: piedra,
    disc_profile: disc,
    investor_type: investor.investor_type || 'HNW_INDIVIDUAL',
    risk_profile: 'moderate',
    source: 'pelayo_chat',
    confidence_score: 0.6,
  });

  return { piedra, disc };
}

export async function POST(req: NextRequest) {
  try {
    const client = await createAuthenticatedClient(req);
    const { data: { user } } = await client.auth.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { message, context: clientContext } = await req.json();
    const userId = user.id || user.email;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    // Check if MiniMax is configured
    if (!isMiniMaxConfigured()) {
      return NextResponse.json({
        response: `⚠️ **MiniMax AI no está configurado.**\n\nEl asistente de IA necesita la clave API de MiniMax para funcionar.\n\nConfigúrala en InsForge → Environment Variables.`
      });
    }

    // Get CRM data
    const crm = await getCRMData(client);
    const agendaActions = await getAgendaActions(client, userId);

    // Build context for AI
    const summary = `
CONTEXTO CRM ALEA SIGNATURE:

📋 LEADS (${crm.leads.length}):
${crm.leads.slice(0, 5).map((l: any) => `- ${l.name || l.email} (${l.status || 'sin estado'})`).join('\n') || '- Sin leads'}

🏠 PROPIEDADES (${crm.properties.length}):
${crm.properties.slice(0, 5).map((p: any) => `- ${p.title} (${p.price ? p.price.toLocaleString() + '€' : 'sin precio'})`).join('\n') || '- Sin propiedades'}

👥 INVERSORES (${crm.investors.length}):
${crm.investors.slice(0, 5).map((i: any) => `- ${i.full_name} (${i.email}) ${i.piedra_personalidad ? '[' + i.piedra_personalidad + ']' : ''}`).join('\n') || '- Sin inversores'}

🛡️ MANDATARIOS (${crm.mandatarios.length}):
${crm.mandatarios.slice(0, 3).map((m: any) => `- ${m.full_name}`).join('\n') || '- Sin mandatarios'}

📅 ACCIONES AGENDA (${agendaActions.length}):
${agendaActions.filter((a: any) => a.status !== 'completed').slice(0, 5).map((a: any) => `- ${a.title} (${a.action_type}) - ${a.due_date ? new Date(a.due_date).toLocaleDateString() : 'sin fecha'}`).join('\n') || '- Sin acciones pendientes'}
`;

    // System prompt for Pelayo
    const systemPrompt = `Eres **Pelayo**, el asistente de inteligencia patrimonial de Alea Signature.

Tu rol es ayudar a los agentes de Alea a gestionar el CRM, analizar oportunidades y clasificar inversores.

REGLAS:
1. Responde SIEMPRE en español
2. Usa markdown para formatear respuestas
3. Sé conciso pero completo
4. Cuando detectes un nuevo inversor, ofrece clasificarlo según Piedras Preciosas
5. Para crear registros, pregunta antes de hacerlo
6. Incluye datos relevantes del CRM en tus respuestas

PIEDRAS PRECIOSAS (clasificación de inversores):
- 💎 ZAFIRO: Sociable, disfruta, historias
- 🔮 PERLA: Leal, calmado, ayuda a otros
- 💚 ESMERALDA: Analítico, detallado, datos
- ❤️ RUBÍ: Competitivo, resultados, velocidad

El usuario te pregunta: ${message}

${summary}`;

    // Generate response
    const response = await generateText(
      `${summary}\n\nUsuario: ${message}`,
      {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1500,
      }
    );

    // Save conversation
    await saveConversation(client, userId, 'user', message);
    await saveConversation(client, userId, 'assistant', response);

    // Analyze intent for potential actions
    const intentAnalysis = await analyzeWithAI(
      `Analiza si el usuario quiere hacer algo específico:\n\nMensaje: "${message}"\n\nResponde JSON: { "action": "none|create|search|classify", "entity": "none|lead|property|investor|agenda", "details": "..." }`,
      'Responde solo con JSON válido'
    );

    let suggestedAction = null;
    try {
      const parsed = typeof intentAnalysis.analysis === 'object' 
        ? intentAnalysis.analysis 
        : JSON.parse(intentAnalysis.rawResponse);
      
      if (parsed.action !== 'none') {
        suggestedAction = parsed;
      }
    } catch {}

    return NextResponse.json({
      response: response || 'He procesado tu mensaje. ¿Hay algo más en lo que pueda ayudarte?',
      intent: suggestedAction,
      stats: {
        leads: crm.leads.length,
        properties: crm.properties.length,
        investors: crm.investors.length,
        agendaPending: agendaActions.filter((a: any) => a.status !== 'completed').length,
      }
    });

  } catch (error: any) {
    console.error('Pelayo error:', error);
    
    return NextResponse.json({
      response: `❌ Error: ${error.message || 'Error desconocido'}\n\nPor favor, intenta de nuevo o contacta al administrador.`,
      error: error.message,
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const client = await createAuthenticatedClient(req);
    const { data: { user } } = await client.auth.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'stats';
    const userId = user.id || user.email;

    if (type === 'stats') {
      const crm = await getCRMData(client);
      const agendaActions = await getAgendaActions(client, userId);

      return NextResponse.json({
        leads: crm.leads.length,
        properties: crm.properties.length,
        investors: crm.investors.length,
        mandatarios: crm.mandatarios.length,
        collaborators: crm.collaborators.length,
        agendaPending: agendaActions.filter((a: any) => a.status !== 'completed').length,
        miniMaxConfigured: isMiniMaxConfigured(),
      });
    }

    if (type === 'conversations') {
      const { data } = await client
        .database
        .from('pelayo_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      return NextResponse.json({ conversations: data || [] });
    }

    return NextResponse.json({ status: 'Pelayo API', version: '2.0' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}