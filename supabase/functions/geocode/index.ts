// Finds an address on the map. Remembered addresses (same customer phone / same address) come first,
// then OpenStreetMap. With order_id it also saves the point on the order when the match is good.
import { createClient } from 'npm:@supabase/supabase-js@2.49.8';
import { geocodeAddress, nominatim } from './geo.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('authorization') ?? '' } }, auth: { persistSession: false }
  });
  const b = await req.json().catch(() => ({}));
  const { org_id, order_id } = b;
  let { address_line, city, landmark, phone, query } = b;
  if (!org_id) return json({ error: 'org_id is required' }, 400);

  // Staff only (the database answers null for anyone else)
  const { data: hub } = await sb.rpc('hub_point', { p_org: org_id });
  if (!hub?.lat) return json({ error: 'Not allowed' }, 403);

  if (order_id) {
    const { data: o } = await sb.from('orders').select('address_line, city, landmark, customer_phone').eq('id', order_id).eq('org_id', org_id).maybeSingle();
    if (!o) return json({ error: 'Order not found' }, 404);
    address_line ??= o.address_line; city ??= o.city; landmark ??= o.landmark; phone ??= o.customer_phone;
  }

  // Free-text search box on the map: return several options
  if (query) {
    const hits = await nominatim(String(query).slice(0, 200), hub);
    return json({ results: hits.slice(0, 5) });
  }

  let hit: any = null, source = 'map';
  const { data: cached } = await sb.rpc('find_cached_address', { p_org: org_id, p_address: [address_line, city].filter(Boolean).join(' '), p_phone: phone ?? null });
  if (cached?.lat) { hit = { lat: cached.lat, lng: cached.lng, confidence: Number(cached.confidence ?? 0.9), label: 'Remembered from an earlier order', kind: 'remembered' }; source = 'remembered'; }
  else hit = await geocodeAddress({ address_line, city, landmark }, hub);

  if (!hit) return json({ found: false });
  let saved = null;
  if (order_id && hit.confidence >= 0.6) {
    const { data, error } = await sb.rpc('set_order_pin', { p_order: order_id, p_lat: hit.lat, p_lng: hit.lng, p_confidence: hit.confidence, p_remember: source !== 'remembered' });
    if (!error) saved = data;
  }
  return json({ found: true, source, ...hit, precise: hit.confidence >= 0.6, saved });
});
