import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createAuthenticatedClient } from '@/lib/insforge-server';

const minimax = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY || '',
  baseURL: 'https://api.minimax.io/v1',
});

type Tables = 'leads' | 'properties' | 'investors' | 'mandatarios' | 'collaborators';

async function getTableData(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, table: Tables) {
    const { data, error } = await client.database.from(table).select('*').order('created_at', { ascending: false });
    return { data: data || [], error };
}

async function createRecord(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, table: Tables, record: any) {
    const { data, error } = await client.database.from(table).insert(record).select().single();
    return { data, error };
}

async function updateRecord(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, table: Tables, id: string, record: any) {
    const { data, error } = await client.database.from(table).update(record).eq('id', id).select().single();
    return { data, error };
}

export async function POST(req: Request) {
    try {
        const client = await createAuthenticatedClient();
        const { data: { user } } = await client.auth.getCurrentUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, action, data: actionData, history } = await req.json();

        const [leadsData, propertiesData, investorsData, mandatariosData] = await Promise.all([
            getTableData(client, 'leads'),
            getTableData(client, 'properties'),
            getTableData(client, 'investors'),
            getTableData(client, 'mandatarios')
        ]);

        const summary = `
CRM ACTUAL:

📋 LEADS (${leadsData.data.length}):
${leadsData.data.slice(0, 5).map((l: any) => `- ${l.status}: ${l.name || l.email}`).join('\n') || 'Sin leads'}

🏠 PROPIEDADES (${propertiesData.data.length}):
${propertiesData.data.slice(0, 5).map((p: any) => `- ${p.title}: ${p.price}€ (${p.type})`).join('\n') || 'Sin propiedades'}

👥 INVERSORES (${investorsData.data.length}):
${investorsData.data.slice(0, 5).map((i: any) => `- ${i.full_name}: ${i.budget_min}-${i.budget_max}€`).join('\n') || 'Sin inversores'}

🛡️ MANDATARIOS (${mandatariosData.data.length}):
${mandatariosData.data.slice(0, 5).map((m: any) => `- ${m.name}`).join('\n') || 'Sin mandatarios'}
`;

        if (action === 'create' && actionData) {
            const { table, record } = actionData;
            
            const result = await createRecord(client, table, record);
            
            if (result.error) {
                return NextResponse.json({ 
                    response: `❌ Error al crear: ${result.error.message}` 
                });
            }
            
            return NextResponse.json({ 
                response: `✅ ${table === 'leads' ? 'Lead' : table === 'properties' ? 'Propiedad' : table === 'investors' ? 'Inversor' : 'Mandatario'} creado correctamente.\n\n${JSON.stringify(result.data, null, 2)}` 
            });
        }

        if (action === 'update' && actionData) {
            const { table, id, record } = actionData;
            
            const result = await updateRecord(client, table, id, record);
            
            if (result.error) {
                return NextResponse.json({ 
                    response: `❌ Error al actualizar: ${result.error.message}` 
                });
            }
            
            return NextResponse.json({ 
                response: `✅ Actualizado correctamente.\n\n${JSON.stringify(result.data, null, 2)}` 
            });
        }

        if (action === 'list' && actionData?.table) {
            const tableData = await getTableData(client, actionData.table as Tables);
            
            return NextResponse.json({ 
                response: `📊 ${actionData.table.toUpperCase()} (${tableData.data.length}):\n\n${
                    tableData.data.slice(0, 10).map((item: any) => {
                        if (actionData.table === 'properties') return `- ${item.title}: ${item.price}€`;
                        if (actionData.table === 'investors') return `- ${item.full_name}: ${item.budget_min}-${item.budget_max}€`;
                        if (actionData.table === 'leads') return `- ${item.status}: ${item.name || item.email}`;
                        return `- ${item.name || item.id}`;
                    }).join('\n')
                }` 
            });
        }

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
            ...(history || []).slice(-4).map((h: any) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
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
