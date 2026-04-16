import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { analyzeWithMinimax } from '@/lib/minimax';

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Falta el texto del PDF' }, { status: 400 });
        }

        const prompt = `
        Analiza este texto extraído de un documento PDF (posiblemente un dossier o presentación de oportunidad inmobiliaria/inversión).
        Es para un CRM Institucional.

        Extrae la información relevante al activo o negocio detectado.
        Devuelve estrictamente un objeto JSON con esta estructura (nada más):
        {
          "extracted_data": {
             "title": "string",
             "type": "Hotel, Edificio, Suelo, Retail, Oficinas, Logístico, Otro",
             "price": 0, // number, si lo hay o null
             "location": "string",
             "surface": 0, // number, metros cuadrados, o null
             "vendor_name": "string o null",
             "comision_tercero": 0, // number o null
             "comision_interna": 0, // number o null
             "summary": "Resumen muy breve de 1 línea del activo",
             "extended_data": {
                "economics": { "gastos": "string", "ibi": "string", "tasas": "string", "estado_gestion": "string" },
                "surfaces": { "parcela": "number", "construida": "number", "distribucion": "string", "equipamiento": "string" },
                "urbanistic": { "uso_principal": "string", "edificabilidad": "string", "normativa": "string" },
                "investment": { "rentabilidad": "string", "capex": "string", "valoracion": "string" }
             }
          }
        }

        Texto del documento:
        """
        ${text}
        """
        `;

        const { analysis, rawResponse } = await analyzeWithMinimax(prompt, 'Eres un analizador de documentos inmobiliarios. Responde en JSON estricto.');

        if (!rawResponse) {
            throw new Error("No response from MiniMax");
        }

        let result;
        try {
            result = typeof analysis === 'object' && analysis !== null ? analysis : JSON.parse(rawResponse);
        } catch {
            result = JSON.parse(rawResponse);
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Error parsing PDF via Gemini:", error);
        return NextResponse.json({ error: error.message || 'Error processing request' }, { status: 500 });
    }
}
