import { NextResponse } from 'next/server';
import Imap from 'imap';
import { simpleParser, type ParsedMail } from 'mailparser';
import { createServerClient, INSFORGE_APP_URL, INSFORGE_API_KEY } from '@/lib/insforge-server';
import { env } from '@/lib/env';
import { analyzeImage, analyzeImagesAndText } from '@/lib/minimax';

const IMAP_HOST = env.IMAP_HOST;
const IMAP_USER = env.IMAP_USER;
const IMAP_PASSWORD = env.IMAP_PASSWORD;

interface EmailFilter {
    tipo: 'sender' | 'asunto';
    valor: string;
    accion: 'include' | 'exclude';
}

interface ProcessedEmail {
    from: string;
    subject: string;
    text: string;
    attachments: Array<{
        filename: string;
        contentType: string;
        data: Buffer;
    }>;
}

interface AnalysisResult {
    type: string;
    summary: string;
    has_action: boolean;
    extracted_data: Record<string, any>;
    ai_interpretation: string;
}

async function getFilters(client: Awaited<ReturnType<typeof createServerClient>>): Promise<EmailFilter[]> {
    const { data, error } = await client.database
        .from('email_filters')
        .select('*')
        .eq('activo', true);

    if (error) {
        
        return [];
    }

    return data || [];
}

function shouldExcludeEmail(filters: EmailFilter[], from: string, subject: string): boolean {
    for (const filter of filters) {
        const value = filter.valor.toLowerCase();

        if (filter.tipo === 'sender' && filter.accion === 'exclude') {
            if (from.toLowerCase().includes(value)) {
                return true;
            }
        }

        if (filter.tipo === 'asunto' && filter.accion === 'exclude') {
            if (subject.toLowerCase().includes(value)) {
                return true;
            }
        }
    }
    return false;
}

async function connectToIMAP(): Promise<Imap> {
    return new Promise((resolve, reject) => {
        console.log('Connecting to IMAP:', IMAP_HOST, 'user:', IMAP_USER);
        const imap = new Imap({
            user: IMAP_USER,
            password: IMAP_PASSWORD,
            host: IMAP_HOST,
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        });

        imap.on('ready', () => resolve(imap));
        imap.on('error', (err: Error) => reject(err));

        imap.connect();
    });
}

async function fetchAllEmails(imap: Imap): Promise<ProcessedEmail[]> {
    return new Promise((resolve, reject) => {
        const emails: ProcessedEmail[] = [];

        imap.openBox('INBOX', true, async (err: Error | null) => {
            if (err) {
                reject(err);
                return;
            }

            const fetch = imap.fetch('1:*', {
                bodies: '',
                markSeen: false,
                struct: true
            });

            fetch.on('message', (msg: Imap.ImapMessage) => {
                msg.on('body', async (stream: NodeJS.ReadableStream) => {
                    try {
                        const parsed: ParsedMail = await simpleParser(stream as any);

                        const attachments: ProcessedEmail['attachments'] = [];
                        if (parsed.attachments && parsed.attachments.length > 0) {
                            for (const att of parsed.attachments) {
                                const content = att.content;
                                if (content) {
                                    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
                                    attachments.push({
                                        filename: att.filename || 'attachment',
                                        contentType: att.contentType || 'application/octet-stream',
                                        data: buffer
                                    });
                                }
                            }
                        }

                        const htmlText = parsed.html || '';
                        const textFromHtml = htmlText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                        const emailText = parsed.text || textFromHtml;

                        emails.push({
                            from: (parsed.from?.text || 'unknown').replace(/\s+/g, ' ').trim(),
                            subject: (parsed.subject || 'Sin asunto').replace(/\s+/g, ' ').trim(),
                            text: emailText,
                            attachments
                        });
                    } catch (e) {
                        
                    }
                });
            });

            fetch.on('end', () => resolve(emails));
            fetch.on('error', reject);
        });
    });
}

function extractEmailAddress(fromText: string): string {
    const match = fromText.match(/<(.+)>/);
    return match ? match[1] : fromText;
}

