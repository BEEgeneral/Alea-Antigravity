import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWpob2lyb3B2eWV2eWt2cWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcwNTA3MywiZXhwIjoyMDg3MjgxMDczfQ.yS9a0r4PUSASs50SOC3Q5H4Z-Q9HfYUHz2vLHwK21es'
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function POST(req: Request) {
    try {
        const { message, context, history } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'El mensaje es obligatorio' }, { status: 400 });
        }

        const systemPrompt = `Eres el asistente de IA de Alea Signature, una plataforma de originación privada inmobiliaria y gestión patrimonial de lujo.

Tu función es ayudar a los agentes a gestionar el CRM mediante conversación. Puedes:
- Consultar y analizar datos de leads, propiedades, inversores, mandatarios
- Crear nuevos registros (leads, propiedades, inversores)
- Clasificar oportunidades en el pipeline
- Resumir conversaciones y tareas
- Dar seguimiento a acciones pendientes

Bases de datos disponibles:
- leads: oportunidades en el CRM
- properties: activos inmobiliarios
- investors: inversores registrados
- mandatarios: representantes legales
- collaborators: colaboradores
- iai_inbox_suggestions: emails analizados pendientes de revisión

Contexto actual del sistema:
${context || 'Sin contexto'}

Responde de forma clara y accionable. Si detectas que el usuario quiere crear o modificar algo, confirma antes de ejecutar y pide los datos necesarios.

Formato de respuesta:
- Usa negrita para énfasis
- Usa listas cuando sea necesario
- Si necesitas ejecutar una acción, explica qué harás y pide confirmación`;

        const chatHistory = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...(history || []).slice(-4).map((h: any) => ({ 
                role: h.role === 'assistant' ? 'model' : 'user', 
                parts: [{ text: h.content }] 
            })),
            { role: 'user', parts: [{ text: message }] }
        ];

        const completionResult = await model.generateContent({
            contents: chatHistory,
            generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
        });

        const response = completionResult.response.text();

        if (!response) {
            throw new Error('No se recibió respuesta de la IA');
        }

        return NextResponse.json({ response });

    } catch (error: any) {
        console.error('Chat AI error:', error);
        return NextResponse.json(
            { error: error.message || 'Error al procesar el mensaje' },
            { status: 500 }
        );
    }
}
