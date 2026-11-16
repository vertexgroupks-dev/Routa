// Public REST API for merchants (online shops). Auth: "Authorization: Bearer rk_live_..." (create the key in the merchant portal).
//   POST /merchant-api/orders                 create one order (or an array of up to 200)
//   GET  /merchant-api/orders?status=&limit=  list your latest orders
//   GET  /merchant-api/orders/{code}          one order with its timeline
//   POST /merchant-api/orders/{code}/cancel   cancel while it is still "confirmed"
import { createClient } from 'npm:@supabase/supabase-js@2.49.8';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const SITE = Deno.env.get('SITE_URL') ?? 'https://routalogistics.netlify.app';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-api-key, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

async function sha256(s: string) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const shape = (o: any) => ({
  code: o.code, tracking_code: o.tracking_code, tracking_url: `${SITE}/t/${o.tracking_code}`, ref: o.merchant_ref, status: o.status,
  customer_name: o.customer_name, customer_phone: o.customer_phone, address: o.address_line, city: o.city, delivery_date: o.delivery_date,
  cod_amount: o.cod_amount, fees: { delivery: o.delivery_fee, weight: o.weight_fee, cod: o.cod_fee }, needs_pin: o.needs_pin,
  delivered_at: o.delivered_at, created_at: o.created_at
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const key = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '') || req.headers.get('x-api-key') || '';
  if (!key.startsWith('rk_')) return json({ error: 'Missing API key' }, 401);
  const { data: k } = await db.from('api_keys').select('id, org_id, merchant_id, revoked_at').eq('key_hash', await sha256(key)).maybeSingle();
  if (!k || k.revoked_at) return json({ error: 'Invalid or revoked API key' }, 401);
  await db.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', k.id);

  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const i = parts.indexOf('orders');
  if (i < 0) return json({ error: 'Not found. Use /orders' }, 404);
  const code = parts[i + 1] ? decodeURIComponent(parts[i + 1]) : null;
  const action = parts[i + 2] ?? null;

  if (req.method === 'POST' && !code) {
    let body: any;
    try { body = await req.json(); } catch { return json({ error: 'Body must be JSON' }, 400); }
    const list = Array.isArray(body) ? body : [body];
    if (list.length === 0 || list.length > 200) return json({ error: 'Send 1–200 orders' }, 400);
    const rows: any[] = [], errors: any[] = [];
    list.forEach((o, n) => {
      const phone = String(o.customer_phone ?? o.phone ?? '').replace(/\s/g, '');
      const name = String(o.customer_name ?? o.name ?? '').trim();
      const address = String(o.address ?? o.address_line ?? '').trim();
      if (!name || !address || !/^\+?\d{8,15}$/.test(phone)) { errors.push({ index: n, error: 'customer_name, customer_phone and address are required' }); return; }
      const lat = Number(o.lat), lng = Number(o.lng);
      rows.push({
        org_id: k.org_id, merchant_id: k.merchant_id, source: 'api', customer_name: name, customer_phone: phone,
        customer_email: o.customer_email ?? null, address_line: address, address_raw: [address, o.city].filter(Boolean).join(', '),
        city: o.city ?? null, landmark: o.landmark ?? null, cod_amount: Number(o.cod_amount ?? 0) || 0, weight_kg: Number(o.weight_kg) || null,
        parcels: Number(o.parcels) || 1, merchant_ref: o.ref ?? o.merchant_ref ?? null, notes_driver: o.notes ?? null,
        location: Number.isFinite(lat) && Number.isFinite(lng) && o.lat != null ? `SRID=4326;POINT(${lng} ${lat})` : null,
        geocode_confidence: o.lat != null ? 1 : null
      });
    });
    if (errors.length && !rows.length) return json({ errors }, 422);
    const { data, error } = await db.from('orders').insert(rows).select('*');
    if (error) return json({ error: error.message }, 400);
    const out = (data ?? []).map(shape);
    return json(Array.isArray(body) ? { created: out, errors } : out[0], 201);
  }

  if (req.method === 'GET' && !code) {
    const url = new URL(req.url);
    let q = db.from('orders').select('*').eq('merchant_id', k.merchant_id).order('created_at', { ascending: false }).limit(Math.min(Number(url.searchParams.get('limit')) || 50, 200));
    if (url.searchParams.get('status')) q = q.eq('status', url.searchParams.get('status')!);
    const { data, error } = await q;
    return error ? json({ error: error.message }, 400) : json({ orders: (data ?? []).map(shape) });
  }

  if (!code || !/^[A-Za-z0-9#_-]{3,40}$/.test(code)) return json({ error: 'Invalid order code' }, 400);
  const { data: o } = await db.from('orders').select('*').eq('merchant_id', k.merchant_id).or(`code.eq.${code},merchant_ref.eq.${code},tracking_code.eq.${code}`).limit(1).maybeSingle();
  if (!o) return json({ error: 'Order not found' }, 404);

  if (req.method === 'GET') {
    const { data: ev } = await db.from('order_events').select('to_status, note, created_at').eq('order_id', o.id).eq('internal', false).order('created_at');
    return json({ ...shape(o), timeline: (ev ?? []).filter((e) => e.to_status).map((e) => ({ status: e.to_status, at: e.created_at })) });
  }
  if (req.method === 'POST' && action === 'cancel') {
    const { error } = await db.rpc('api_cancel_order', { p_merchant: k.merchant_id, p_order: o.id });
    return error ? json({ error: error.message }, 409) : json({ code: o.code, status: 'cancelled' });
  }
  return json({ error: 'Not found' }, 404);
});
