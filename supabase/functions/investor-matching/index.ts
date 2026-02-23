// Setup: supabase functions new investor-matching
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
// Usamos Service Role Key para saltarnos RLS durante el matching interno.
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const payload = await req.json();

    // Comprobamos si es un Insert sobre Properties
    if (payload.type === "INSERT" && payload.table === "properties") {
      const property = payload.record;

      // Logica de Matching: Buscar inversores que cuadren con la ubicación y tipo.
      // 1. Buscamos inversores donde property.location haga match parcial en su array,
      //    y property.asset_type esté en target_asset_types.
      // 2. Comprobamos ticket size.
      
      const { data: matchedInvestors, error } = await supabase
        .from("investors")
        .select("id, full_name, company_name")
        .contains("target_locations", [property.location])
        .contains("target_asset_types", [property.asset_type])
        .gte("max_ticket_eur", property.price_eur)
        .lte("min_ticket_eur", property.price_eur);

      if (error) throw error;

      if (!matchedInvestors || matchedInvestors.length === 0) {
        return new Response(JSON.stringify({ message: "No matches found" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Si hay matches, se podria:
      // a) Insertar en una tabla de notificaciones o crear un pipeline status 'prospect'.
      // b) Enviar email al Admin (via Resend/SendGrid)
      // En este flujo, simplemente los metemos en leads_pipeline automaticamente como 'prospect'.

      const pipelineInserts = matchedInvestors.map(inv => ({
        property_id: property.id,
        investor_id: inv.id,
        status: 'prospect',
        notes: 'Auto-matched due to criteria.'
      }));

      const { error: insertError } = await supabase
        .from('leads_pipeline')
        .upsert(pipelineInserts, { onConflict: 'property_id, investor_id' });

      if (insertError) throw insertError;

      return new Response(JSON.stringify({
        message: `Successfully matched ${matchedInvestors.length} investors for property ${property.title}.`
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Ignored event." }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
