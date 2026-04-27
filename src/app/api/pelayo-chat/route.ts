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
import pool from '@/lib/vps-pg';
import { generateText, analyzeWithAI, isMiniMaxConfigured } from '@/lib/ai-minimax';

async function getCRMData() {
  const [leads, properties, investors, mandatarios, collaborators] = await Promise.all([
    pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 50'),
    pool.query('SELECT * FROM properties ORDER BY created_at DESC LIMIT 50'),
    pool.query('SELECT * FROM investors ORDER BY created_at DESC LIMIT 50'),
    pool.query('SELECT * FROM mandatarios ORDER BY full_name ASC LIMIT 50'),
    pool.query('SELECT * FROM collaborators ORDER BY full_name ASC LIMIT 50'),
  ]);

  return {
    leads: leads.rows || [],
    properties: properties.rows || [],
    investors: investors.rows || [],
    mandatarios: mandatarios.rows || [],
    collaborators: collaborators.rows || [],
  };
}

async function getAgendaActions(userId: string) {
  const result = await pool.query(
    'SELECT * FROM agenda_actions WHERE assigned_agent_id = $1 ORDER BY due_date ASC LIMIT 20',
    [userId]
  );
  return result.rows || [];
}

async function saveConversation(
  userId: string,
  role: 'user' | 'assistant',
  content: string
) {
  await pool.query(
    'INSERT INTO pelayo_conversations (user_id, role, content) VALUES ($1, $2, $3)',
    [userId, role, content]
  );
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

    const { message } = await req.json();

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
    const crm = await getCRMData();
    const agendaActions = await getAgendaActions('system');

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
    await saveConversation('system', 'user', message);
    await saveConversation('system', 'assistant', response);

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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'stats';

    if (type === 'stats') {
      const crm = await getCRMData();
      const agendaActions = await getAgendaActions('system');

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
