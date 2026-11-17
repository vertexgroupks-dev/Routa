// Map helpers shared by the geocode and plan-routes functions.
// Address lookup: OpenStreetMap Nominatim (free, max ~1 request/second).
// Road distances: OSRM (free public server). Both fall back gracefully if unreachable.

export type LatLng = { lat: number; lng: number };
export type GeoHit = LatLng & { label: string; kind: string; confidence: number };

const UA = 'Routa/1.0 (https://routalogistics.netlify.app)';

// How precise a match is, by the kind of place Nominatim found.
const CONF: Record<string, number> = {
  house: 0.95, building: 0.95, amenity: 0.9, shop: 0.9, office: 0.9, tourism: 0.85, leisure: 0.8,
  road: 0.75, residential: 0.72, neighbourhood: 0.66, suburb: 0.64, quarter: 0.64, city_district: 0.6,
  hamlet: 0.6, village: 0.6, isolated_dwelling: 0.7, town: 0.35, city: 0.3, municipality: 0.25, county: 0.1, state: 0.05, country: 0
};

export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000, toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad, dLng = (b.lng - a.lng) * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

// Neighbourhoods people write instead of street addresses. Most points are taken from OpenStreetMap;
// they are the neighbourhood centre, so a driver may still need to call. Every pin a dispatcher
// fixes by hand is remembered per address, so the company's own list keeps getting better.
const PLACES: { names: string[]; city: string; lat: number; lng: number }[] = [
  { names: ['dardania', 'dardani', 'dardanija'], city: 'prishtin', lat: 42.6520, lng: 21.1505 },
  { names: ['ulpiana', 'ulpiane', 'ulpijana'], city: 'prishtin', lat: 42.6504, lng: 21.1607 },
  { names: ['lakrishte', 'lakrishta'], city: 'prishtin', lat: 42.6560, lng: 21.1517 },
  { names: ['bregu i diellit', 'breg i diellit'], city: 'prishtin', lat: 42.6500, lng: 21.1688 },
  { names: ['sunny hill', 'kodra e diellit', 'sunnyhill'], city: 'prishtin', lat: 42.6557, lng: 21.1790 },
  { names: ['velania', 'velani'], city: 'prishtin', lat: 42.6621, lng: 21.1744 },
  { names: ['arberia', 'arberi', 'dragodan'], city: 'prishtin', lat: 42.6620, lng: 21.1501 },
  { names: ['kodra e trimave'], city: 'prishtin', lat: 42.6801, lng: 21.1661 },
  { names: ['tophane', 'tophana'], city: 'prishtin', lat: 42.6682, lng: 21.1606 },
  { names: ['taslixhe', 'taslixha'], city: 'prishtin', lat: 42.6682, lng: 21.1785 },
  { names: ['kalabria', 'kalabri'], city: 'prishtin', lat: 42.6432, lng: 21.1460 },
  { names: ['veternik', 'veterniku'], city: 'prishtin', lat: 42.6317, lng: 21.1537 },
  { names: ['mati 1', 'mati i', 'mati'], city: 'prishtin', lat: 42.6466, lng: 21.1797 },
  { names: ['pejton', 'qyteza pejton'], city: 'prishtin', lat: 42.6577, lng: 21.1574 },
  { names: ['qendra', 'qender', 'qendr', 'center', 'centre'], city: 'prishtin', lat: 42.6629, lng: 21.1640 }
];

export function knownPlace(a: { address_line?: string | null; city?: string | null; landmark?: string | null }): GeoHit | null {
  const text = ` ${norm([a.address_line, a.landmark].filter(Boolean).join(' '))} `;
  const city = norm(a.city ?? '');
  for (const p of PLACES) {
    if (city && !city.includes(p.city) && !p.city.includes(city)) continue;
    const name = p.names.find((n) => text.includes(` ${n} `) || text.includes(` lagjja ${n} `) || text.includes(` lagja ${n} `));
    if (name) return { lat: p.lat, lng: p.lng, label: `Neighbourhood ${p.names[0]![0]!.toUpperCase()}${p.names[0]!.slice(1)} (centre)`, kind: 'neighbourhood', confidence: 0.64 };
  }
  return null;
}

// "Rr. Agim Ramadani 14" -> "Rruga Agim Ramadani 14"
function tidy(s: string): string {
  return s.replace(/\b(rr|rrug|rruga)\.?\s+/gi, 'Rruga ').replace(/\bnr\.?\s*/gi, '').replace(/\s+/g, ' ').trim();
}