async function analyzeEmailWithAI(
    from: string,
    subject: string,
    text: string,
    attachments: ProcessedEmail['attachments']
): Promise<AnalysisResult> {
    const attachmentInfo = attachments.length > 0
        ? `\n\n--- ADJUNTOS (${attachments.length}) ---\n${attachments.map(a => `- ${a.filename} (${a.contentType})`).join('\n')}`
        : '';

    const extractionPrompt = `Analiza este correo electrónico sobre bienes raíces e inversiones.
Es para un CRM Institucional. Puede tratar de un "Activo" (property), un "Inversor" (investor), un "Mandatario" (mandatario) o un "Colaborador" (collaborator).

Extrae la información relevante.
Devuelve JSON con esta estructura exacta (nada más):
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
De: ${from}
Asunto: ${subject}
${text.substring(0, 5000)}${attachmentInfo}`;

    const interpretPrompt = `Eres asistente de CRM inmobiliario. Analiza en español:
---
**De:** ${from}
**Asunto:** ${subject}
**Resumen:** [2-3 frases]
**Acción:** Sí/No + cuál
**Prioridad:** 🔴 Alta / 🟡 Media / 🟢 Baja
---
${text.substring(0, 2000)}`;

    try {
        const [extractionResult, interpretationResult] = await Promise.all([
            analyzeWithMinimax(extractionPrompt),
            analyzeWithMinimax(interpretPrompt)
        ]);

        const extractedData = {
            type: extractionResult.analysis?.type || 'lead',
            summary: extractionResult.analysis?.summary || '',
            has_action: extractionResult.analysis?.has_action || false,
            extracted_data: extractionResult.analysis?.extracted_data || {}
        };

        return {
            type: extractedData.type,
            summary: extractedData.summary,
            has_action: extractedData.has_action,
            extracted_data: extractedData.extracted_data,
            ai_interpretation: interpretationResult.rawResponse
        };
    } catch (error: any) {
        
        return {
            type: 'lead',
            summary: `Error en análisis: ${error.message}`,
            has_action: false,
            extracted_data: {},
            ai_interpretation: 'Error al procesar con IA'
        };
    }
}

async function analyzeImageAttachment(
    imageBuffer: Buffer,
    filename: string
): Promise<string> {
    try {
        const base64 = imageBuffer.toString('base64');
        const prompt = `Analiza esta imagen de un documento inmobiliario. Extrae toda la información relevante: nombres, direcciones, precios, metros cuadrados, datos de contacto, o cualquier otra información útil para un CRM inmobiliario.`;

        const result = await analyzeImage(base64, prompt);
        return result;
    } catch (error: any) {
        
        return `Error al analizar imagen ${filename}: ${error.message}`;
    }
}

async function analyzeWithMinimax(prompt: string): Promise<{ analysis: any; rawResponse: string }> {
    const { analyzeWithMinimax: analyze } = await import('@/lib/minimax');
    return analyze(prompt);
}

async function saveToInboxSuggestions(
    client: Awaited<ReturnType<typeof createServerClient>>,
    data: {
        from: string;
        subject: string;
        text: string;
        senderEmail: string;
        analysis: AnalysisResult;
        savedAttachments: Array<{ filename: string; url: string }>;
    }
) {
    const { data: insertData, error } = await client.database
        .from('iai_inbox_suggestions')
        .insert({
            original_email_subject: data.subject,
            original_email_body: data.text.substring(0, 15000),
            sender_email: data.senderEmail,
            suggestion_type: data.analysis.type,
            extracted_data: {
                ...data.analysis.extracted_data,
                _source: 'email_imap',
                _iai_summary: data.analysis.summary,
                _has_action: data.analysis.has_action,
                attachments_count: data.savedAttachments.length,
                attachments: data.savedAttachments
            },
            ai_interpretation: data.analysis.ai_interpretation,
            status: 'pending'
        })
        .select()
        .single();

    if (error) {
        
        throw error;
    }

    return insertData;
}

