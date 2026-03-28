import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { env } from '@/lib/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

type Tables = 'leads' | 'properties' | 'investors' | 'mandatarios' | 'collaborators';

async function getTableData(table: Tables) {
    const { data, error } = await supabaseAdmin.from(table).select('*').order('created_at', { ascending: false });
    return { data: data || [], error };
}

async function createRecord(table: Tables, record: any) {
    const { data, error } = await supabaseAdmin.from(table).insert(record).select().single();
    return { data, error };
}

async function saveConversation(userId: string, role: 'user' | 'assistant', content: string, analysis?: any) {
    await supabaseAdmin.from('pelayo_conversations').insert({
        user_id: userId,
        role,
        content,
        analysis
    });
}

async function getConversationHistory(userId: string, limit = 10) {
    const { data } = await supabaseAdmin
        .from('pelayo_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    return data || [];
}

async function createPendingAction(userId: string, actionType: string, entityType: string, data: any) {
    const { data: result } = await supabaseAdmin
        .from('pelayo_pending_actions')
        .insert({
            user_id: userId,
            action_type: actionType,
            entity_type: entityType,
            data,
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })
        .select()
        .single();
    return result;
}

async function getPendingAction(userId: string, actionId?: string) {
    let query = supabaseAdmin
        .from('pelayo_pending_actions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending');
    
    if (actionId) {
        query = query.eq('id', actionId);
    }
    
    const { data } = await query.single();
    return data;
}

async function confirmPendingAction(actionId: string) {
    const action = await getPendingAction('', actionId);
    if (!action) return { data: null, error: 'Action not found' };
    
    const tableMap: Record<string, Tables> = {
        'create_property': 'properties',
        'create_investor': 'investors',
        'create_lead': 'leads',
        'create_mandatario': 'mandatarios'
    };
    
    const table = tableMap[action.action_type];
    if (!table) return { data: null, error: 'Invalid action type' };
    
    const result = await createRecord(table, action.data);
    return result;
}

async function cancelPendingAction(actionId: string, userId: string) {
    await supabaseAdmin
        .from('pelayo_pending_actions')
        .update({ status: 'cancelled' })
        .eq('id', actionId)
        .eq('user_id', userId);
}

async function createNotification(userId: string, type: string, title: string, message: string, data?: any) {
    await supabaseAdmin
        .from('pelayo_notifications')
        .insert({
            user_id: userId,
            type,
            title,
            message,
            data
        });
}

export async function POST(req: Request) {
    try {
        const { message, user, action: userAction, pendingActionId } = await req.json();
        const userId = user?.id || user?.email || 'anonymous';

        // Handle action confirmations
        if (userAction === 'confirm' && pendingActionId) {
            const result = await confirmPendingAction(pendingActionId);
            if (result.data) {
                await saveConversation(userId, 'assistant', `✅ Registro creado exitosamente: ${JSON.stringify(result.data)}`);
                return NextResponse.json({
                    response: `Perfecto, he creado el registro exitosamente.`,
                    confirmed: true,
                    actionId: pendingActionId
                });
            }
            return NextResponse.json({ error: result.error || 'Error confirming action' }, { status: 400 });
        }

        if (userAction === 'cancel' && pendingActionId) {
            await cancelPendingAction(pendingActionId, userId);
            return NextResponse.json({
                response: `Entendido, he cancelado la acción.`,
                cancelled: true
            });
        }

        // Get conversation history for memory
        const history = await getConversationHistory(userId, 10);
        const historyText = history.length > 0 
            ? `\n\nCONVERSACIÓN ANTERIOR:\n${history.map(h => `${h.role === 'user' ? 'Usuario' : 'Pelayo'}: ${h.content}`).join('\n')}`
            : '';

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
${leadsData.data.slice(0, 5).map((l: any) => `- ${l.status || 'sin estado'}: ${l.name || l.email || 'sin nombre'}`).join('\n')}

🏠 PROPIEDADES (${propertiesData.data.length}):
${propertiesData.data.slice(0, 5).map((p: any) => `- ${p.title}: ${p.price ? p.price.toLocaleString() + '€' : 'sin precio'}`).join('\n')}

👥 INVERSORES (${investorsData.data.length}):
${investorsData.data.slice(0, 5).map((i: any) => `- ${i.full_name}: ${i.budget_min ? i.budget_min.toLocaleString() + '€' : 'sin presupuesto'}`).join('\n')}

🛡️ MANDATARIOS (${mandatariosData.data.length}):
${mandatariosData.data.slice(0, 3).map((m: any) => `- ${m.full_name}`).join('\n')}

📬 BANDEJA IAI (${suggestionsData.data?.length || 0} pendientes):`;

        // Check for pending actions that need confirmation
        const pendingAction = await getPendingAction(userId);
        let pendingConfirmationText = '';
        if (pendingAction) {
            const entityLabel = pendingAction.action_type.replace('create_', '');
            pendingConfirmationText = `
⏳ ACCIÓN PENDIENTE DE CONFIRMAR:
- Tipo: ${entityLabel}
- Datos: ${JSON.stringify(pendingAction.data)}
- Responder "sí, créalo" para confirmar o "cancelar" para否决ar
`;
        }

        // Analyze user intent
        const analysisPrompt = `
Analiza si el usuario quiere CREAR algo en el CRM.

El usuario dice: "${message}"

Responde en JSON:
{
  "intent": "create" | "query" | "none",
  "entity": "property" | "investor" | "lead" | "mandatario" | "none",
  "data": { ...datos extraidos del mensaje },
  "confidence": 0.0-1.0,
  "is_opportunity": true | false,
  "opportunity_type": "high" | "medium" | "low" | null,
  "opportunity_description": "descripción si es oportunidad" | null
}`;

        const analysisResult = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        });

        let analysis: any = { intent: 'none', entity: 'none', confidence: 0 };
        try {
            analysis = JSON.parse(analysisResult.response.text());
        } catch (e) {}

        // Save user message to history
        await saveConversation(userId, 'user', message, analysis);

        // Handle explicit confirmations
        const lowerMessage = message.toLowerCase();
        const explicitConfirmPatterns = [
            'sí, créalo', 'sí, crealo', 'sí, créala', 'sí, creala',
            'sí, confirmo', 'si, confirmo',
            'confirmo', 'confirmed', 'confirmed',
            'sí, crea', 'si, crea', 'vale, crea', 'ok, crea', 'dale, crea',
            'procede', 'proceder', 'sí, proceder'
        ];
        const userConfirm = explicitConfirmPatterns.some(p => lowerMessage.includes(p));

        const userCancel = lowerMessage.includes('cancelar') || lowerMessage.includes('cancelo') || lowerMessage.includes('no');

        // If there's a pending action and user confirms
        if (pendingAction && userConfirm) {
            const result = await confirmPendingAction(pendingAction.id);
            if (result.data) {
                await saveConversation(userId, 'assistant', `Registro creado: ${JSON.stringify(result.data)}`);
                await createNotification(userId, 'info', 'Registro creado', `Se ha creado ${pendingAction.entity_type} exitosamente`);
                
                return NextResponse.json({
                    response: `✅ Perfecto, he creado el ${pendingAction.entity_type} exitosamente.`,
                    confirmed: true,
                    createdRecord: result.data,
                    pendingActionId: pendingAction.id
                });
            }
        }

        // If user cancels
        if ((pendingAction && userCancel) || userAction === 'cancel') {
            await cancelPendingAction(pendingAction?.id || pendingActionId, userId);
            return NextResponse.json({
                response: `De acuerdo, he cancelado la acción.`,
                cancelled: true
            });
        }

        // Main conversation
        const systemPrompt = `Eres **Pelayo**, el asistente de inteligencia patrimonial de Alea Signature.

Eres un asistente conversacional útil y siempre respondes de forma completa.

Tu función es:
1. **Responder preguntas** sobre propiedades, inversores, leads, mandatarios del CRM
2. **Detectar oportunidades** en las conversaciones y describirlas claramente
3. **Crear registros** SOLO cuando el usuario confirma explícitamente
4. **Generar alertas** cuando detectes oportunidades de inversión importantes

REGLAS IMPORTANTES:
- Si detectas que el usuario quiere crear algo, NO lo crees inmediatamente
- En su lugar, muestra un "preview" de los datos y pide confirmación explícita
- Si detectas una oportunidad de inversión, crea una notificación
- Siempre responde en español, de forma clara y directa
- Máximo 300 palabras${historyText}${pendingConfirmationText}

${summary}

El usuario pregunta: ${message}`;

        const chatHistory = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'user', parts: [{ text: message }] }
        ];

        const completionResult = await model.generateContent({
            contents: chatHistory,
            generationConfig: { temperature: 0.5, maxOutputTokens: 1500 }
        });

        let response = completionResult.response.text() || 'Entendido. ¿Hay algo específico del CRM que te gustaría saber?';

        // If AI detected a create intent with high confidence, suggest creating
        if (analysis.intent === 'create' && analysis.entity !== 'none' && analysis.data && analysis.confidence > 0.7 && !pendingAction) {
            const actionType = `create_${analysis.entity}`;
            const pendingRecord = await createPendingAction(userId, actionType, analysis.entity, {
                ...analysis.data,
                created_at: new Date().toISOString()
            });

            response += `\n\n📝 **Vista previa:** Parece que quieres crear un ${analysis.entity}. Datos detectados:\n\`\`\`${JSON.stringify(analysis.data, null, 2)}\`\`\`\n\nResponde "sí, créalo" para confirmar o "cancelar" para否决ar.`;
            response += `\n\n[pending_action:${pendingRecord?.id}]`;
        }

        // If this is a high-value opportunity, create notification
        if (analysis.is_opportunity && analysis.opportunity_type === 'high') {
            await createNotification(
                userId,
                'opportunity',
                '🚨 Oportunidad detectada',
                analysis.opportunity_description || `Posible ${analysis.entity} de alto valor`
            );
            response += '\n\n⚠️ He detectado una oportunidad potencialmente importante y te he enviado una notificación.';
        }

        // Save assistant response to history
        await saveConversation(userId, 'assistant', response, analysis);

        // Get pending actions for this user
        const userPendingActions = await supabaseAdmin
            .from('pelayo_pending_actions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'pending');

        return NextResponse.json({
            response,
            analysis,
            pendingAction: userPendingActions.data?.[0] || null,
            pendingActionsCount: userPendingActions.data?.length || 0
        });

    } catch (error: any) {
        console.error('Pelayo error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'notifications';

    if (type === 'notifications' && userId) {
        const { data } = await supabaseAdmin
            .from('pelayo_notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(10);
        
        return NextResponse.json({ notifications: data || [] });
    }

    if (type === 'pending' && userId) {
        const { data } = await supabaseAdmin
            .from('pelayo_pending_actions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'pending');
        
        return NextResponse.json({ pendingActions: data || [] });
    }

    return NextResponse.json({ 
        status: 'Pelayo AI Assistant',
        endpoints: {
            POST: '/api/pelayo-chat',
            GET: '/api/pelayo-chat?type=notifications&userId=xxx'
        }
    });
}
