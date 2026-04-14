import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/lib/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
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
