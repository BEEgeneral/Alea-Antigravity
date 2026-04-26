import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createAuthenticatedClient } from '@/lib/insforge-server';

const minimax = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY || '',
  baseURL: 'https://api.minimax.io/v1',
});

export async function POST(req: Request) {
    try {
        const client = await createAuthenticatedClient();
        const { data: { user }, error: authError } = await client.auth.getCurrentUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { location, assetType } = await req.json();

        if (!location || !assetType) {
            return NextResponse.json({ error: 'Faltan datos requeridos (localización o tipo de activo)' }, { status: 400 });
        }

        const prompt = `
        Actúa como un experto en valoración inmobiliaria institucional en España.
        Necesito una estimación realista del precio de mercado por metro cuadrado (Pm/m²) para el siguiente activo:
        
        Ubicación: ${location}
        Tipo de Activo: ${assetType}
        
        Ten en cuenta:
        - El estado actual del mercado inmobiliario en España (2024-2025).
        - Si la ubicación es una 'prime location' (Madrid, Barcelona, Ibiza, etc.), los precios deben reflejarlo.
        - Devuelve valores realistas para activos institucionales (Hoteles, Oficinas Prime, Logística, etc.).

        Devuelve estrictamente un objeto JSON con esta estructura:
        {
          "suggested_pm": number, // El valor recomendado por m2
          "min_pm": number, // Valor mínimo del rango
          "max_pm": number, // Valor máximo del rango
          "confidence": number, // 0.0 a 1.0
          "reasoning": "Breve explicación de 1 línea sobre por qué este precio"
        }
        `;

        const completionResult = await minimax.chat.completions.create({
            model: 'MiniMax-M2.7',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 1000,
        });

        const content = completionResult.choices[0]?.message?.content || '';

        if (!content) {
            throw new Error("No response from AI engine");
        }

        const result = JSON.parse(content);
        return NextResponse.json(result);

    } catch (error: any) {
        
        return NextResponse.json({ error: error.message || 'Error processing valuation' }, { status: 500 });
    }
}
