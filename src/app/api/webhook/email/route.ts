// GEMINI ONLY - NO GROQ - Updated 2026-03-27
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { env } from '@/lib/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        // CRITICAL: Webhook secret is MANDATORY
        if (!env.WEBHOOK_SECRET) {
            console.error('WEBHOOK_SECRET not configured - rejecting request');
            return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
        }
        
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${env.WEBHOOK_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body;
        const contentType = req.headers.get('content-type') || '';

        // Handle Resend webhook format
        if (contentType.includes('application/json')) {
            const jsonBody = await req.json();
            
            // Resend sends: { type: "email.received", data: { ... } }
            if (jsonBody.type === 'email.received' || jsonBody.data) {
                const data = jsonBody.data || jsonBody;
                body = {
                    from: data.from,
                    subject: data.subject,
                    text: data.text || data.html || data.plain_text || '',
                    html: data.html,
                    attachments: data.attachments
                };
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
                const formData = await req.text();
                const params = new URLSearchParams(formData);
                body = {
                    from: params.get('from') || params.get('sender') || 'unknown',
                    subject: params.get('subject') || params.get('subject_line') || 'Sin asunto',
                    text: params.get('text') || params.get('body') || params.get('plain') || '',
                    attachments: params.get('attachments')
                };
            } else {
                body = jsonBody;
            }
        } else {
            body = await req.json().catch(() => req.json());
        }

        const from = body.from || body.sender || body.mailfrom || body.from_email || 'unknown';
        const subject = body.subject || 'Sin asunto';
        const text = body.text || body.body || body.content || body.plain || body.email_text || '';
        const html = body.html || body.body_html || '';
        const attachments = body.attachments || [];
        const attachmentText = body.attachment_text || '';
        const attachmentData = body.attachment_data || []; // Array de {filename, data(base64), content_type}

        // Combine text and html if needed
        let fullText = text;
        if (!fullText && html) {
            fullText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        // Si hay texto de adjuntos, añadirlo al análisis
        if (attachmentText && attachmentText.length > 50) {
            fullText += '\n\n--- CONTENIDO DE ADJUNTOS ---\n' + attachmentText.substring(0, 10000);
        }

        // Guardar adjuntos en Supabase Storage
        let savedAttachments: any[] = [];
        if (attachmentData && attachmentData.length > 0) {
            for (const att of attachmentData) {
                try {
                    const buffer = Buffer.from(att.data, 'base64');
                    const fileName = `${Date.now()}_${att.filename}`;
                    
                    const uploadRes = await fetch(
                        `${env.SUPABASE_URL}/storage/v1/objects/email-attachments/${fileName}`,
                        {
                            method: 'POST',
                            headers: new Headers({
                                'Content-Type': att.content_type || 'application/octet-stream',
                                'apikey': env.SUPABASE_ANON_KEY || '',
                                'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                                'x-upsert': 'true'
                            }),
                            body: buffer
                        }
                    );
                    
                    if (uploadRes.ok) {
                        savedAttachments.push({
                            filename: att.filename,
                            url: `${env.SUPABASE_URL}/storage/v1/object/public/email-attachments/${fileName}`
                        });
                    }
                } catch (e) {
                    console.error('Error saving attachment:', e);
                }
            }
        }

        if (!fullText || fullText.length < 10) {
            return NextResponse.json(
                { error: 'El contenido del email es obligatorio' },
                { status: 400 }
            );
        }

        const prompt = `
        Analiza este correo electrónico sobre bienes raíces e inversiones.
        Es para un CRM Institucional. Puede tratar de un "Activo" (property), un "Inversor" (investor), un "Mandatario" (mandatario) o un "Colaborador" (collaborator).
        
        Extrae la información relevante.
        Devuelve JSON:
        {
          "type": "property" | "investor" | "mandatario" | "collaborator" | "lead",
          "summary": "Resumen de 1 línea",
          "has_action": true | false,
          "extracted_data": {
             "title": "string",
             "type": "Hotel|Edificio|Suelo|Retail|Oficinas|Logístico|Otro",
             "price": number | null,
             "address": "string",
             "meters": number | null,
             "vendor_name": "string",
             "contact_name": "string",
             "contact_email": "string",
             "contact_phone": "string"
          }
        }
        
        Email:
        ${fullText.substring(0, 8000)}
        `;

        const interpretPrompt = `Eres asistente de CRM inmobiliario. Analiza en español:
        ---
        **De:** ${from}
        **Asunto:** ${subject}
        **Resumen:** [2-3 frases]
        **Acción:** Sí/No + cuál
        **Prioridad:** 🔴 Alta / 🟡 Media / 🟢 Baja
        ---
        ${fullText.substring(0, 3000)}`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        
        const extractionResult = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
            }
        });

        const interpretationResult = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: interpretPrompt }] }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 800
            }
        });

        let extractedData: any = {};
        let aiInterpretation = null;

        try {
            const extractionText = extractionResult.response.text();
            extractedData = JSON.parse(extractionText);
        } catch (e) {
            console.error('Error parsing extraction:', e);
        }

        try {
            aiInterpretation = interpretationResult.response.text();
        } catch (e) {
            console.error('Error parsing interpretation:', e);
        }

        // Extraer email del remitente si es necesario
        let senderEmail = from;
        if (from.includes('<')) {
            senderEmail = from.match(/<(.+)>/)?.[1] || from;
        }

        const insertData = {
            original_email_subject: subject,
            original_email_body: fullText.substring(0, 15000),
            sender_email: senderEmail,
            suggestion_type: extractedData.type || 'lead',
            extracted_data: {
                ...extractedData.extracted_data,
                _source: 'email_direct',
                _iai_summary: extractedData.summary || '',
                _has_action: extractedData.has_action || false,
                attachments_count: Array.isArray(attachments) ? attachments.length : 0,
                attachments: savedAttachments
            },
            ai_interpretation: aiInterpretation,
            status: 'pending'
        };

        const { error: dbError } = await supabaseAdmin
            .from('iai_inbox_suggestions')
            .insert(insertData);

        if (dbError) {
            throw new Error(dbError.message);
        }

        return NextResponse.json({ 
            success: true, 
            type: extractedData.type,
            summary: extractedData.summary,
            message: 'Email procesado y analizado'
        });

    } catch (error: any) {
        console.error('Email webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ 
        status: 'Email webhook ready',
        endpoint: '/api/webhook/email'
    });
}
