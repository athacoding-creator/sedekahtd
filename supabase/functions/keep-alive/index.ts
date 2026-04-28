// Keep-alive edge function: ping database ringan agar project Supabase tidak di-pause
// Dijadwalkan via pg_cron setiap 12 jam.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Query ringan ke beberapa tabel agar aktivitas tercatat
    const [c, d, h] = await Promise.all([
      supabase.from("campaigns").select("id", { count: "exact", head: true }),
      supabase.from("donations").select("id", { count: "exact", head: true }),
      supabase.from("heroes").select("id", { count: "exact", head: true }),
    ]);

    const result = {
      ok: true,
      timestamp: new Date().toISOString(),
      campaigns: c.count ?? 0,
      donations: d.count ?? 0,
      heroes: h.count ?? 0,
    };

    console.log("[keep-alive] ping ok", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("[keep-alive] error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
