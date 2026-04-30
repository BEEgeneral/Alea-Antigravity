/**
 * Hermes Chat API Endpoint
 * Powered by MiniMax M2.7 with native function calling + Streaming
 *
 * POST /api/hermes/chat - Send message to Hermes/Pelayo (supports streaming)
 * GET  /api/hermes/chat - Get chat stats
 */

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createAuthenticatedClient, createClientWithToken } from '@/lib/insforge-server';
import OpenAI from 'openai';
import { HermesTools } from '@/lib/hermes-tools';
import { executeToolCall, type ToolExecutorContext } from '@/lib/hermes-tool-executor';
import { getMemoryContext } from '@/lib/memory';

const MINIMAX_BASE_URL = 'https://api.minimax.io/v1';
const MINIMAX_MODEL = 'MiniMax-M2.7';

function stripThinkingTags(text: string): string {
  return text
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '')
    .split('<think>').join('')
    .split('</think>').join('');
}

const HERMES_SYSTEM_PROMPT = `Eres **Pelayo**, el asistente de inteligencia patrimonial de Alea Signature.

PERSONALIDAD:
- Asistente patrimonial extremadamente útil y profesional
- Siempre respondes en español
- Usas markdown para formatear respuestas (tablas, listas, negritas)
- Eres conciso pero completo cuando se trata de datos importantes
- Muestras empatía y entiendes las necesidades de inversores de alto patrimonio

REGLAS DE ORO:
1. CONFIDENCIALIDAD: Nunca reveles ubicación exacta de propiedades off-market. Di "en una zona prime de [ciudad]"
2. NDA: Verifica que el inversor tenga NDA firmado antes de mostrar activos privados
3. NO ELUSIÓN: Prohibido saltar a la empresa (penalización 2x comisión)
4. COMISIÓN: 40% Alea Signature, 60% pool de ejecución

CONTEXTO ALEA SIGNATURE:
- Plataforma de originación privada inmobiliaria de lujo
- Activos: Propiedades de alto patrimonio, invierte desde 500K€ hasta 50M€
- Inversores cualificados con NDA vigente
- Pipeline: Lead → Cualificado → NDA → Blind Listing → Due Diligence → Cierre
- Ubicaciones: Madrid, Barcelona, Ibiza, Marbella, Mallorca
- Estructura comision: 40/60 con distribución por hitos (25% apertura, 50% gestión, 25% cierre)

PIEDRAS PRECIOSAS (Clasificación de inversores):
- 💎 ZAFIRO: Sociable, le gustan las historias, tono casual y cercano
- 🔮 PERLA: Leal, calmado, prefiere ayudar y ser ayudado
- 💚 ESMERALDA: Analítico, necesita datos, proceso estructurado
- ❤️ RUBÍ: Competitivo, quiere resultados, velocidad

SKIN: DETECTIVE DE ACTIVOS
Eres el Detective de Activos de Alea. Cuando detectes que un email, mensaje o documento contiene información sobre una oportunidad de inversión, debes:

1. **Usar la tool detect_asset** para analizar el texto y confirmar si hay un activo potencial
2. **Si se detecta un activo:**
   - Extraer los datos relevantes (precio, ubicación, tipo, metros)
   - **Usar classify_asset** para clasificar el tipo de activo
   - **Usar match_investors_to_asset** para encontrar inversores compatibles
   - **Usar analyze_investment_opportunity** para generar un análisis completo
   - Almacenar en memoria con memory_store (wing_type: property)
3. **Si el usuario pregunta por oportunidades off-market:**
   - **Usar get_off_market_opportunities** con los criterios del inversor
4. **NUNCA revelar ubicaciones exactas** de propiedades off-market sin NDA verificado

SKIN: DIRECTOR DE INBOX
Eres el Director de Inbox de Alea. Cuando proceses emails o te pregunten sobre la bandeja de entrada:

1. **Cuando llegue un email nuevo o te lo compartan:**
   - **Usar process_inbox_email** para analizar y clasificar
   - Si detecta inversor → sugerir crear lead
   - Si detecta inmue™rio → **Usar create_mandatario** para crearlo en CRM
   - Si detecta propiedad → pasarlo al Detective de Activos
2. **Cuando te pregunten por el estado del inbox:**
   - **Usar get_inbox_summary** para obtener estadísticas
3. **Para detectar inmue™rios en textos:**
   - **Usar detect_mandatario** para identificar representantes legales

SKIN: GESTOR DE MANDATOS
Eres el Gestor de Mandatos de Alea. Cuando proceses información sobre mandatos o te pregunten:

1. **Cuando te pregunten por mandatos:**
   - **Usar get_mandates** para listar con filtros por estado/tipo
   - Mostrar días hasta vencimiento y alertas
2. **Para crear un nuevo mandato:**
   - **Usar create_mandate** con datos del inmue™rio y tipo de exclusividad
   - Verificar que no exista ya uno exclusivo para la propiedad
3. **Para actualizar un mandato:**
   - **Usar update_mandate** (renovar, cancelar, cambiar comisión)
4. **Antes de presentar una propiedad:**
   - **Usar check_mandate_exclusivity** para verificar exclusividad
   - Alertar si hay mandato compartido ou abierto
5. **Para ver alertas:**
   - **Usar get_mandate_alerts** para mandatos por vencer, expirados, o sin fecha

SKIN: CLASIFICADOR DE INVERSORES
Eres el Clasificador de Inversores de Alea. Usa el sistema Piedras Preciosas para clasificar inversores:

1. **Para clasificar un inversor:**
   - **Usar classify_investor_behavior** com as observações do comportamento
   - Detectar señales: sociable (ZAFIRO), detail-oriented (ESMERALDA), calm/loyal (PERLA), competitive (RUBI)
   - Guardar la clasificación si save_to_profile=true
2. **Para ver clasificación existente:**
   - **Usar get_investor_piedra** para ver piedra de un inversor
3. **Para saber cómo abordar:**
   - **Usar suggest_investor_approach** según la situación (contacto inicial, follow-up, presentación, cierre)
4. **Para matchear con propiedades:**
   - **Usar match_investor_preferences** para encontrar propiedades que matcheen

**PIEDRAS PRECIOSAS:**
- 💎 ZAFIRO: Sociable, historias, tono casual, visión general
- 🔮 PERLA: Leales, escuchar, personal, apoyar
- 💚 ESMERALDA: Analítico, datos, proceso, profesional
- ❤️ RUBÍ: Competitivo, resultados, velocidad, control

DISCIPLINA:
- Máximo 300 palabras por respuesta
- Si te preguntan por datos específicos, usa las tools para consultar
- Si detectas oportunidad de inversión, sugiere crear acción en agenda`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function getUserContext(client: any, userId: string) {
  const { data: profile } = await client
    .database.from('user_profiles')
    .select('*')
    .eq('auth_user_id', userId)
    .single();

  return profile;
}

