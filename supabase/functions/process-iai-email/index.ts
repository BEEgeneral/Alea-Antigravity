import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GROQ_API_KEY) {
            console.error("Missing environment variables")
            return new Response(JSON.stringify({ error: "Missing environment variables" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        const body = await req.json()

        // This attempts to parse standard inbound parse webhooks (like Resend)
        const from = body.from || body.sender || 'unknown'
        const subject = body.subject || 'No Subject'
        const text = body.text || body.html || body.content || ''

        if (!text || text.length < 10) {
            return new Response(JSON.stringify({ error: "No email content provided" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        const prompt = `
        Analiza este correo electrónico reenviado sobre bienes raíces e inversiones.
        Es para un CRM Institucional. El correo puede tratar de un "Activo" (property), un "Inversor" (investor), un "Mandatario" (mandatario) o un "Colaborador" (collaborator).
        
        Extrae la información relevante al rol u objeto detectado.
        Devuelve estrictamente un objeto JSON con esta estructura (nada más):
        {
          "type": "property" | "investor" | "mandatario" | "collaborator",
          "summary": "Resumen muy breve de 1 línea de lo que intenta transmitir el correo",
          "extracted_data": {
            // Dependiendo del tipo, incluye lo máximo que puedas extraer de esta lista.
             // Si property: title (string), type (Hotel, Edificio, Suelo, Retail, Oficinas, Logístico, Otro), price (number, si lo hay o null), location (string), surface (number, metros cuadrados), vendor_name (string o null), summary (string corto)
             // Si investor: full_name (string), company_name (string), ticket (string ej "10M - 20M"), type (HNWI, Family Office, Institutional, Private Equity), email (string), phone (string), labels (array de strings como UHNW, Core Plus, Value Add, etc.)
             // Si mandatario o collaborator: full_name, company_name, email, phone, type, labels
          }
        }
        
        Texto del correo:
        ${text}
        `

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.1
            })
        })

        if (!response.ok) {
            const errorData = await response.text()
            console.error("Groq API Error:", errorData)
            throw new Error(`Detalle de Groq: ${errorData}`)
        }

        const aiResult = await response.json()
        const content = JSON.parse(aiResult.choices[0].message.content)

        const { data, error } = await supabase
            .from('iai_inbox_suggestions')
            .insert({
                original_email_subject: subject,
                original_email_body: text,
                sender_email: from,
                suggestion_type: content.type || 'property',
                extracted_data: content.extracted_data || {},
                status: 'pending'
            })
            .select()
            .single()

        if (error) {
            console.error("Supabase Insert Error:", error)
            throw error
        }

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (err: any) {
        console.error("Edge Function Error:", err)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