export async function nominatim(q: string, near: LatLng, radiusDeg = 0.5): Promise<GeoHit[]> {
  const p = new URLSearchParams({
    q, format: 'jsonv2', countrycodes: 'xk', limit: '5', 'accept-language': 'sq',
    viewbox: `${near.lng - radiusDeg},${near.lat + radiusDeg * 0.7},${near.lng + radiusDeg},${near.lat - radiusDeg * 0.7}`, bounded: radiusDeg < 0.5 ? '1' : '0'
  });
  try {
    const url = `https://nominatim.openstreetmap.org/search?${p}`;
    let r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
    if (r.status === 429) { await sleep(2000); r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) }); }
    if (!r.ok) return [];
    const rows = (await r.json()) as any[];
    return rows
      .map((x) => {
        const kind = String(x.addresstype ?? x.type ?? '');
        return { lat: Number(x.lat), lng: Number(x.lon), label: String(x.display_name ?? ''), kind, confidence: CONF[kind] ?? 0.5 };
      })
      .filter((x) => Number.isFinite(x.lat) && haversine(near, x) < 90000);
  } catch {
    return [];
  }
}

// Order of attempts: a real street match in the city, then a known neighbourhood, then landmark / wider search.
export async function geocodeAddress(a: { address_line?: string | null; city?: string | null; landmark?: string | null }, near: LatLng): Promise<GeoHit | null> {
  const street = tidy(a.address_line ?? '');
  const place = knownPlace(a);
  const local = !a.city || haversine(near, { lat: 42.6629, lng: 21.1655 }) < 15000 && /prisht/i.test(a.city ?? '');
  const hasStreet = /\d|rruga|bulevardi|sheshi/i.test(street);
  const tries: [string, number][] = [];
  if (street) tries.push([[street, a.city].filter(Boolean).join(', '), local ? 0.12 : 0.5]);
  if (a.landmark) tries.push([[a.landmark, a.city].filter(Boolean).join(', '), local ? 0.12 : 0.5]);
  let best: GeoHit | null = null;
  for (let i = 0; i < tries.length; i++) {
    if (i > 0) await sleep(1100);
    const hits = await nominatim(tries[i]![0], near, tries[i]![1]);
    const top = hits.sort((x, y) => y.confidence - x.confidence)[0];
    if (top && (!best || top.confidence > best.confidence)) best = top;
    if (best && best.confidence >= 0.7) return best;
    if (i === 0 && place && !hasStreet) return place; // "Dardania" — no need to keep searching
  }
  if (place && (!best || best.confidence < place.confidence)) return place;
  return best;
}

export type Matrix = { dist: number[][]; dur: number[][]; source: 'roads' | 'estimate' };

// Driving distance (m) and time (s) between every pair of points.
export async function travelMatrix(points: LatLng[]): Promise<Matrix> {
  if (points.length >= 2 && points.length <= 100) {
    try {
      const coords = points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
      const r = await fetch(`https://router.project-osrm.org/table/v1/driving/${coords}?annotations=duration,distance`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
      if (r.ok) {
        const j = await r.json();
        if (j.code === 'Ok' && j.distances && j.durations) {
          const ok = (m: any[][]) => m.every((row) => row.every((v) => v !== null));
          if (ok(j.distances) && ok(j.durations)) return { dist: j.distances, dur: j.durations, source: 'roads' };
        }
      }
    } catch { /* fall back below */ }
  }
  // Estimate: straight line x 1.35 for roads, 28 km/h average in town.
  const dist = points.map((a) => points.map((b) => Math.round(haversine(a, b) * 1.35)));
  const dur = dist.map((row) => row.map((d) => Math.round(d / (28 / 3.6))));
  return { dist, dur, source: 'estimate' };
}

// Road shape of a route for the map (GeoJSON LineString), or a straight-line fallback.
export async function routeShape(points: LatLng[]): Promise<{ type: 'LineString'; coordinates: number[][] }> {
  const straight = { type: 'LineString' as const, coordinates: points.map((p) => [p.lng, p.lat]) };
  if (points.length < 2 || points.length > 100) return straight;
  try {
    const coords = points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=simplified&geometries=geojson`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (r.ok) {
      const j = await r.json();
      const g = j.routes?.[0]?.geometry;
      if (g?.type === 'LineString' && g.coordinates?.length >= 2) return g;
    }
  } catch { /* straight line */ }
  return straight;
}
