import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { insforgeAdmin } from '@/lib/insforge-admin';
import { env } from '@/lib/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function POST(req: Request) {
    try {
        const { from, subject, text } = await req.json();

        if (!text || text.length < 10) {
            return NextResponse.json(
                { error: 'El contenido del email es obligatorio' },
                { status: 400 }
            );
        }

        const prompt = `
        Analiza este correo electrónico reenviado sobre bienes raíces e inversiones.
        Es para un CRM Institucional. El correo puede tratar de un "Activo" (property), un "Inversor" (investor), un "Mandatario" (mandatario) o un "Colaborador" (collaborator).
        
        Extrae la información relevante al rol u objeto detectado.
        Devuelve estrictamente un objeto JSON con esta estructura (nada más):
        {
          "type": "property" | "investor" | "mandatario" | "collaborator",
          "summary": "Resumen muy breve de 1 línea de lo que intenta transmitir el correo",
          "has_dossier": true | false,
          "extracted_data": {
             "title": "string",
             "type": "Hotel, Edificio, Suelo, Retail, Oficinas, Logístico, Otro",
             "price": number,
             "address": "string",
             "meters": number,
             "vendor_name": "string",
             "comision_tercero": number,
             "comision_interna": number,
             "extended_data": {
                "economics": { "gastos": "string", "ibi": "string", "tasas": "string", "estado_gestion": "string" },
                "surfaces": { "parcela": "number", "construida": "number", "distribucion": "string", "equipamiento": "string" },
                "urbanistic": { "uso_principal": "string", "edificabilidad": "string", "normativa": "string" },
                "investment": { "rentabilidad": "string", "capex": "string", "valoracion": "string" }
             }
          }
        }
        
        Texto del correo:
        ${text}
        `;

        const interpretPrompt = `Eres un asistente ejecutivo experto en real estate institucional y capital markets.

Analiza la siguiente conversación de email y genera una interpretación clara, profesional y directa en español.

Tu objetivo es que un directivo pueda leer tu interpretación en 15 segundos y entender:
1. ¿Quién escribe y desde qué posición/empresa?
2. ¿Qué quiere exactamente? (intención principal)
3. ¿Hay algún activo, inversión u oportunidad concreta mencionada? Si sí, resúmela.
4. ¿Requiere acción inmediata? Si sí, cuál.
5. Nivel de prioridad: 🔴 Alta / 🟡 Media / 🟢 Baja

Formato de salida (usa exactamente este formato):
---
**Remitente:** [nombre y cargo/empresa si se detecta]  
**Intención:** [1 frase directa]  
**Resumen:** [2-3 frases máximo con los datos clave]  
**Acción requerida:** [Sí/No + qué hacer]  
**Prioridad:** [emoji + nivel]  
---

Email Subject: ${subject}
Sender: ${from}

Contenido del email:
"""
${text}
"""`;

        const [extractionResult, interpretationResult] = await Promise.all([
            model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
            }),
            model.generateContent({
                contents: [{ role: 'user', parts: [{ text: interpretPrompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
            })
        ]);

        let extractedData: any = {};
        let aiInterpretation = null;

        try {
            extractedData = JSON.parse(extractionResult.response.text());
        } catch (e) {
            console.error('Error parsing extraction:', e);
        }

        try {
            aiInterpretation = interpretationResult.response.text();
        } catch (e) {
            console.error('Error parsing interpretation:', e);
        }

        const { data, error } = await insforgeAdmin
            .database
            .from('iai_inbox_suggestions')
            .insert({
                original_email_subject: subject,
                original_email_body: text,
                sender_email: from,
                suggestion_type: extractedData.type || 'property',
                extracted_data: {
                    ...extractedData.extracted_data,
                    _iai_has_dossier: extractedData.has_dossier ?? false,
                    _iai_summary: extractedData.summary || ''
                },
                ai_interpretation: aiInterpretation,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data, has_dossier: extractedData.has_dossier });

    } catch (error: any) {
        console.error('Error processing email:', error);
        return NextResponse.json(
            { error: error.message || 'Error al procesar el email' },
            { status: 500 }
        );
    }
}
