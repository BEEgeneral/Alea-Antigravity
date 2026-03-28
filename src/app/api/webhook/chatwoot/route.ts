import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { env } from '@/lib/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');

const CHATWOOT_TOKEN = env.CHATWOOT_TOKEN || '';
const CHATWOOT_ACCOUNT = '157966';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        
        const eventType = payload.event;
        console.log('Chatwoot webhook:', eventType);

        let conversationId = payload.conversation?.id;
        let messageContent = '';
        let senderInfo = '';
        let channel = 'chatwoot';

        if (eventType === 'message_created' || eventType === 'message_updated') {
            const message = payload.message;
            if (!message) return NextResponse.json({ ok: true });

            conversationId = message.conversation_id;
            messageContent = message.content || '';
            
            if (message.sender) {
                senderInfo = `${message.sender.name || ''} <${message.sender.email || ''}>`;
            }

            if (message.channel === 'Channel::Whatsapp') {
                channel = 'whatsapp';
            } else if (message.channel === 'Channel::Email') {
                channel = 'email';
            }
        }

        if (!messageContent || messageContent.length < 10) {
            return NextResponse.json({ ok: true, reason: 'Message too short or empty' });
        }

        const prompt = `
        Analiza este mensaje de comunicación institucional sobre bienes raíces e inversiones.
        Puede tratarse de un lead, propiedad, inversor, o mandatario.
        
        Extrae la información en JSON:
        {
          "type": "lead" | "property" | "investor" | "mandatario" | "general",
          "summary": "Resumen de 1 línea",
          "has_action_required": true | false,
          "extracted_data": {}
        }
        
        Mensaje:
        ${messageContent}
        `;

        const interpretPrompt = `Eres asistente de CRM inmobiliario. Analiza y responde en español:
        ---
        **Remitente:** ${senderInfo}
        **Resumen:** [2-3 frases]
        **Acción requerida:** Sí/No
        **Prioridad:** 🔴 Alta / 🟡 Media / 🟢 Baja
        ---
        Mensaje: ${messageContent}`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const [extractionResult, interpretationResult] = await Promise.all([
            model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
            }),
            model.generateContent({
                contents: [{ role: 'user', parts: [{ text: interpretPrompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
            })
        ]);

        let extractedData: any = {};
        let aiInterpretation = null;

        try {
            extractedData = JSON.parse(extractionResult.response.text());
        } catch (e) {
            console.error('Parse error:', e);
        }

        try {
            aiInterpretation = interpretationResult.response.text();
        } catch (e) {}

        const { data, error } = await supabaseAdmin
            .from('iai_inbox_suggestions')
            .insert({
                original_email_subject: `Chatwoot - ${channel} - Conv ${conversationId}`,
                original_email_body: messageContent,
                sender_email: senderInfo,
                suggestion_type: extractedData.type || 'lead',
                extracted_data: {
                    ...extractedData.extracted_data,
                    _chatwoot_conversation_id: conversationId,
                    _chatwoot_channel: channel,
                    _iai_summary: extractedData.summary || ''
                },
                ai_interpretation: aiInterpretation,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
        }

        return NextResponse.json({ 
            success: true, 
            event: eventType,
            conversationId,
            processed: true
        });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ status: 'Chatwoot webhook ready', account: CHATWOOT_ACCOUNT });
}
