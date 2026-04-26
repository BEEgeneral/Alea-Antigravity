import { NextResponse } from 'next/server';
import { createServerClient, INSFORGE_APP_URL, INSFORGE_API_KEY } from '@/lib/insforge-server';
import { analyzeWithMinimax } from '@/lib/minimax';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        console.log('Mailtrap webhook received:', {
            subject: body.subject,
            from: body.from,
            attachments: body.attachments?.length || 0
        });

        const fromEmail = body.from?.email || body.sender || body.from_address || 'unknown';
        const subject = body.subject || 'Sin asunto';
        const text = body.text || body.body || body.content || '';
        const html = body.html || '';
        const attachments = body.attachments || [];

        let senderEmail = fromEmail;
        if (typeof fromEmail === 'string' && fromEmail.includes('<')) {
            const match = fromEmail.match(/<(.+)>/);
            if (match) senderEmail = match[1];
        }
        if (typeof senderEmail === 'object' && senderEmail.email) {
            senderEmail = senderEmail.email;
        }

        const client = createServerClient();

        const savedAttachments: Array<{ filename: string; url: string }> = [];

        for (const att of attachments) {
            try {
                if (att.content && typeof att.content === 'string') {
                    const buffer = Buffer.from(att.content, 'base64');
                    const fileName = att.filename || `attachment_${Date.now()}`;

                    const uploadRes = await fetch(
                        `${INSFORGE_APP_URL}/api/storage/buckets/email-attachments/upload-strategy`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${INSFORGE_API_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                filename: fileName,
                                contentType: att.content_type || 'application/octet-stream',
                                size: buffer.length
                            })
                        }
                    );

                    if (uploadRes.ok) {
                        const strategy = await uploadRes.json();
                        const fileNameNew = `${Date.now()}_${fileName}`;

                        if (strategy.method === 'direct') {
                            await fetch(
                                `${INSFORGE_APP_URL}${strategy.uploadUrl}`,
                                {
                                    method: 'PUT',
                                    headers: { 'Content-Type': att.content_type || 'application/octet-stream' },
                                    body: buffer
                                }
                            );
                        }

                        savedAttachments.push({
                            filename: fileName,
                            url: `${INSFORGE_APP_URL}/api/storage/buckets/email-attachments/objects/${fileNameNew}`
                        });
                    }
                }
            } catch (e) {
                
            }
        }

        const analysisPrompt = `Analiza este correo electrónico sobre bienes raíces e inversiones.
Es para un CRM Institucional. Puede tratar de un "Activo" (property), un "Inversor" (investor), un "Mandatario" (mandatario) o un "Colaborador" (collaborator).

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
De: ${senderEmail}
Asunto: ${subject}
${text.substring(0, 5000)}`;

        const interpretPrompt = `Eres asistente de CRM inmobiliario. Analiza en español:
---
**De:** ${senderEmail}
**Asunto:** ${subject}
**Resumen:** [2-3 frases]
**Acción:** Sí/No + cuál
**Prioridad:** 🔴 Alta / 🟡 Media / 🟢 Baja
---
${text.substring(0, 2000)}`;

        const [extractionResult, interpretationResult] = await Promise.all([
            analyzeWithMinimax(analysisPrompt),
            analyzeWithMinimax(interpretPrompt)
        ]);

        const analysis = {
            type: extractionResult.analysis?.type || 'lead',
            summary: extractionResult.analysis?.summary || '',
            has_action: extractionResult.analysis?.has_action || false,
            extracted_data: extractionResult.analysis?.extracted_data || {},
            ai_interpretation: interpretationResult.rawResponse
        };

        await client.database.from('iai_inbox_suggestions').insert({
            original_email_subject: subject,
            original_email_body: text.substring(0, 15000),
            sender_email: senderEmail,
            suggestion_type: analysis.type,
            extracted_data: {
                ...analysis.extracted_data,
                _source: 'email_mailtrap',
                _iai_summary: analysis.summary,
                _has_action: analysis.has_action,
                attachments_count: savedAttachments.length,
                attachments: savedAttachments,
                mailtrap_message_id: body.message_id || null
            },
            ai_interpretation: analysis.ai_interpretation,
            status: 'pending'
        });

        return NextResponse.json({
            success: true,
            message: 'Email processed successfully',
            emailId: body.message_id
        });

    } catch (error: any) {
        
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'Mailtrap Webhook Endpoint',
        method: 'POST',
        description: 'Receives emails forwarded from Mailtrap and processes them with MiniMax AI'
    });
}