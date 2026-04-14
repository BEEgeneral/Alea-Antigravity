import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAuthenticatedClient, INSFORGE_APP_URL, INSFORGE_API_KEY } from '@/lib/insforge-server';
import { env } from '@/lib/env';
import { checkRateLimit } from '@/lib/rate-limit';
import { 
    getMemoryContext, 
    addMemory, 
    addKnowledgeTriple,
    investorWingName,
    type HallType 
} from '@/lib/memory';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

type Tables = 'leads' | 'properties' | 'investors' | 'mandatarios' | 'collaborators';

async function getTableData(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, table: Tables) {
    const { data, error } = await client.database.from(table).select('*').order('created_at', { ascending: false });
    return { data: data || [], error };
}

async function createRecord(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, table: Tables, record: any) {
    const { data, error } = await client.database.from(table).insert(record).select().single();
    return { data, error };
}

async function saveConversation(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, userId: string, role: 'user' | 'assistant', content: string, analysis?: any) {
    await client.database.from('pelayo_conversations').insert({
        user_id: userId,
        role,
        content,
        analysis
    });
}

async function getConversationHistory(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, userId: string, limit = 10) {
    const { data } = await client
        .database
        .from('pelayo_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    return data || [];
}

async function createPendingAction(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, userId: string, actionType: string, entityType: string, data: any) {
    const { data: result } = await client
        .database
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

async function getPendingAction(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, userId: string, actionId?: string) {
    let query = client
        .database
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

async function confirmPendingAction(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, actionId: string) {
    const action = await getPendingAction(client, '', actionId);
    if (!action) return { data: null, error: 'Action not found' };
    
    const tableMap: Record<string, Tables> = {
        'create_property': 'properties',
        'create_investor': 'investors',
        'create_lead': 'leads',
        'create_mandatario': 'mandatarios'
    };
    
    const table = tableMap[action.action_type];
    if (!table) return { data: null, error: 'Invalid action type' };
    
    const result = await createRecord(client, table, action.data);
    return result;
}

async function cancelPendingAction(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, actionId: string, userId: string) {
    await client
        .database
        .from('pelayo_pending_actions')
        .update({ status: 'cancelled' })
        .eq('id', actionId)
        .eq('user_id', userId);
}

async function createNotification(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, userId: string, type: string, title: string, message: string, data?: any) {
    await client
        .database
        .from('pelayo_notifications')
        .insert({
            user_id: userId,
            type,
            title,
            message,
            data
        });
}

async function uploadImageToStorage(base64Data: string, fileName: string): Promise<string | null> {
    try {
        const base64Clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const binaryString = atob(base64Clean);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const uploadRes = await fetch(
            `${INSFORGE_APP_URL}/api/storage/buckets/dossiers/files/${fileName}`,
            {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'image/jpeg',
                    'Authorization': `Bearer ${INSFORGE_API_KEY}`,
                    'x-upsert': 'true'
                }),
                body: bytes
            }
        );

        if (uploadRes.ok) {
            return `${INSFORGE_APP_URL}/api/storage/buckets/dossiers/files/${fileName}`;
        }
        return null;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const rateLimitResponse = checkRateLimit(req);
        if (rateLimitResponse) return rateLimitResponse;

        const client = await createAuthenticatedClient();
        const { data: { user } } = await client.auth.getCurrentUser();
        
        const { message, user: chatUser, action: userAction, pendingActionId, file, extractedContent } = await req.json();
        const userId = user?.id || user?.email || chatUser?.id || chatUser?.email || 'anonymous';

        let uploadedImageUrls: string[] = [];
        let dossierText = '';

        if (extractedContent && extractedContent.images && extractedContent.images.length > 0) {
            dossierText = extractedContent.text || '';
            
            const maxImages = 5;
            const maxImageSize = 5 * 1024 * 1024;
            const imagesToProcess = extractedContent.images.slice(0, maxImages);
            
            const validImages = imagesToProcess.filter((img: any) => {
                if (!img.data || typeof img.data !== 'string') return false;
                const size = img.data.length * 0.75;
                return size <= maxImageSize;
            });

            const imageUploadPromises = validImages.map((img: any, idx: number) => {
                const fileName = `dossier_${Date.now()}_page${img.page}_${idx}.jpg`;
                return uploadImageToStorage(img.data, fileName);
            });
            
            const uploadResults = await Promise.all(imageUploadPromises);
            uploadedImageUrls = uploadResults.filter((url): url is string => url !== null);
        }

        // Handle action confirmations
        if (userAction === 'confirm' && pendingActionId) {
            const result = await confirmPendingAction(client, pendingActionId);
            if (result.data) {
                await saveConversation(client, userId, 'assistant', `✅ Registro creado exitosamente: ${JSON.stringify(result.data)}`);
                return NextResponse.json({
                    response: `Perfecto, he creado el registro exitosamente.`,
                    confirmed: true,
                    actionId: pendingActionId
                });
            }
            return NextResponse.json({ error: result.error || 'Error confirming action' }, { status: 400 });
        }

        if (userAction === 'cancel' && pendingActionId) {
            await cancelPendingAction(client, pendingActionId, userId);
            return NextResponse.json({
                response: `Entendido, he cancelado la acción.`,
                cancelled: true
            });
        }

        // Get conversation history for memory
        const history = await getConversationHistory(client, userId, 10);
        const historyText = history.length > 0 
            ? `\n\nCONVERSACIÓN ANTERIOR:\n${history.map(h => `${h.role === 'user' ? 'Usuario' : 'Pelayo'}: ${h.content}`).join('\n')}`
            : '';

        // Get memory context from MemPalace-style storage
        let memoryContext = '';
        try {
            // Get user email if available
            const userEmail = user?.email || chatUser?.email;
            if (userEmail) {
                const wingName = investorWingName(userId, userEmail);
                const memories = await getMemoryContext(wingName, 10);
                
                if (memories.length > 0) {
                    const byHall: Record<string, string[]> = {};
                    for (const mem of memories) {
                        if (!byHall[mem.hall_type]) {
                            byHall[mem.hall_type] = [];
                        }
                        byHall[mem.hall_type].push(`[${mem.room_name}] ${mem.content.substring(0, 200)}`);
                    }
                    
                    memoryContext = '\n\n📚 MEMORIA DE CONVERSACIONES ANTERIORES:\n';
                    for (const [hall, items] of Object.entries(byHall)) {
                        memoryContext += `\n## ${hall.toUpperCase()}:\n${items.join('\n')}\n`;
                    }
                }
            }
        } catch (memErr) {
            console.error('Error getting memory context:', memErr);
        }

        // Get current CRM data
        const [leadsData, propertiesData, investorsData, mandatariosData, suggestionsData, agendaData] = await Promise.all([
            getTableData(client, 'leads'),
            getTableData(client, 'properties'),
            getTableData(client, 'investors'),
            getTableData(client, 'mandatarios'),
            client.database.from('iai_inbox_suggestions').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
            client.database.from('agenda_actions').select('*, lead:leads(id, investors:investors(full_name))').order('due_date', { ascending: true }).limit(20)
        ]);

        const overdueActions = agendaData.data?.filter((a: any) => 
            new Date(a.due_date) < new Date() && a.status !== 'completed' && a.status !== 'cancelled'
        ) || [];

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

📬 BANDEJA IAI (${suggestionsData.data?.length || 0} pendientes):

📅 ALEA AGENDA:
${overdueActions.length > 0 ? `⚠️ TIENES ${overdueActions.length} ACCIÓN(ES) VENCIDA(S):
${overdueActions.slice(0, 5).map((a: any) => `- ${a.title} (vence hace ${Math.floor((new Date().getTime() - new Date(a.due_date).getTime()) / (1000 * 60 * 60))}h)`).join('\n')}` : '✅ No hay acciones vencidas'}
${agendaData.data?.filter((a: any) => a.status !== 'completed' && a.status !== 'cancelled').length > 0 ? `📋 ACCIONES PENDIENTES (${agendaData.data?.filter((a: any) => a.status !== 'completed' && a.status !== 'cancelled').length}):
${agendaData.data?.filter((a: any) => a.status !== 'completed' && a.status !== 'cancelled').slice(0, 5).map((a: any) => `- ${a.title} (${a.action_type}) - ${a.lead?.investors?.full_name || 'sin lead'}`).join('\n')}` : ''}`;

        // Check for pending actions that need confirmation
        const pendingAction = await getPendingAction(client, userId);
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

        // Build dossier context if present
        let dossierContext = '';
        if (dossierText || uploadedImageUrls.length > 0) {
            dossierContext = `
📄 CONTENIDO DEL DOSSIER ADJUNTO:
${dossierText ? `Texto extraído:\n${dossierText.substring(0, 3000)}${dossierText.length > 3000 ? '...(truncado)' : ''}` : ''}
${uploadedImageUrls.length > 0 ? `\nImágenes adjuntas (${uploadedImageUrls.length}):\n${uploadedImageUrls.map((url, i) => `[Imagen ${i + 1}]: ${url}`).join('\n')}` : ''}
`;
        }

        // Analyze user intent - include dossier content for better analysis
        const analysisPrompt = `
Analiza si el usuario quiere CREAR algo en el CRM.

El usuario dice: "${message}"
${dossierText ? `\n\nContenido del dossier subido:\n${dossierText.substring(0, 2000)}` : ''}

Responde en JSON:
{
  "intent": "create" | "query" | "none",
  "entity": "property" | "investor" | "lead" | "mandatario" | "none",
  "data": { ...datos extraidos del mensaje Y del dossier },
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
        await saveConversation(client, userId, 'user', message + (dossierText ? `\n\n[Dossier adjuntado: ${dossierText.substring(0, 500)}...]` : ''), analysis);

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
            const result = await confirmPendingAction(client, pendingAction.id);
            if (result.data) {
                await saveConversation(client, userId, 'assistant', `Registro creado: ${JSON.stringify(result.data)}`);
                await createNotification(client, userId, 'info', 'Registro creado', `Se ha creado ${pendingAction.entity_type} exitosamente`);
                
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
            await cancelPendingAction(client, pendingAction?.id || pendingActionId, userId);
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
4. **Analizar dossiers** - cuando el usuario sube un PDF, extrae información relevante y ofrece crear registros en el CRM
5. **Gestionar imágenes** - si hay imágenes del dossier, puedes asociarlas a propiedades
6. **Calcular comisiones** - usa la estructura de comisiones de Alea Signature para calcular reparto

## ESTRUCTURA DE COMISIONES ALEA SIGNATURE (IMPORTANTE)

**REGLA 40/60:**
- 40% → Margen Corporativo (Alea Signature) - INTOCABLE
- 60% → Bonus Pool de Ejecución

**PERFILES DE AGENTE:**
- Agente Senior (autónomo): 100% del pool, o 75% si hay referidor externo (25% finder)
- Agente Junior: 60% del pool, 40% para mentor (founders)

**REPARTO POR HITOS (Control de Calidad):**
- Apertura (25%): Intro de activo/comprador validado con NDA
- Gestión (50%): Dossiers técnicos, visitas, due diligence
- Cierre (25%): Firma en notaría y cobro efectivo

**PROTECCIÓN:**
- No Elusión: Prohibido saltar a la empresa (penalización 2x comisión)
- Confidencialidad: 5 años sobre base de datos off-market
- Derechos Remanentes: Agente que se va cobra ops cerradas en 12 meses

**RESUMEN RENTABILIDAD:**
- Caja Alea: 40% → Crecimiento, IA y Founders
- Agente Responsable: 45%-60%
- Colaborador/Finder: 0%-15%

REGLAS IMPORTANTES:
- Si detectas que el usuario quiere crear algo, NO lo crees inmediatamente
- En su lugar, muestra un "preview" de los datos y pide confirmación explícita
- Si detectas una oportunidad de inversión, crea una notificación
- Para cálculos de comisión, aplica la estructura 40/60 y los hitos correspondientes
- Siempre responde en español, de forma clara y directa
- Máximo 300 palabras${historyText}${memoryContext}${pendingConfirmationText}${dossierContext}

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
            const dataWithImages = {
                ...analysis.data,
                ...(uploadedImageUrls.length > 0 && { thumbnail_url: uploadedImageUrls[0], images: uploadedImageUrls }),
                created_at: new Date().toISOString()
            };
            const pendingRecord = await createPendingAction(client, userId, actionType, analysis.entity, dataWithImages);

            response += `\n\n📝 **Vista previa:** Parece que quieres crear un ${analysis.entity}. Datos detectados:\n\`\`\`${JSON.stringify(analysis.data, null, 2)}\`\`\``;
            if (uploadedImageUrls.length > 0) {
                response += `\n📷 ${uploadedImageUrls.length} imagen(es) del dossier adjuntada(s)`;
            }
            response += `\n\nResponde "sí, créalo" para confirmar o "cancelar" para否决ar.`;
            response += `\n\n[pending_action:${pendingRecord?.id}]`;
        }

        // If this is a high-value opportunity, create notification
        if (analysis.is_opportunity && analysis.opportunity_type === 'high') {
            await createNotification(
                client,
                userId,
                'opportunity',
                '🚨 Oportunidad detectada',
                analysis.opportunity_description || `Posible ${analysis.entity} de alto valor`
            );
            response += '\n\n⚠️ He detectado una oportunidad potencialmente importante y te he enviado una notificación.';
        }

        // Save assistant response to history
        await saveConversation(client, userId, 'assistant', response, analysis);

        // Store interaction in memory (MemPalace-style)
        try {
            const userEmail = user?.email || chatUser?.email;
            if (userEmail) {
                const wingName = investorWingName(userId, userEmail);
                
                // Store conversation exchange
                await addMemory(wingName, 'conversations', 'events' as HallType,
                    `User: ${message.substring(0, 500)}\nPelayo: ${response.substring(0, 500)}`,
                    { 
                        source: 'pelayo_chat',
                        importanceScore: analysis.confidence && analysis.confidence > 0.7 ? 70 : 50 
                    }
                );

                // If AI detected a decision, store as fact
                if (analysis.intent === 'create' || analysis.intent === 'decision') {
                    await addMemory(wingName, 'decisions', 'facts' as HallType,
                        `Decision: ${message.substring(0, 300)} → Created: ${analysis.entity || 'unknown'}`,
                        { source: 'pelayo_chat', importanceScore: 80 }
                    );
                }

                // If an investor was mentioned, create knowledge triple
                if (analysis.entity === 'investor' && analysis.data?.email) {
                    await addKnowledgeTriple(
                        userEmail,
                        'discussed_about',
                        analysis.data.email,
                        { source: 'pelayo_chat', confidenceScore: Math.round((analysis.confidence || 0.5) * 100) }
                    );
                }
            }
        } catch (memErr) {
            console.error('Error storing memory:', memErr);
        }

        // Get pending actions for this user
        const userPendingActions = await client
            .database
            .from('pelayo_pending_actions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'pending');

        return NextResponse.json({
            response,
            analysis,
            pendingAction: userPendingActions.data?.[0] || null,
            pendingActionsCount: userPendingActions.data?.length || 0,
            uploadedImages: uploadedImageUrls.length
        });

    } catch (error: any) {
        console.error('Pelayo error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const client = await createAuthenticatedClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'notifications';

    if (type === 'notifications' && userId) {
        const { data } = await client
            .database
            .from('pelayo_notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(10);
        
        return NextResponse.json({ notifications: data || [] });
    }

    if (type === 'pending' && userId) {
        const { data } = await client
            .database
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