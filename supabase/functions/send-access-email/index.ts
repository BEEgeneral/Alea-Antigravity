import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

serve(async (req) => {
  try {
    const { email, name, origin } = await req.json()

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
    // En lugar de enviar un email manualmente con Resend (que falla por falta de DNS verificados),
    // disparamos el Magic Link nativo de Supabase Auth.
    // Supabase se encargará de enviarlo desde su propio servidor seguro.
    const redirectUrl = `${origin || 'https://aleasignature.com'}/auth/callback?next=/praetorium`

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectUrl
      }
    })

    if (linkError) {
      console.error("Error generating magic link via OTP:", linkError)
      throw linkError
    }

    return new Response(JSON.stringify({ success: true, message: "Magic link dispatched by Supabase Auth" }), {
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