async function uploadAttachment(
    filename: string,
    contentType: string,
    data: Buffer
): Promise<string | null> {
    try {
        const uploadUrl = `${INSFORGE_APP_URL}/api/storage/buckets/email-attachments/upload-strategy`;

        const strategyRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INSFORGE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename,
                contentType,
                size: data.length
            })
        });

        if (!strategyRes.ok) {
            
            return null;
        }

        const strategy = await strategyRes.json();
        const fileName = `${Date.now()}_${filename}`;

        if (strategy.method === 'direct') {
            const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
            const uploadRes = await fetch(
                `${INSFORGE_APP_URL}${strategy.uploadUrl}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': contentType
                    },
                    body: arrayBuffer as BodyInit
                }
            );

            if (uploadRes.ok) {
                return `${INSFORGE_APP_URL}/api/storage/buckets/email-attachments/objects/${fileName}`;
            }
        } else {
            const formData = new FormData();
            for (const [field, value] of Object.entries(strategy.fields)) {
                formData.append(field, value as string);
            }
            const bufferSlice = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            const blob = new Blob([bufferSlice as ArrayBuffer], { type: contentType });
            formData.append('file', blob, filename);

            const uploadRes = await fetch(strategy.uploadUrl, { method: 'POST', body: formData });

            if (uploadRes.ok) {
                return `${INSFORGE_APP_URL}/api/storage/buckets/email-attachments/objects/${fileName}`;
            }
        }
    } catch (error) {
        
    }
    return null;
}

export async function GET() {
    const startTime = Date.now();
    const results = {
        processed: 0,
        saved: 0,
        skipped: 0,
        errors: 0,
        messages: [] as string[]
    };

    try {
        console.log('Starting IMAP polling...');

        const client = createServerClient();

        const filters = await getFilters(client);
        console.log(`Loaded ${filters.length} filters`);

        const imap = await connectToIMAP();
        console.log('Connected to IMAP');

        const emails = await fetchAllEmails(imap);
        console.log(`Fetched ${emails.length} emails from INBOX`);

        imap.end();

        for (const email of emails) {
            try {
                const senderEmail = extractEmailAddress(email.from);

                if (shouldExcludeEmail(filters, senderEmail, email.subject)) {
                    results.skipped++;
                    results.messages.push(`Skipped (filter): ${email.subject}`);
                    continue;
                }

                const savedAttachments: Array<{ filename: string; url: string }> = [];
                for (const att of email.attachments) {
                    const url = await uploadAttachment(att.filename, att.contentType, att.data);
                    if (url) {
                        savedAttachments.push({ filename: att.filename, url });
                    }

                    if (att.contentType.startsWith('image/')) {
                        const imageAnalysis = await analyzeImageAttachment(att.data, att.filename);
                        email.text += `\n\n--- ANÁLISIS DE IMAGEN: ${att.filename} ---\n${imageAnalysis}`;
                    }
                }

                const analysis = await analyzeEmailWithAI(
                    email.from,
                    email.subject,
                    email.text,
                    email.attachments
                );

                await saveToInboxSuggestions(client, {
                    from: email.from,
                    subject: email.subject,
                    text: email.text,
                    senderEmail,
                    analysis,
                    savedAttachments
                });

                results.saved++;
                results.processed++;
                results.messages.push(`Saved: ${email.subject}`);

            } catch (error: any) {
                results.errors++;
                results.processed++;
                results.messages.push(`Error: ${error.message}`);
                
            }
        }

        const duration = Date.now() - startTime;
        console.log(`IMAP polling completed in ${duration}ms. Saved: ${results.saved}, Skipped: ${results.skipped}, Errors: ${results.errors}`);

        return NextResponse.json({
            success: true,
            duration_ms: duration,
            ...results,
            message: `Processed ${results.processed} emails in ${duration}ms`
        });

    } catch (error: any) {
        
        return NextResponse.json({
            success: false,
            error: error.message,
            ...results
        }, { status: 500 });
    }
}

export async function POST() {
    return NextResponse.json({
        status: 'IMAP Polling endpoint',
        method: 'GET to trigger polling',
        description: 'Fetches emails from Banahosting IMAP, analyzes with Gemini AI, and saves to iai_inbox_suggestions'
    });
}