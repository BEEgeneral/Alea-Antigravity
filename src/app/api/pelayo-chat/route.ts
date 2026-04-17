/**
 * Pelayo Chat API Route
 * AI Assistant for Alea Signature CRM
 * 
 * Capabilities:
 * - CRM queries (leads, properties, investors, mandatarios)
 * - Investor classification (Piedras Preciosas)
 * - Agenda management
 * - OSINT research integration
 */

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge';
import { generateText, analyzeWithAI, isMiniMaxConfigured } from '@/lib/ai-minimax';

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

export async function POST(req: NextRequest) {
  try {
    // Extract token from request
    let token = req.cookies.get('insforge_token')?.value;
    const authHeader = req.headers.get('authorization');
    
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);

    const { data: authData, error: authError } = await client.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { message } = await req.json();
    const userId = authData.user.id || authData.user.email;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    // Check if MiniMax is configured
    if (!isMiniMaxConfigured()) {
      return NextResponse.json({
        response: `⚠️ **MiniMax AI no está configurado.**\n\nEl asistente necesita la clave API de MiniMax.\n\nConfigúrala en InsForge → Environment Variables.`
      });
    }

    // Get CRM data
    const crm = await getCRMData(client);
    const agendaActions = await getAgendaActions(client, userId);

    // Build context
    const summary = `
📊 **RESUMEN CRM:**

📋 Leads: ${crm.leads.length}
${crm.leads.slice(0, 3).map((l: any) => `- ${l.name || l.email} (${l.status || 'sin estado'})`).join('\n') || '- Sin leads'}

🏠 Propiedades: ${crm.properties.length}
${crm.properties.slice(0, 3).map((p: any) => `- ${p.title} (${p.price ? p.price.toLocaleString() + '€' : 'sin precio'})`).join('\n') || '- Sin propiedades'}

👥 Inversores: ${crm.investors.length}
${crm.investors.slice(0, 3).map((i: any) => `- ${i.full_name} ${i.piedra_personalidad ? '[' + i.piedra_personalidad + ']' : ''}`).join('\n') || '- Sin inversores'}

🛡️ Mandatarios: ${crm.mandatarios.length}

📅 Acciones Agenda: ${agendaActions.filter((a: any) => a.status !== 'completed').length}
`;

    // System prompt
    const systemPrompt = `Eres **Pelayo**, asistente de inteligencia patrimonial de Alea Signature.

REGLAS:
1. Responde SIEMPRE en español
2. Usa markdown para formatear
3. Sé conciso y útil
4. Incluye datos relevantes del CRM

PIEDRAS PRECIOSAS:
- 💎 ZAFIRO: Sociable, historias, tono casual
- 🔮 PERLA: Leal, calmado, ayudar
- 💚 ESMERALDA: Analítico, datos, proceso
- ❤️ RUBÍ: Competitivo, resultados, velocidad

Usuario: ${message}

${summary}`;

    // Generate response
    const response = await generateText(
      `${summary}\n\nPregunta del usuario: ${message}`,
      {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1500,
      }
    );

    // Save conversation
    await saveConversation(client, userId, 'user', message);
    await saveConversation(client, userId, 'assistant', response);

    return NextResponse.json({
      response: response || 'He procesado tu mensaje. ¿Hay algo más?',
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
      response: `❌ Error: ${error.message || 'Error desconocido'}`,
      error: error.message,
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    let token = req.cookies.get('insforge_token')?.value;
    const authHeader = req.headers.get('authorization');
    
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);
    const { data: authData } = await client.auth.getCurrentUser();

    if (!authData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'stats';
    const userId = authData.user.id;

    if (type === 'stats') {
      const crm = await getCRMData(client);
      const agendaActions = await getAgendaActions(client, userId);

      return NextResponse.json({
        leads: crm.leads.length,
        properties: crm.properties.length,
        investors: crm.investors.length,
        mandatarios: crm.mandatarios.length,
        agendaPending: agendaActions.filter((a: any) => a.status !== 'completed').length,
        miniMaxConfigured: isMiniMaxConfigured(),
      });
    }

    return NextResponse.json({ status: 'Pelayo API v2.0' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}