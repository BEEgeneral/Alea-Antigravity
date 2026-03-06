import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { suggestion_id, email_body, email_subject, sender_email } = await req.json();

        if (!suggestion_id || !email_body) {
            return NextResponse.json(
                { error: 'Faltan parámetros: suggestion_id y email_body son obligatorios' },
                { status: 400 }
            );
        }

        // 1. Check cache — if already interpreted, return immediately
        const { data: existing } = await supabaseAdmin
            .from('iai_inbox_suggestions')
            .select('ai_interpretation')
            .eq('id', suggestion_id)
            .single();

        if (existing?.ai_interpretation) {
            return NextResponse.json({ interpretation: existing.ai_interpretation, cached: true });
        }

        // 2. Call Groq LLM to interpret the email
        const prompt = `Eres un asistente ejecutivo experto en real estate institucional y capital markets.

Analiza la siguiente conversación de email y genera una interpretación clara, profesional y directa en español.

Tu objetivo es que un directivo pueda leer tu interpretación en 15 segundos y entender:
1. **¿Quién escribe y desde qué posición/empresa?**
2. **¿Qué quiere exactamente?** (intención principal)
3. **¿Hay algún activo, inversión u oportunidad concreta mencionada?** Si sí, resúmela.
4. **¿Requiere acción inmediata?** Si sí, cuál.
5. **Nivel de prioridad**: 🔴 Alta / 🟡 Media / 🟢 Baja

Formato de salida (usa exactamente este formato):
---
**Remitente:** [nombre y cargo/empresa si se detecta]  
**Intención:** [1 frase directa]  
**Resumen:** [2-3 frases máximo con los datos clave]  
**Acción requerida:** [Sí/No + qué hacer]  
**Prioridad:** [emoji + nivel]  
---

Email Subject: ${email_subject || 'Sin asunto'}
Sender: ${sender_email || 'Desconocido'}

Contenido del email:
"""
${email_body}
"""`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            max_tokens: 1000,
        });

        const interpretation = completion.choices[0]?.message?.content;

        if (!interpretation) {
            throw new Error('No se recibió respuesta de la IA');
        }

        // 3. Cache the interpretation in Supabase
        const { error: updateError } = await supabaseAdmin
            .from('iai_inbox_suggestions')
            .update({ ai_interpretation: interpretation })
            .eq('id', suggestion_id);

        if (updateError) {
            console.warn('Could not cache interpretation:', updateError);
            // Still return the interpretation even if caching fails
        }

        return NextResponse.json({ interpretation, cached: false });

    } catch (error: any) {
        console.error('Error interpreting email:', error);
        return NextResponse.json(
            { error: error.message || 'Error al interpretar el email' },
            { status: 500 }
        );
    }
}
