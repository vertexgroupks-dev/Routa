// Route optimiser: splits the day's orders between the available drivers/vehicles and orders the stops
// so the total driving distance (= fuel) is as low as possible, within vehicle capacity and the working day.
//   1. Clarke–Wright savings: start with one trip per order, keep merging the pair of trips that saves
//      the most kilometres while it still fits in a vehicle and in the day.
//   2. Give each trip the smallest free vehicle it fits in; leftovers are inserted where they cost least.
//   3. 2-opt + or-opt: untangle crossings and move single stops to their cheapest place.
// Node 0 is the hub. Every route starts and ends at the hub.

export type Job = { id: string; kg: number; parcels: number };
export type Unit = { driverId: string; vehicleId: string | null; capKg: number; capParcels: number };
export type Options = { serviceS: number; maxRouteS: number; maxStops?: number }; // maxStops spreads work over more drivers
export type PlannedRoute = { unit: Unit; nodes: number[]; distM: number; durS: number; kg: number; parcels: number };
export type Plan = { routes: PlannedRoute[]; unassigned: { node: number; reason: string }[] };

export function solve(jobs: Job[], units: Unit[], dist: number[][], dur: number[][], opt: Options): Plan {
  const n = jobs.length;
  const unassigned: Plan['unassigned'] = [];
  if (!n) return { routes: [], unassigned };
  if (!units.length) return { routes: [], unassigned: jobs.map((_, i) => ({ node: i + 1, reason: 'No free driver for this day' })) };

  const job = (node: number) => jobs[node - 1]!;
  const pathDist = (nodes: number[]) => { let d = 0, prev = 0; for (const x of nodes) { d += dist[prev]![x]!; prev = x; } return d + dist[prev]![0]!; };
  const pathDur = (nodes: number[]) => { let d = 0, prev = 0; for (const x of nodes) { d += dur[prev]![x]! + opt.serviceS; prev = x; } return d + dur[prev]![0]!; };
  const maxStops = opt.maxStops && opt.maxStops > 0 ? opt.maxStops : Infinity;
  const maxKg = Math.max(...units.map((u) => u.capKg));
  const maxParcels = Math.max(...units.map((u) => u.capParcels));

  // Orders that can never fit or be reached in a day.
  const ok: number[] = [];
  for (let i = 1; i <= n; i++) {
    if (job(i).kg > maxKg || job(i).parcels > maxParcels) unassigned.push({ node: i, reason: 'Too heavy / too many parcels for any vehicle' });
    else if (pathDur([i]) > opt.maxRouteS) unassigned.push({ node: i, reason: 'Too far to reach and return within the working day' });
    else ok.push(i);
  }

  type Trip = { nodes: number[]; kg: number; parcels: number };
  function savingsTrips(list: number[], capKg: number, capParcels: number): Trip[] {
    const trips = new Map<number, Trip>();
    const tripOf = new Map<number, number>();
    list.forEach((i) => { trips.set(i, { nodes: [i], kg: job(i).kg, parcels: job(i).parcels }); tripOf.set(i, i); });
    const savings: [number, number, number][] = [];
    for (const i of list) for (const j of list) if (i !== j) {
      const s = dist[i]![0]! + dist[0]![j]! - dist[i]![j]!;
      if (s > 0) savings.push([s, i, j]);
    }
    savings.sort((a, b) => b[0] - a[0]);
    for (const [, i, j] of savings) {
      const a = tripOf.get(i)!, b = tripOf.get(j)!;
      if (a === b) continue;
      const A = trips.get(a)!, B = trips.get(b)!;
      if (A.nodes[A.nodes.length - 1] !== i || B.nodes[0] !== j) continue;
      if (A.kg + B.kg > capKg || A.parcels + B.parcels > capParcels) continue;
      const nodes = [...A.nodes, ...B.nodes];
      if (nodes.length > maxStops || pathDur(nodes) > opt.maxRouteS) continue;
      A.nodes = nodes; A.kg += B.kg; A.parcels += B.parcels;
      trips.delete(b);
      for (const x of B.nodes) tripOf.set(x, a);
    }
    return [...trips.values()].sort((x, y) => y.kg - x.kg || y.nodes.length - x.nodes.length);
  }

  // 1+2. Savings trips, then give each trip the smallest free vehicle it fits in.
  //      Whatever is left is re-planned with the vehicles still free, until nothing changes.
  const routes: PlannedRoute[] = [];
  let free = [...units].sort((x, y) => x.capKg - y.capKg);
  let pending = ok;
  while (pending.length && free.length) {
    const capKg = Math.max(...free.map((u) => u.capKg)), capParcels = Math.max(...free.map((u) => u.capParcels));
    const fits = pending.filter((i) => job(i).kg <= capKg && job(i).parcels <= capParcels);
    const tooBig = pending.filter((i) => !fits.includes(i));
    if (!fits.length) break;
    const next: number[] = [...tooBig];
    let used = false;
    for (const t of savingsTrips(fits, capKg, capParcels)) {
      const k = free.findIndex((u) => u.capKg >= t.kg && u.capParcels >= t.parcels);
      if (k === -1) { next.push(...t.nodes); continue; }
      const unit = free.splice(k, 1)[0]!;
      routes.push({ unit, nodes: t.nodes, distM: 0, durS: 0, kg: t.kg, parcels: t.parcels });
      used = true;
    }
    pending = next;
    if (!used) break;
  }
  const leftovers = pending;

  // Cheapest insertion for what didn't get a vehicle (first respecting the stop limit, then without it)
  for (const x of leftovers) {
    let best: { r: PlannedRoute; pos: number; cost: number } | null = null;
    for (const limit of [maxStops, Infinity]) {
      for (const r of routes) {
        if (r.nodes.length + 1 > limit) continue;
        if (r.kg + job(x).kg > r.unit.capKg || r.parcels + job(x).parcels > r.unit.capParcels) continue;
        for (let p = 0; p <= r.nodes.length; p++) {
          const nodes = [...r.nodes.slice(0, p), x, ...r.nodes.slice(p)];
          if (pathDur(nodes) > opt.maxRouteS) continue;
          const cost = pathDist(nodes) - pathDist(r.nodes);
          if (!best || cost < best.cost) best = { r, pos: p, cost };
        }
      }
      if (best) break;
    }
    if (best) { best.r.nodes.splice(best.pos, 0, x); best.r.kg += job(x).kg; best.r.parcels += job(x).parcels; }
    else unassigned.push({ node: x, reason: 'Not enough drivers or vehicle space today' });
  }

  // 3. Local search on every route
  for (const r of routes) {
    r.nodes = improve(r.nodes, pathDist, pathDur, opt.maxRouteS);
    r.distM = pathDist(r.nodes);
    r.durS = pathDur(r.nodes);
  }
  routes.sort((a, b) => b.nodes.length - a.nodes.length);
  return { routes, unassigned };
}

function improve(start: number[], cost: (n: number[]) => number, time: (n: number[]) => number, maxS: number): number[] {
  let nodes = [...start];
  let best = cost(nodes);
  let better = true, guard = 0;
  while (better && guard++ < 200) {
    better = false;
    // 2-opt: reverse a segment
    for (let i = 0; i < nodes.length - 1; i++) for (let k = i + 1; k < nodes.length; k++) {
      const cand = [...nodes.slice(0, i), ...nodes.slice(i, k + 1).reverse(), ...nodes.slice(k + 1)];
      const c = cost(cand);
      if (c < best - 1 && time(cand) <= maxS) { nodes = cand; best = c; better = true; }
    }
    // or-opt: move one stop elsewhere
    for (let i = 0; i < nodes.length; i++) for (let p = 0; p < nodes.length; p++) {
      if (p === i) continue;
      const rest = [...nodes.slice(0, i), ...nodes.slice(i + 1)];
      const cand = [...rest.slice(0, p), nodes[i]!, ...rest.slice(p)];
      const c = cost(cand);
      if (c < best - 1 && time(cand) <= maxS) { nodes = cand; best = c; better = true; }
    }
  }
  return nodes;
}
