import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

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

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile", // Or whatever model you prefer
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            throw new Error("No response from Groq");
        }

        const result = JSON.parse(content);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Error parsing PDF via Groq:", error);
        return NextResponse.json({ error: error.message || 'Error processing request' }, { status: 500 });
    }
}
