import { NextResponse } from 'next/server';
import { simpleParser, type ParsedMail } from 'mailparser';
import { createServerClient, INSFORGE_APP_URL, INSFORGE_API_KEY } from '@/lib/insforge-server';
import { analyzeImage, analyzeImagesAndText, analyzeWithMinimax } from '@/lib/minimax';

const MAILTRAP_POP3_HOST = process.env.MAILTRAP_POP3_HOST || 'pop3.mailtrap.io';
const MAILTRAP_POP3_PORT = parseInt(process.env.MAILTRAP_POP3_PORT || '9950', 10);
const MAILTRAP_POP3_USER = process.env.MAILTRAP_POP3_USER || '';
const MAILTRAP_POP3_PASSWORD = process.env.MAILTRAP_POP3_PASSWORD || '';

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

function extractEmailAddress(fromText: string): string {
    const match = fromText.match(/<(.+)>/);
    return match ? match[1] : fromText;
}

async function connectToMailtrapPOP3(): Promise<{
    socket: any;
    write: (cmd: string) => Promise<string>;
    quit: () => Promise<void>;
}> {
    const host = MAILTRAP_POP3_HOST;
    const port = MAILTRAP_POP3_PORT;
    const user = MAILTRAP_POP3_USER;
    const password = MAILTRAP_POP3_PASSWORD;

    return new Promise((resolve, reject) => {
        const net = require('net');
        const tls = require('tls');

        const socket = net.createConnection(port, host);

        socket.on('error', reject);

        const write = async (cmd: string): Promise<string> => {
            return new Promise((res, rej) => {
                let data = '';
                socket.once('data', (chunk: Buffer) => {
                    data += chunk.toString();
                    res(data);
                });
                socket.write(cmd + '\r\n');
            });
        };

        const quit = async (): Promise<void> => {
            await write('QUIT');
            socket.end();
        };

        socket.on('connect', async () => {
            try {
                const secureSocket = tls.connect({ socket, rejectUnauthorized: false });

                secureSocket.on('error', reject);

                secureSocket.once('data', (chunk: Buffer) => {
                    const response = chunk.toString();
                    if (response.startsWith('+OK')) {
                        resolve({
                            socket: secureSocket,
                            write: async (cmd: string) => {
                                return new Promise((res, rej) => {
                                    let data = '';
                                    secureSocket.once('data', (c: Buffer) => {
                                        data += c.toString();
                                        res(data);
                                    });
                                    secureSocket.write(cmd + '\r\n');
                                });
                            },
                            quit: async () => {
                                try {
                                    await new Promise<void>((res) => {
                                        secureSocket.once('data', () => res());
                                        secureSocket.write('QUIT\r\n');
                                    });
                                } catch {}
                                secureSocket.end();
                            }
                        });
                    } else {
                        reject(new Error('POP3 connection failed'));
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function fetchEmailsFromMailtrap(): Promise<ProcessedEmail[]> {
    const { write, quit } = await connectToMailtrapPOP3();

    await write(`USER ${MAILTRAP_POP3_USER}`);
    await write(`PASS ${MAILTRAP_POP3_PASSWORD}`);
    const authResponse = await write('STAT');

    if (!authResponse.startsWith('+OK')) {
        throw new Error('POP3 authentication failed');
    }

    const statMatch = authResponse.match(/\+OK (\d+) (\d+)/);
    if (!statMatch || parseInt(statMatch[1]) === 0) {
        await quit();
        return [];
    }

    const emailCount = parseInt(statMatch[1]);
    const emails: ProcessedEmail[] = [];

    for (let i = 1; i <= emailCount; i++) {
        try {
            const listResponse = await write(`LIST ${i}`);
            const sizeMatch = listResponse.match(/\+OK \d+ (\d+)/);
            const emailSize = sizeMatch ? parseInt(sizeMatch[1]) : 0;

            const retrResponse = await write(`RETR ${i}`);

            if (retrResponse.startsWith('+OK')) {
                let emailData = retrResponse.substring(4);
                let remaining = emailSize - emailData.length;

                while (remaining > 0) {
                    const chunk = await new Promise<string>((res) => {
                        const s = (require('net') as any).socket;
                    });
                }

                const parsed = await simpleParser(emailData);

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

                await write(`DELE ${i}`);
            }
        } catch (e) {
            
        }
    }

    await quit();
    return emails;
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
                _source: 'email_mailtrap',
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
        const fileNameNew = `${Date.now()}_${filename}`;

        if (strategy.method === 'direct') {
            const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
            await fetch(
                `${INSFORGE_APP_URL}${strategy.uploadUrl}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': contentType },
                    body: arrayBuffer as BodyInit
                }
            );
        } else {
            const formData = new FormData();
            for (const [field, value] of Object.entries(strategy.fields)) {
                formData.append(field, value as string);
            }
            const bufferSlice = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            const blob = new Blob([bufferSlice as ArrayBuffer], { type: contentType });
            formData.append('file', blob, filename);

            await fetch(strategy.uploadUrl, { method: 'POST', body: formData });
        }

        return `${INSFORGE_APP_URL}/api/storage/buckets/email-attachments/objects/${fileNameNew}`;
    } catch (error) {
        
        return null;
    }
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
        console.log('Starting Mailtrap POP3 polling...');

        const client = createServerClient();

        const emails = await fetchEmailsFromMailtrap();
        console.log(`Fetched ${emails.length} emails from Mailtrap`);

        for (const email of emails) {
            try {
                const senderEmail = extractEmailAddress(email.from);

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
        console.log(`Mailtrap polling completed in ${duration}ms. Saved: ${results.saved}, Errors: ${results.errors}`);

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
        status: 'Mailtrap POP3 Polling endpoint',
        method: 'GET to trigger polling',
        description: 'Fetches emails from Mailtrap POP3, analyzes with MiniMax AI, and saves to iai_inbox_suggestions'
    });
}