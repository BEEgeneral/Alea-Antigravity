import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import pool from '@/lib/vps-pg';

const minimax = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY || '',
  baseURL: 'https://api.minimax.io/v1',
});

type Tables = 'leads' | 'properties' | 'investors' | 'mandatarios' | 'collaborators';

async function getTableData(table: Tables) {
  const result = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 100`);
  return result.rows;
}

export async function POST(req: Request) {
  try {
    const { message, action, data: actionData } = await req.json();

    if (action === 'list' && actionData?.table) {
      const rows = await getTableData(actionData.table as Tables);
      return NextResponse.json({
        response: `📊 ${actionData.table.toUpperCase()} (${rows.length}):\n\n${
          rows.slice(0, 10).map((item: any) => {
            if (actionData.table === 'properties') return `- ${item.title}: ${item.price}€`;
            if (actionData.table === 'investors') return `- ${item.full_name}: ${item.budget_min}-${item.budget_max}€`;
            if (actionData.table === 'leads') return `- ${item.status}: ${item.name || item.email}`;
            return `- ${item.name || item.id}`;
          }).join('\n')
        }`
      });
    }

    // Get data for context
    const [leads, properties, investors] = await Promise.all([
      getTableData('leads'),
      getTableData('properties'),
      getTableData('investors'),
    ]);

    const summary = `
CRM ACTUAL:

📋 LEADS (${leads.length}):
${leads.slice(0, 5).map((l: any) => `- ${l.status}: ${l.name || l.email}`).join('\n') || 'Sin leads'}

🏠 PROPIEDADES (${properties.length}):
${properties.slice(0, 5).map((p: any) => `- ${p.title}: ${p.price}€ (${p.asset_type})`).join('\n') || 'Sin propiedades'}

👥 INVERSORES (${investors.length}):
${investors.slice(0, 5).map((i: any) => `- ${i.full_name}: ${i.budget_min}-${i.budget_max}€`).join('\n') || 'Sin inversores'}
`;

    const systemPrompt = `Eres el asistente de CRM de Alea Signature. Tienes acceso a la base de datos y puedes crear/modificar/leer registros.

${summary}

El usuario te pide: "${message}"

Responde de forma útil y accionable. Si el usuario quiere crear algo, pregunta los datos necesarios. Si quiere ver información, muéstrala.

Cuando detectes que el usuario quiere CREAR algo, responde con:
"Voy a crear [qué]. Por favor, dime los datos:"

Cuando detectes que el usuario quiere ver algo, responde con la información relevante.

Cuando detectes que el usuario quiere MODIFICAR algo, responde:
"Voy a modificar [qué]. ¿Qué datos quieres cambiar?"`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    const completionResult = await minimax.chat.completions.create({
      model: 'MiniMax-M2.7',
      messages,
      temperature: 0.3,
      max_tokens: 1500,
    });

    const response = completionResult.choices[0]?.message?.content || '';

    return NextResponse.json({ response });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
