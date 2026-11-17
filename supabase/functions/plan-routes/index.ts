// Plans all routes for one day automatically.
// Reads the day's open orders, free drivers and vehicles (database checks the caller is a dispatcher),
// puts orders without a map point on the map, gets road distances, runs the optimiser and saves the
// result as DRAFT routes the dispatcher can review and publish.
import { createClient } from 'npm:@supabase/supabase-js@2.49.8';
import { geocodeAddress, travelMatrix, routeShape, type LatLng } from './geo.ts';
import { solve, type Job, type Unit } from './solver.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });
const MAX_LOOKUPS = 12; // address lookups per run (the free map service allows ~1 per second)

// "2026-11-18" + "08:00" in Europe/Belgrade -> exact Date
function localTime(date: string, hhmm: string, tz: string): Date {
  const guess = new Date(`${date}T${hhmm}:00Z`);
  const off = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(guess).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+01:00';
  const m = off.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  const mins = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 60;
  return new Date(guess.getTime() - mins * 60000);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('authorization') ?? '' } }, auth: { persistSession: false }
  });
  const { org_id, date } = await req.json().catch(() => ({}));
  if (!org_id || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return json({ error: 'org_id and date are required' }, 400);

  const { data: d, error } = await sb.rpc('planning_data', { p_org: org_id, p_date: date });
  if (error) return json({ error: error.message }, 403);
  const hub = d.hub as (LatLng & { name: string }) | null;
  if (!hub?.lat) return json({ error: 'Your hub has no map location. Set it in Settings first.' }, 400);
  const settings = d.settings ?? {};
  const tz: string = d.timezone || 'Europe/Belgrade';

  // 1. Put orders without a map point on the map (remembered addresses first, then lookup)
  const orders = d.orders as any[];
  const unassigned: { order_id: string; code: string; reason: string }[] = [];
  let lookups = 0, found = 0;
  for (const o of orders) {
    if (o.lat != null && (o.confidence == null || o.confidence >= 0.6)) continue;
    const cached = await sb.rpc('find_cached_address', { p_org: org_id, p_address: [o.address_line, o.city].filter(Boolean).join(' '), p_phone: o.phone });
    let hit = cached.data && cached.data.lat ? { lat: cached.data.lat, lng: cached.data.lng, confidence: Number(cached.data.confidence ?? 0.9) } : null;
    if (!hit && lookups < MAX_LOOKUPS) {
      if (lookups > 0) await new Promise((r) => setTimeout(r, 1100));
      lookups++;
      hit = await geocodeAddress(o, hub);
    }
    if (hit && hit.confidence >= 0.6) {
      const { error: e } = await sb.rpc('set_order_pin', { p_order: o.id, p_lat: hit.lat, p_lng: hit.lng, p_confidence: hit.confidence, p_remember: true });
      if (!e) { o.lat = hit.lat; o.lng = hit.lng; o.confidence = hit.confidence; found++; continue; }
    }
    if (o.lat == null) o.skip = true;
    else if ((o.confidence ?? 1) < 0.6) o.skip = true;
    if (o.skip) unassigned.push({ order_id: o.id, code: o.code, reason: lookups >= MAX_LOOKUPS && !hit ? 'Not looked up yet — run planning again' : 'Address not found on the map — open the order and drop a pin' });
  }
  const plannable = orders.filter((o) => !o.skip);

  // 2. Drivers + vehicles
  const vehicles = [...(d.vehicles as any[])];
  const units: Unit[] = [];
  const hasOwn = (dr: any) => vehicles.some((v) => v.id === dr.vehicle_id);
  for (const dr of [...(d.drivers as any[])].sort((a, b) => Number(hasOwn(b)) - Number(hasOwn(a)))) {
    let k = vehicles.findIndex((v) => v.id === dr.vehicle_id);
    if (k === -1) k = 0; // biggest free vehicle
    const v = vehicles.length ? vehicles.splice(k, 1)[0] : null;
    if (!v && (d.vehicles as any[]).length) continue; // more drivers than vehicles
    units.push({ driverId: dr.id, vehicleId: v?.id ?? null, capKg: Number(v?.kg ?? 300) || 300, capParcels: Number(v?.parcels ?? 999) || 999 });
  }
  const fuelOf = new Map<string, number>((d.vehicles as any[]).map((v) => [v.id, Number(v.fuel ?? 8) || 8]));

  // 3. Working day
  const dayStart = localTime(date, String(settings.delivery_start ?? '08:00').slice(0, 5), tz);
  const dayEnd = localTime(date, String(settings.delivery_end ?? '20:00').slice(0, 5), tz);
  const soonest = new Date(Date.now() + 30 * 60000); // today: leave time to load
  const start = soonest > dayStart ? soonest : dayStart;
  const maxRouteS = Math.max(0, (dayEnd.getTime() - start.getTime()) / 1000);
  const serviceS = Number(settings.service_minutes ?? 4) * 60;

  if (!plannable.length) {
    const { data: saved, error: e } = await sb.rpc('apply_route_plan', { p_org: org_id, p_date: date, p_plan: { routes: [], unassigned, summary: { orders: orders.length, routes: 0 } } });
    if (e) return json({ error: e.message }, 403);
    return json({ ok: true, routes: 0, stops: 0, unassigned, summary: { orders: orders.length, planned: 0 }, message: orders.length ? 'None of the orders can be planned yet.' : 'No open orders for this day.', saved });
  }
  if (!units.length) return json({ error: 'No free driver for this day. Add a driver (and a vehicle) in Fleet & drivers.' }, 400);
  if (maxRouteS < 1800) return json({ error: 'The working day for this date is already over. Plan for tomorrow.' }, 400);

  // 4. Distances + optimise
  const points: LatLng[] = [hub, ...plannable.map((o) => ({ lat: o.lat, lng: o.lng }))];
  const m = await travelMatrix(points);
  const jobs: Job[] = plannable.map((o) => ({ id: o.id, kg: Number(o.kg) || 1, parcels: Number(o.parcels) || 1 }));
  const plan = solve(jobs, units, m.dist, m.dur, { serviceS, maxRouteS });
  for (const u of plan.unassigned) { const o = plannable[u.node - 1]; unassigned.push({ order_id: o.id, code: o.code, reason: u.reason }); }

  // Same drivers, stops in the order they came in: what it would cost without optimising.
  let naiveM = 0;
  for (const r of plan.routes) {
    const ns = [...r.nodes].sort((a, b) => a - b);
    let prev = 0; for (const x of ns) { naiveM += m.dist[prev]![x]!; prev = x; } naiveM += m.dist[prev]![0]!;
  }

  // 5. Build the routes (times, distances, map shape)
  let totalM = 0, totalS = 0, fuelL = 0, naiveFuelL = 0;
  const routes = [];
  for (const r of plan.routes) {
    let t = start.getTime(), prev = 0;
    const stops = r.nodes.map((node) => {
      const leg = { distance_m: Math.round(m.dist[prev]![node]!), duration_s: Math.round(m.dur[prev]![node]!) };
      t += leg.duration_s * 1000;
      const stop = { order_id: plannable[node - 1].id, eta: new Date(t).toISOString(), ...leg };
      t += serviceS * 1000; prev = node;
      return stop;
    });
    t += m.dur[prev]![0]! * 1000;
    const shape = await routeShape([hub, ...r.nodes.map((x) => points[x]!), hub]);
    const per100 = r.unit.vehicleId ? fuelOf.get(r.unit.vehicleId) ?? 8 : 8;
    totalM += r.distM; totalS += r.durS; fuelL += (r.distM / 100000) * per100;
    const ns = [...r.nodes].sort((a, b) => a - b); let nm = 0, p2 = 0; for (const x of ns) { nm += m.dist[p2]![x]!; p2 = x; } nm += m.dist[p2]![0]!;
    naiveFuelL += (nm / 100000) * per100;
    routes.push({ driver_id: r.unit.driverId, vehicle_id: r.unit.vehicleId, km: r.distM / 1000, minutes: Math.round(r.durS / 60), start: start.toISOString(), end: new Date(t).toISOString(), geometry: shape, stops });
  }

  const summary = {
    orders: orders.length, planned: plannable.length - plan.unassigned.length, routes: routes.length, geocoded: found,
    km: Math.round(totalM / 100) / 10, minutes: Math.round(totalS / 60), fuel_l: Math.round(fuelL * 10) / 10,
    km_saved: Math.max(0, Math.round((naiveM - totalM) / 100) / 10), fuel_saved_l: Math.max(0, Math.round((naiveFuelL - fuelL) * 10) / 10),
    distances: m.source, drivers_free: units.length
  };
  const { data: saved, error: e } = await sb.rpc('apply_route_plan', { p_org: org_id, p_date: date, p_plan: { routes, unassigned, summary, settings: { serviceS, start: start.toISOString(), end: dayEnd.toISOString() } } });
  if (e) return json({ error: e.message }, 403);
  return json({ ok: true, summary, unassigned, saved });
});
