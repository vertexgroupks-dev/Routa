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