async function saveConversation(
  client: any,
  userId: string,
  role: 'user' | 'assistant' | 'tool',
  content: string,
  metadata?: any
) {
  try {
    await client.database.from('pelayo_conversations').insert({
      user_id: userId,
      role,
      content,
      metadata: metadata || null,
    });
  } catch (e) {
    // silently skip conversation save
  }
}

export async function POST(req: NextRequest) {
  try {
    let token = req.cookies.get('insforge_token')?.value;
    const authHeader = req.headers.get('authorization');

    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const client = createClientWithToken(token);
    const { data: authData, error: authError } = await client.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { message, history = [], stream = true } = await req.json();
    const userId = authData.user.id;
    const userEmail = authData.user.email;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        response: '⚠️ **MiniMax API no configurado.** Configura MINIMAX_API_KEY en environment.'
      });
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: MINIMAX_BASE_URL,
    });

    let memoryContext = '';
    try {
      const wingName = `investor_${userEmail?.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const memories = await getMemoryContext(wingName, 5);
      if (memories.length > 0) {
        memoryContext = memories.map(m => `[${m.hall_type}] ${m.content}`).join('\n');
      }
    } catch (e) {
      // no memory context available
    }

    const systemPrompt = memoryContext
      ? `${HERMES_SYSTEM_PROMPT}\n\n## CONTEXTO DE MEMORIA (cosas que sabes del inversor)\n${memoryContext}`
      : HERMES_SYSTEM_PROMPT;

    const context: ToolExecutorContext = {
      userId,
      userEmail,
      token,
    };

    await saveConversation(client, userId, 'user', message);

    if (stream) {
      const encoder = new TextEncoder();

      const streamResponse = new ReadableStream({
        async start(controller) {
          const tools = HermesTools.getDefaultTools();

          const messages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-10).map((h: any) => ({
              role: h.role === 'assistant' ? 'assistant' : 'user',
              content: h.content,
            })),
            { role: 'user', content: message },
          ];

          try {
            let fullContent = '';
            let reasoningContent = '';
            let toolCallsBuffer: any[] = [];

            const streamParams = {
              model: MINIMAX_MODEL,
              messages: messages as any,
              tools: tools.map(t => ({
                type: 'function' as const,
                function: {
                  name: t.name,
                  description: t.description,
                  parameters: t.parameters,
                },
              })),
              max_tokens: 4096,
              temperature: 0.7,
              stream: true as const,
              extra_body: { reasoning_split: true },
            };

            const streamResponse: any = await openai.chat.completions.create(streamParams);
            const stream = streamResponse as AsyncIterable<any>;

            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta;

              if (delta?.content) {
                const cleanContent = stripThinkingTags(delta.content);
                fullContent += cleanContent;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: cleanContent })}\n\n`));
              }

              if ((delta as any)?.reasoning_details?.[0]?.text) {
                const reasoning = (delta as any).reasoning_details[0].text;
                if (reasoning.length > reasoningContent.length) {
                  reasoningContent = reasoning;
                }
              }

              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const existing = toolCallsBuffer.find(t => t.id === tc.id);
                  if (existing) {
                    if (tc.function?.arguments) {
                      existing.function.arguments += tc.function.arguments;
                    }
                  } else {
                    toolCallsBuffer.push({ ...tc });
                  }
                }
              }
            }

            if (toolCallsBuffer.length > 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_calls', tools: toolCallsBuffer })}\n\n`));

              const toolResults = [];
              for (const tc of toolCallsBuffer) {
                const result = await executeToolCall(tc, context);
                toolResults.push(result);

                const resultJson = typeof result.result === 'string'
                  ? result.result
                  : JSON.stringify(result.result);

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_result', toolCallId: tc.id, toolName: tc.function.name, result: resultJson })}\n\n`));
              }

              messages.push({ role: 'assistant', content: fullContent });
              for (let i = 0; i < toolCallsBuffer.length; i++) {
                messages.push({
                  role: 'user' as const,
                  content: JSON.stringify({ tool_result: toolResults[i].result }),
                });
              }

              const finalStreamParams = {
                model: MINIMAX_MODEL,
                messages: messages as any,
                tools: tools.map(t => ({
                  type: 'function' as const,
                  function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters,
                  },
                })),
                max_tokens: 4096,
                temperature: 0.7,
                stream: true as const,
                extra_body: { reasoning_split: true },
              };

              const finalStreamResponse: any = await openai.chat.completions.create(finalStreamParams);
              const finalStream = finalStreamResponse as AsyncIterable<any>;

              for await (const chunk of finalStream) {
                const delta = chunk.choices[0]?.delta;
                if (delta?.content) {
                  const cleanContent = stripThinkingTags(delta.content);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: cleanContent })}\n\n`));
                }
              }
            }

            // reasoning available

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();

          } catch (error: any) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const tools = HermesTools.getDefaultTools();
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((h: any) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await openai.chat.completions.create({
      model: MINIMAX_MODEL,
      messages: messages as any,
      tools: tools.map(t => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
      max_tokens: 4096,
      temperature: 0.7,
      // @ts-ignore - MiniMax specific parameter
      extra_body: { reasoning_split: true },
    });

    const assistantMessage = response.choices[0].message;
    const content = assistantMessage.content || '';
    const toolCalls = assistantMessage.tool_calls || [];

    if (toolCalls.length > 0) {
      const toolResults = [];
      for (const tc of toolCalls as any[]) {
        const result = await executeToolCall(tc, context);
        toolResults.push(result);
      }

      messages.push({ role: 'assistant', content });
      for (const tr of toolResults) {
        messages.push({
          role: 'user' as const,
          content: typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result),
        });
      }

      const finalResponse = await openai.chat.completions.create({
        model: MINIMAX_MODEL,
        messages: messages as any,
        max_tokens: 4096,
        temperature: 0.7,
      });

      const finalContent = finalResponse.choices[0].message.content || '';
      await saveConversation(client, userId, 'assistant', finalContent, { toolCalls: toolCalls.map((t: any) => t.function?.name) });

      return NextResponse.json({
        response: finalContent,
        toolCalls: toolCalls.map((t: any) => ({ name: t.function?.name, arguments: t.function?.arguments })),
      });
    }

    await saveConversation(client, userId, 'assistant', content);

    return NextResponse.json({
      response: content,
      toolCalls: [],
    });

  } catch (error: any) {
    return NextResponse.json({
      response: `❌ Error: ${error.message || 'Error desconocido'}`,
      error: error.message,
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    let token = req.cookies.get('insforge_token')?.value;
    const authHeader = req.headers.get('authorization');

    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const client = createClientWithToken(token);
    const { data: authData } = await client.auth.getCurrentUser();

    if (!authData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const apiKey = process.env.MINIMAX_API_KEY;

    return NextResponse.json({
      status: 'Hermes v2.0',
      model: MINIMAX_MODEL,
      provider: 'minimax',
      configured: !!apiKey,
      streaming: true,
      endpoints: {
        chat: '/api/hermes/chat',
        memory: '/api/hermes/memory',
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
