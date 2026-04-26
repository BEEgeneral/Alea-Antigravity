/**
 * Simple Pelayo Chat API
 * Works with MiniMax AI
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = 'https://api.minimax.io/v1';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const systemPrompt = `Eres **Pelayo**, el asistente de inteligencia patrimonial de Alea Signature.

REGLAS:
1. Responde SIEMPRE en español
2. Usa markdown para formatear respuestas
3. Sé conciso y útil
4. Puedes preguntar sobre propiedades, inversores, leads, agenda

PIEDRAS PRECIOSAS (clasificación de inversores):
- 💎 ZAFIRO: Sociable, disfruta conversaciones, historias
- 🔮 PERLA: Leal, calmado, ayuda a otros
- 💚 ESMERALDA: Analítico, detallado, datos
- ❤️ RUBÍ: Competitivo, resultados rápidos`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    if (!MINIMAX_API_KEY) {
      return NextResponse.json({
        response: `⚠️ **MiniMax API Key no configurada.**\n\nLa clave API de MiniMax no está configurada en el servidor.\n\nPor favor, contacta al administrador.`
      });
    }

    // Create OpenAI client for MiniMax
    const minimax = new OpenAI({
      apiKey: MINIMAX_API_KEY,
      baseURL: MINIMAX_BASE_URL,
    });

    // Build messages
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message }
    ];

    // Call MiniMax
    const response = await minimax.chat.completions.create({
      model: 'MiniMax-M2.7',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const responseText = response.choices[0]?.message?.content || 'No pude generar respuesta.';

    return NextResponse.json({
      response: responseText,
      success: true
    });

  } catch (error: any) {
    console.error('Pelayo error:', error);
    
    return NextResponse.json({
      response: `❌ Error: ${error.message || 'Error desconocido'}\n\nPor favor, intenta de nuevo.`,
      error: error.message
    }, { status: 500 });
  }
}