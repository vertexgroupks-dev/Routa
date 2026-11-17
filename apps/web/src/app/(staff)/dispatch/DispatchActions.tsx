'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAction, Msg } from '@/components/useAction';

type Opt = { id: string; label: string };

export function NewRoute({ orgId, date, drivers }: { orgId: string; date: string; drivers: Opt[] }) {
  const router = useRouter();
  const a = useAction();
  const [driver, setDriver] = useState(drivers[0]?.id ?? '');
  return (
    <span className="flex items-center gap-2">
      <select className="input w-auto py-2" value={driver} onChange={(e) => setDriver(e.target.value)}>{drivers.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select>
      <button disabled={a.busy} className="btn-ghost" onClick={async () => { const id = await a.run(() => createClient().rpc('create_route', { p_org: orgId, p_date: date, p_driver: driver || null, p_vehicle: null })); if (typeof id === 'string') router.push(`/dispatch/${id}`); }}>+ New route</button>
      {a.error && <span className="text-xs text-danger-ink">{a.error}</span>}
    </span>
  );
}

export function AddToRoute({ orderId, routes }: { orderId: string; routes: Opt[] }) {
  const a = useAction();
  return (
    <span className="inline-flex items-center gap-1.5">
      <select disabled={a.busy} defaultValue="" className="input w-auto py-1 text-xs" onChange={(e) => e.target.value && a.run(() => createClient().rpc('assign_order_to_route', { p_order: orderId, p_route: e.target.value, p_position: null }))}>
        <option value="">Add to route…</option>{routes.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select>
      {a.error && <span className="text-xs text-danger-ink">{a.error}</span>}
    </span>
  );
}

export function StopControls({ routeId, stopId, orderId, ids, index, routes, canEdit }: { routeId: string; stopId: string; orderId: string; ids: string[]; index: number; routes: Opt[]; canEdit: boolean }) {
  const a = useAction();
  const sb = createClient();
  if (!canEdit) return null;
  const move = (dir: -1 | 1) => { const n = [...ids]; const j = index + dir; if (j < 0 || j >= n.length) return; [n[index], n[j]] = [n[j]!, n[index]!]; a.run(() => sb.rpc('resequence_route', { p_route: routeId, p_stop_ids: n })); };
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
      <button disabled={a.busy || index === 0} onClick={() => move(-1)} className="btn-ghost px-2 py-1 text-xs">↑</button>
      <button disabled={a.busy || index === ids.length - 1} onClick={() => move(1)} className="btn-ghost px-2 py-1 text-xs">↓</button>
      <select disabled={a.busy} defaultValue="" className="input w-auto py-1 text-xs" onChange={(e) => e.target.value && a.run(() => sb.rpc('assign_order_to_route', { p_order: orderId, p_route: e.target.value, p_position: null }))}>
        <option value="">Move to…</option>{routes.filter((r) => r.id !== routeId).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select>
      <button disabled={a.busy} onClick={() => a.run(() => sb.rpc('remove_stop', { p_stop: stopId }))} className="text-xs text-danger-ink">Remove</button>
      {a.error && <span className="w-full text-right text-xs text-danger-ink">{a.error}</span>}
    </span>
  );
}

export function RouteSettings({ routeId, driverId, vehicleId, drivers, vehicles, isDraft }: { routeId: string; driverId: string | null; vehicleId: string | null; drivers: Opt[]; vehicles: Opt[]; isDraft: boolean }) {
  const router = useRouter();
  const a = useAction();
  const [d, setD] = useState(driverId ?? '');
  const [v, setV] = useState(vehicleId ?? '');
  const sb = createClient();
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="label">Driver<select className="input w-auto py-2" value={d} onChange={(e) => setD(e.target.value)}><option value="">—</option>{drivers.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
      <label className="label">Vehicle<select className="input w-auto py-2" value={v} onChange={(e) => setV(e.target.value)}><option value="">—</option>{vehicles.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
      <button disabled={a.busy} className="btn-ghost" onClick={() => a.run(() => sb.rpc('update_route', { p_route: routeId, p_driver: d || null, p_vehicle: v || null }), 'Saved.')}>Save</button>
      {isDraft && <button disabled={a.busy} className="btn-ghost text-danger-ink" onClick={async () => { const ok = await a.run(() => sb.rpc('delete_route', { p_route: routeId })); if (ok) router.push('/dispatch'); }}>Delete route</button>}
      <Msg error={a.error} ok={a.ok} />
    </div>
  );
}

type PlanResult = {
  summary?: { orders: number; planned: number; routes: number; km?: number; minutes?: number; fuel_l?: number; km_saved?: number; fuel_saved_l?: number; geocoded?: number; distances?: string };
  unassigned?: { order_id: string; code: string; reason: string }[];
  message?: string;
};

// One click: the system splits the day's orders between drivers and orders every stop.
export function AutoPlan({ orgId, date, drafts, live }: { orgId: string; date: string; drafts: number; live: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (drafts > 0 && !confirm(`This replaces the ${drafts} draft route(s) for ${date}. Published routes are not touched. Continue?`)) return;
    setBusy(true); setError(null); setRes(null);
    const { data, error } = await createClient().functions.invoke('plan-routes', { body: { org_id: orgId, date } });
    setBusy(false);
    if (error) {
      let msg = error.message;
      try { const body = await (error as any).context?.json?.(); if (body?.error) msg = body.error; } catch { /* keep message */ }
      return setError(msg);
    }
    if (data?.error) return setError(data.error);
    setRes(data);
    router.refresh();
  }

  const s = res?.summary;
  const h = (m?: number) => (m == null ? '—' : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`);
  return (
    <section className="card flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-ink text-lg text-lime">✦</span>
        <div className="flex min-w-[240px] flex-1 flex-col">
          <h2 className="text-[15px] font-semibold">Automatic route planning</h2>
          <p className="text-[13px] text-ink-3">Finds every address on the map, splits the orders between your free drivers and vehicles (weight, parcels, working hours) and orders the stops for the shortest drive. You review, then publish.</p>
        </div>
        <button disabled={busy} onClick={run} className="btn-dark h-11 px-5">{busy ? 'Planning… (up to a minute)' : drafts ? 'Re-plan routes' : 'Plan routes automatically'}</button>
      </div>
      {live > 0 && !res && <p className="text-xs text-ink-3">{live} route(s) already published for this day stay as they are; only orders not on them are planned.</p>}
      {error && <p className="rounded-xl bg-danger-tint px-3 py-2 text-[13px] text-danger-ink">{error}</p>}
      {res && (
        <div className="flex flex-col gap-3">
          {s && s.routes > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
              {[['Routes', String(s.routes)], ['Orders planned', `${s.planned} / ${s.orders}`], ['Total drive', `${s.km} km`], ['Driving + stops', h(s.minutes)], ['Fuel (est.)', `${s.fuel_l} L`], ['Saved vs. as entered', `${s.km_saved} km · ${s.fuel_saved_l} L`]].map(([k, v]) => (
                <span key={k} className="flex flex-col rounded-xl bg-white/60 px-3 py-2"><span className="text-[11px] text-ink-3">{k}</span><span className="font-mono text-sm font-semibold">{v}</span></span>
              ))}
            </div>
          ) : <p className="text-[13px] text-ink-2">{res.message ?? 'Nothing to plan.'}</p>}
          {s?.distances === 'estimate' && <p className="text-xs text-warning-ink">Road distances were unavailable, so straight-line estimates were used. Plan again later for exact road times.</p>}
          {(res.unassigned ?? []).length > 0 && (
            <div className="rounded-xl bg-warning-tint px-3 py-2 text-[13px] text-warning-ink">
              <b>{res.unassigned!.length} order(s) not planned:</b>
              <ul className="mt-1 flex flex-col gap-0.5">{res.unassigned!.slice(0, 12).map((u) => <li key={u.order_id}><a href={`/orders/${u.order_id}`} className="font-mono underline">{u.code}</a> — {u.reason}</li>)}</ul>
            </div>
          )}
          {s && s.routes > 0 && <p className="text-xs text-ink-3">Routes are saved as drafts below. Check them, then press <b>Publish</b> to send them to the drivers.</p>}
        </div>
      )}
    </section>
  );
}
