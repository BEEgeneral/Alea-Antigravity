import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")

serve(async (req) => {
    try {
        const { email, name } = await req.json()

        if (!RESEND_API_KEY) {
            return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            })
        }

        // El enlace mágico se genera usando la API de Auth de Supabase
        // En un entorno real, esto se dispararía desde la UI de Admin (Praetorium)
        // llamando a esta función una vez el agente pulsa "Aprobar"
        const magicLink = `${SUPABASE_URL}/auth/v1/verify?type=magiclink&email=${encodeURIComponent(email)}`

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "AleaSignature <radar@aleasignature.com>",
                to: [email],
                subject: "Acceso Concedido: Radar de Activos AleaSignature",
                html: `
          <div style="font-family: serif; max-width: 600px; margin: auto; padding: 40px; color: #1a1a1a; background-color: #ffffff; border: 1px solid #f0f0f0;">
            <div style="text-align: center; margin-bottom: 40px;">
                <span style="font-size: 24px; letter-spacing: 4px; font-weight: bold; text-transform: uppercase;">Aleasignature.</span>
            </div>
            
            <h2 style="font-weight: normal; margin-bottom: 24px; text-align: center;">Credenciales de Acceso</h2>
            
            <p style="line-height: 1.6; margin-bottom: 24px;">
                Estimado/a ${name},<br/><br/>
                Nos complace informarle que su perfil ha superado satisfactoriamente los protocolos de **calificación institucional**. 
            </p>
            
            <div style="background-color: #f9f9f9; padding: 32px; border-radius: 8px; margin-bottom: 32px; text-align: center; border: 1px solid #eee;">
                <p style="font-size: 14px; color: #666; margin-bottom: 16px; text-transform: uppercase; tracking: 1px;">Enlace de acceso único y cifrado</p>
                <a href="${magicLink}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 18px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; letter-spacing: 1px; font-size: 14px;">ACCEDER AL RADAR DE ACTIVOS</a>
                <p style="font-size: 11px; color: #999; margin-top: 16px;">Este enlace expirará en 24 horas por motivos de seguridad fiduciaria.</p>
            </div>
            
            <p style="line-height: 1.6; margin-bottom: 16px;">
                A partir de este momento, tiene acceso restringido al **Radar de Originación Privada**, donde podrá analizar activos bajo mandato confidencial y contactar con agentes especializados para la recepción de Data Rooms completas.
            </p>
            
            <p style="line-height: 1.6; font-style: italic; color: #444; margin-bottom: 32px;">
                "La discreción es la piedra angular de nuestra operativa."
            </p>

            <div style="border-top: 1px solid #eee; margin-top: 40px; padding-top: 24px;">
              <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="width: 100px; vertical-align: top; border-right: 1px solid #dbdbdb; padding-right: 20px;">
                    <img src="https://kfmjhoiropvyevykvqey.supabase.co/storage/v1/object/public/public_assets/alea-logo-gold.png" alt="AS" width="80" style="display: block;"/>
                  </td>
                  <td style="padding-left: 20px; vertical-align: top;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1a1a1a;">Radar Agent</p>
                    <p style="margin: 4px 0 16px 0; font-size: 14px; font-style: italic; color: #666;">Alea Operations</p>
                    
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <span style="font-size: 14px; color: #1a1a1a; text-decoration: none;">✉️ radar@aleasignature.com</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-size: 14px; color: #1a1a1a; text-decoration: none;">🌐 aleasignature.com</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        `,
            }),
        })

        const data = await res.json()

        return new Response(JSON.stringify(data), {
            status: res.status,
            headers: { "Content-Type": "application/json" },
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        })
    }
})
