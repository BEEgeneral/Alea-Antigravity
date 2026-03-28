import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { env } from '@/lib/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

type Tables = 'leads' | 'properties' | 'investors' | 'mandatarios' | 'collaborators';

async function getTableData(table: Tables, filters?: string) {
    let query = supabaseAdmin.from(table).select('*').order('created_at', { ascending: false });
    if (filters) {
        query = query.filter(filters.split(',')[0], 'eq', filters.split(',')[1]);
    }
    const { data, error } = await query;
    return { data: data || [], error };
}

async function createRecord(table: Tables, record: any) {
    const { data, error } = await supabaseAdmin.from(table).insert(record).select().single();
    return { data, error };
}

export async function POST(req: Request) {
    try {
        const { message, history, context, user } = await req.json();

        // Get current CRM data
        const [leadsData, propertiesData, investorsData, mandatariosData, suggestionsData] = await Promise.all([
            getTableData('leads'),
            getTableData('properties'),
            getTableData('investors'),
            getTableData('mandatarios'),
            supabaseAdmin.from('iai_inbox_suggestions').select('*').eq('status', 'pending').order('created_at', { ascending: false })
        ]);

        const summary = `
CRM ALEA SIGNATURE - RESUMEN ACTUAL:

📋 LEADS (${leadsData.data.length}):
${leadsData.data.slice(0, 8).map((l: any) => `- ${l.status || 'sin estado'}: ${l.name || l.email || 'sin nombre'}`).join('\n')}

🏠 PROPIEDADES (${propertiesData.data.length}):
${propertiesData.data.slice(0, 8).map((p: any) => `- ${p.title}: ${p.price ? p.price.toLocaleString() + '€' : 'sin precio'} (${p.type || 'sin tipo'})`).join('\n')}

👥 INVERSORES (${investorsData.data.length}):
${investorsData.data.slice(0, 8).map((i: any) => `- ${i.full_name}: ${i.budget_min ? i.budget_min.toLocaleString() + '€' : 'sin presupuesto'}`).join('\n')}

🛡️ MANDATARIOS (${mandatariosData.data.length}):
${mandatariosData.data.slice(0, 5).map((m: any) => `- ${m.full_name}`).join('\n')}

📬 BANDEJA IAI (${suggestionsData.data?.length || 0} pendientes):
${(suggestionsData.data || []).slice(0, 3).map((s: any) => `- ${s.suggestion_type}: ${s.original_email_subject}`).join('\n')}

USUARIO: ${user?.email || 'anonimo'}
`;

        // Analyze if user wants to create/update something
        const analysisPrompt = `
Analiza si el usuario quiere CREAR o ACTUALIZAR algo en el CRM. 

Menciona explícitamente:
- ¿Quiere crear una PROPIEDAD? (indica los datos)
- ¿Quiere crear un INVERSOR? (indica los datos)
- ¿Quiere crear un LEAD?
- ¿Quiere actualizar algo existente?

Responde en JSON:
{
  "intent": "create" | "update" | "query" | "none",
  "entity": "property" | "investor" | "lead" | "mandatario" | "none",
  "data": { ...datos extraidos },
  "confidence": 0.0-1.0
}

Mensaje del usuario: ${message}`;

        const analysisResult = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        });

        let analysis: any = { intent: 'none', entity: 'none', confidence: 0 };
        try {
            analysis = JSON.parse(analysisResult.response.text());
        } catch (e) {}

        // Si el usuario confirma creación (debe ser explícito - no accidental)
        const lowerMessage = message.toLowerCase();
        const explicitConfirmPatterns = [
            'sí, créalo', 'sí, crealo', 'sí, créala', 'sí, creala',
            'confirmo', 'confirmado', 'confirmed',
            'sí, crea', 'si, crea', 'sí, crear',
            'vale, crea', 'ok, crea', 'dale, crea',
            'procede', 'proceder'
        ];
        const userConfirm = explicitConfirmPatterns.some(p => lowerMessage.includes(p));

        let createdRecord = null;
        
        // Solo crear si el usuario confirma Y hay datos para crear
        if (userConfirm && analysis.intent === 'create' && analysis.entity !== 'none' && analysis.data) {
            const tableMap: Record<string, Tables> = {
                property: 'properties',
                investor: 'investors',
                lead: 'leads',
                mandatario: 'mandatarios'
            };
            
            const table = tableMap[analysis.entity];
            if (table) {
                const recordData = {
                    ...analysis.data,
                    created_at: new Date().toISOString()
                };
                
                const result = await createRecord(table, recordData);
                
                if (result.data) {
                    createdRecord = {
                        table: analysis.entity,
                        data: result.data
                    };
                }
            }
        }

        // Main chat response - Pelayo solo sugiere, NO crea automáticamente
        const systemPrompt = `Eres **Pelayo**, el asistente de inteligencia patrimonial de Alea Signature.

Eres un asistente conversacional útiles y siempre responds de forma completa.

Tu función es:
1. **Responder preguntas** - Sobre propiedades, inversores, leads, mandatarios del CRM
2. **Mostrar resúmenes** - Dar información clara del estado actual
3. **Detectar oportunidades** - Identificar y describir posibles oportunidades
4. **Sugerir acciones** - Cuando detectes algo interesante, sugiere qué hacer

IMPORTANTE:
- SIEMPRE responde, nunca dejes una pregunta sin respuesta
- Si no tienes datos, indica que no tienes esa información
- Usa español y respuestas claras y directas
- No seas excesivamente largo (máximo 300 palabras)

${summary}

El usuario pregunta: ${message}

Responde de forma útil y directa.`;
        
        const chatHistory = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...(history || []).slice(-6).map((h: any) => ({ 
                role: h.role === 'assistant' ? 'model' : 'user', 
                parts: [{ text: h.content }] 
            })),
            { role: 'user', parts: [{ text: message }] }
        ];

        const completionResult = await model.generateContent({
            contents: chatHistory,
            generationConfig: { temperature: 0.5, maxOutputTokens: 1500 }
        });

        let response = completionResult.response.text();
        
        if (!response || response.trim() === '') {
            response = 'Entendido. ¿Hay algo específico sobre el CRM que te gustaría saber? Puedo mostrarte las propiedades, inversores, leads o mandatarios.';
        }

        const suggestedActions = [];
        if (response?.toLowerCase().includes('propiedad')) {
            suggestedActions.push({ type: 'show_properties', label: 'Ver propiedades' });
        }
        if (response?.toLowerCase().includes('inversor')) {
            suggestedActions.push({ type: 'show_investors', label: 'Ver inversores' });
        }
        suggestedActions.push({ type: 'show_summary', label: 'Resumen general' });

        return NextResponse.json({
            response,
            suggestedActions,
            analysis: analysis.entity !== 'none' ? analysis : undefined,
            createdRecord
        });

    } catch (error: any) {
        console.error('Pelayo error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
