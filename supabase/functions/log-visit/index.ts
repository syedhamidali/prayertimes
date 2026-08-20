import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : null);
const str = (v: unknown, max = 500) =>
  typeof v === 'string' && v.length > 0 ? v.slice(0, max) : null;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip') ||
      null;

    // IP-based demographics (best effort)
    let geo: Record<string, unknown> = {};
    if (ip) {
      try {
        const res = await fetch(`https://ipapi.co/${ip}/json/`);
        if (res.ok) geo = await res.json();
      } catch (_) { /* ignore */ }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await supabase.from('visitor_logs').insert({
      ip_address: ip,
      user_agent: str(req.headers.get('user-agent'), 1000),
      referrer: str(body.referrer),
      page_path: str(body.pagePath),
      language: str(body.language, 50),
      screen_width: num(body.screenWidth),
      screen_height: num(body.screenHeight),
      timezone: str(body.timezone, 100),
      country: str(geo.country_name) ?? str(geo.country),
      region: str(geo.region),
      city: str(geo.city),
      postal: str(geo.postal, 50),
      org: str(geo.org),
      latitude: num(body.latitude),
      longitude: num(body.longitude),
      accuracy: num(body.accuracy),
      location_granted: body.latitude != null && body.longitude != null,
    });

    if (error) {
      console.error('insert failed:', error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('log-visit error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
