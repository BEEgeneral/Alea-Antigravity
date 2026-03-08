import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

serve(async (req) => {
  try {
    const { email, name, origin, data: userData } = await req.json()

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing environment variables" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ✅ Supabase Native Mailer:
    // En lugar de enviar el email de bienvenida manualmente usando Resend,
    // utilizamos auth.admin.inviteUserByEmail para que Supabase lo envíe directamente.
    // El usuario se crea (si no existía) y recibe la plantilla de Invitación editada en Supabase.

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
      data: {
        name: name,
        full_name: name,
        role: userData?.role || 'investor'
      },
      redirectTo: `${origin || 'https://www.aleasignature.com'}/login?confirmed=true`
    })

    if (inviteError) {
      console.error("Error generating invite via Supabase Auth:", inviteError)
      throw inviteError
    }

    return new Response(JSON.stringify({ success: true, message: "Welcome email dispatched by Supabase Auth (Invite)" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }
})
