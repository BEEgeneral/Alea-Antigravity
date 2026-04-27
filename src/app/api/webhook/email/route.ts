// GEMINI ONLY - NO GROQ - Updated 2026-03-27
import { NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge-admin';
import { env } from '@/lib/env';
import { analyzeWithMinimax } from '@/lib/minimax';
import { INSFORGE_API_KEY } from '@/lib/insforge-constants';

export async function POST(req: Request) {
    try {
        // CRITICAL: Webhook secret is MANDATORY
        if (!env.WEBHOOK_SECRET) {
            
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

        // Guardar adjuntos en InsForge Storage
        let savedAttachments: any[] = [];
        if (attachmentData && attachmentData.length > 0) {
            for (const att of attachmentData) {
                try {
                    const buffer = Buffer.from(att.data, 'base64');
                    const fileName = `${Date.now()}_${att.filename}`;
                    
                    // Get upload strategy
                    const strategyRes = await fetch(
                        'https://if8rkq6j.eu-central.insforge.app/api/storage/buckets/email-attachments/upload-strategy',
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${INSFORGE_API_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                filename: att.filename,
                                contentType: att.content_type || 'application/octet-stream',
                                size: buffer.length
                            })
                        }
                    );
                    
                    if (!strategyRes.ok) continue;
                    
                    const strategy = await strategyRes.json();
                    
                    if (strategy.method === 'direct') {
                        // Direct upload to InsForge
                        const formData = new FormData();
                        formData.append('file', new Blob([buffer], { type: att.content_type || 'application/octet-stream' }), att.filename);
                        
                        const uploadRes = await fetch(
                            `https://if8rkq6j.eu-central.insforge.app${strategy.uploadUrl}`,
                            { method: 'PUT', body: formData }
                        );
                        
                        if (uploadRes.ok) {
                            savedAttachments.push({
                                filename: att.filename,
                                url: `https://if8rkq6j.eu-central.insforge.app/api/storage/buckets/email-attachments/objects/${fileName}`
                            });
                        }
                    } else {
                        // S3 presigned URL upload
                        const formData = new FormData();
                        for (const [field, value] of Object.entries(strategy.fields)) {
                            formData.append(field, value as string);
                        }
                        formData.append('file', new Blob([buffer], { type: att.content_type || 'application/octet-stream' }), att.filename);
                        
                        const uploadRes = await fetch(strategy.uploadUrl, { method: 'POST', body: formData });
                        
                        if (uploadRes.ok && strategy.confirmRequired) {
                            await fetch(
                                `https://if8rkq6j.eu-central.insforge.app${strategy.confirmUrl}`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${INSFORGE_API_KEY}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ size: buffer.length, contentType: att.content_type })
                                }
                            );
                        }
                        
                        savedAttachments.push({
                            filename: att.filename,
                            url: `https://if8rkq6j.eu-central.insforge.app/api/storage/buckets/email-attachments/objects/${fileName}`
                        });
                    }
                } catch (e) {
                    
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

        // Usar MiniMax para análisis
        const { analysis: extractionData, rawResponse: extractionRaw } = await analyzeWithMinimax(
            prompt,
            undefined
        );

        const { analysis: interpretationData, rawResponse: interpretationRaw } = await analyzeWithMinimax(
            interpretPrompt,
            'Eres un asistente de CRM inmobiliario. Responde de forma clara y estructurada.'
        );

        let extractedData: any = {};
        let aiInterpretation: string | null = null;

        try {
            if (typeof extractionData === 'object' && extractionData !== null) {
                extractedData = extractionData;
            } else {
                extractedData = JSON.parse(extractionRaw);
            }
        } catch (e) {
            
        }

        try {
            if (typeof interpretationData === 'object' && interpretationData !== null) {
                aiInterpretation = JSON.stringify(interpretationData, null, 2);
            } else {
                aiInterpretation = interpretationRaw;
            }
        } catch (e) {
            
        }

        // Extraer email del remitente si es necesario
        let senderEmail = from;
        if (from.includes('<')) {
            senderEmail = from.match(/<(.+)>/)?.[1] || from;
        }

        // DEDUPLICACIÓN: Verificar si ya existe email similar en las últimas 24h
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: existingEmails } = await insforgeAdmin
            .database
            .from('iai_inbox_suggestions')
            .select('id, original_email_subject, sender_email, created_at')
            .eq('sender_email', senderEmail)
            .gte('created_at', twentyFourHoursAgo)
            .limit(5);

        let isDuplicate = false;
        if (existingEmails && existingEmails.length > 0) {
            // Verificar si hay coincidencia en subject (ignorando mayúsculas/minúsculas y espacios)
            const normalizedSubject = subject.toLowerCase().replace(/\s+/g, ' ').trim();
            for (const existing of existingEmails) {
                const existingNormalized = existing.original_email_subject?.toLowerCase().replace(/\s+/g, ' ').trim() || '';
                if (normalizedSubject === existingNormalized || normalizedSubject.includes(existingNormalized) || existingNormalized.includes(normalizedSubject)) {
                    isDuplicate = true;
                    break;
                }
            }
        }

        if (isDuplicate) {
            return NextResponse.json({
                success: true,
                duplicate: true,
                message: 'Email duplicado - ya existe en bandeja de entrada'
            });
        }

        // Verificar también por hash del contenido (primeros 500 caracteres)
        const contentHash = fullText.substring(0, 500).replace(/\s+/g, ' ').trim();
        const { data: similarEmails } = await insforgeAdmin
            .database
            .from('iai_inbox_suggestions')
            .select('id')
            .like('original_email_body', `%${contentHash.substring(0, 100)}%`)
            .gte('created_at', twentyFourHoursAgo)
            .limit(1);

        if (similarEmails && similarEmails.length > 0) {
            return NextResponse.json({
                success: true,
                duplicate: true,
                message: 'Email duplicado - contenido similar ya existe'
            });
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

        const { error: dbError } = await insforgeAdmin
            .database
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
        
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ 
        status: 'Email webhook ready',
        endpoint: '/api/webhook/email'
    });
}
