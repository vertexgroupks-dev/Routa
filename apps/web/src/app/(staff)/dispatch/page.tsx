import Link from 'next/link';
import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Avatar, Empty, Pill } from '@/components/ui';
import { todayKs, time } from '@routa/shared';
import { PublishButton } from './PublishButton';
import { NewRoute, AddToRoute, AutoPlan } from './DispatchActions';
import { MapView, type MapMarker, type MapLine } from '@/components/MapView';

export const metadata = { title: 'Dispatch & Routes' };
const RS: Record<string, [string, string, string]> = {
  draft: ['Draft', '#F0F2F7', '#5B6378'], published: ['Published', '#EEF0FF', '#3B38BF'], loading: ['Loading', '#FFF4E5', '#B54708'],
  in_progress: ['On the road', '#E9F3FF', '#175CD3'], completed: ['Completed', '#E8F8EF', '#067647'], cancelled: ['Cancelled', '#FDECEC', '#B42318']
};

export default async function DispatchPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const ws = await requireStaff('/dispatch');
  const supabase = await createClient();
  const date = sp.date ?? todayKs();
  const [{ data: routes }, { count: unplanned }, { count: noPin }, { data: unassigned }, { data: drivers }, { data: map }, { data: nextDay }] = await Promise.all([
    supabase.from('routes').select('id, code, status, color, planned_km, planned_minutes, load_kg, dock, driver:drivers(full_name, phone), vehicle:vehicles(plate, model, capacity_kg), stops:route_stops(status, eta)').eq('org_id', ws.org.id).eq('date', date).order('code'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('org_id', ws.org.id).eq('delivery_date', date).in('status', ['confirmed', 'received', 'packed']),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('org_id', ws.org.id).eq('delivery_date', date).eq('needs_pin', true),
    supabase.from('orders').select('id, code, status, customer_name, address_line, needs_pin, weight_kg, zone:zones(name), stops:route_stops(id)').eq('org_id', ws.org.id).eq('delivery_date', date).in('status', ['confirmed', 'received', 'packed', 'rescheduled']).order('code').limit(200),
    supabase.from('drivers').select('id, full_name').eq('org_id', ws.org.id).eq('status', 'active').order('full_name'),
    supabase.rpc('day_map', { p_org: ws.org.id, p_date: date }),
    supabase.from('orders').select('delivery_date').eq('org_id', ws.org.id).gt('delivery_date', date).in('status', ['confirmed', 'received', 'packed', 'rescheduled']).order('delivery_date').limit(1).maybeSingle()
  ]);
  const markers: MapMarker[] = [];
  const lines: MapLine[] = [];
  if (map?.hub?.lat) markers.push({ lat: map.hub.lat, lng: map.hub.lng, kind: 'hub', title: map.hub.name ?? 'Hub' });
  for (const r of (map?.routes ?? []) as any[]) {
    if (r.line?.coordinates?.length) lines.push({ color: r.color ?? '#5B5CF6', coords: r.line.coordinates.map((c: number[]) => [c[1], c[0]]), dashed: r.status === 'draft' });
    for (const st of r.stops ?? []) markers.push({ lat: st.lat, lng: st.lng, label: String(st.seq), color: r.color, title: `${r.code} · stop ${st.seq} · ${st.code}`, sub: `${st.name} · ${st.address ?? ''}`, href: `/orders/${st.order_id}` });
  }
  for (const o of (map?.open ?? []) as any[]) markers.push({ lat: o.lat, lng: o.lng, kind: 'open', title: `${o.code} · not on a route`, sub: `${o.name} · ${o.address ?? ''}`, href: `/orders/${o.order_id}` });
  const live = (routes ?? []).filter((r) => !['draft', 'cancelled'].includes(r.status)).length;
  const canPlan = ['owner', 'admin', 'dispatcher'].includes(ws.role);
  const routeOpts = ((routes ?? []) as any[]).filter((r) => !['completed', 'cancelled'].includes(r.status)).map((r) => ({ id: r.id, label: `${r.code} · ${r.driver?.full_name ?? 'no driver'}` }));
  const open = ((unassigned ?? []) as any[]).filter((o) => !(o.stops ?? []).length);
  const drafts = (routes ?? []).filter((r) => r.status === 'draft').length;

  return (
    <>
      <PageHeader title="Dispatch & Routes" subtitle={`${date} · ${routes?.length ?? 0} routes · ${unplanned ?? 0} orders not on a route · ${noPin ?? 0} need a map pin`}>
        <form action="/dispatch" className="flex gap-2"><input type="date" name="date" defaultValue={date} className="input h-9 w-auto py-0" /><button className="btn-ghost">Show</button></form>
        <PublishButton orgId={ws.org.id} date={date} drafts={drafts} />
      </PageHeader>

      {nextDay?.delivery_date && (unplanned ?? 0) === 0 && (
        <Link href={`/dispatch?date=${nextDay.delivery_date}`} className="card flex items-center gap-3 px-5 py-3 text-[13px] hover:border-brand">
          <span className="flex-1">No orders waiting for {date}. Next orders are for <b>{nextDay.delivery_date}</b> (orders made after the daily cut-off go to the next day).</span>
          <span className="link">Open that day →</span>
        </Link>
      )}
      {canPlan && <AutoPlan orgId={ws.org.id} date={date} drafts={drafts} live={live} />}
      {markers.length > 1 && <MapView height={420} markers={markers} lines={lines} />}

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex-1 text-[15px] font-semibold">Routes</h2>
        <Link href={`/labels?date=${date}`} target="_blank" className="link text-[13px]">Print all labels</Link>
        <NewRoute orgId={ws.org.id} date={date} drivers={(drivers ?? []).map((d) => ({ id: d.id, label: d.full_name }))} />
      </div>

      <section className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
        {(routes ?? []).map((r: any) => {
          const total = r.stops?.length ?? 0;
          const done = (r.stops ?? []).filter((s: any) => ['delivered', 'failed', 'skipped'].includes(s.status)).length;
          const last = (r.stops ?? []).map((s: any) => s.eta).filter(Boolean).sort().pop();
          const st = RS[r.status] ?? RS.draft!;
          return (
            <Link href={`/dispatch/${r.id}`} key={r.id} className="card flex flex-col gap-3 p-4 transition-colors hover:border-brand">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-1.5 rounded-full" style={{ background: r.color ?? '#5B5CF6' }} />
                <Avatar name={r.driver?.full_name} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">{r.code} · {r.driver?.full_name ?? 'No driver'}</span>
                  <span className="truncate text-xs text-ink-3">{r.vehicle ? `${r.vehicle.plate} · ${r.vehicle.model}` : 'No vehicle'} · {r.dock ?? '—'}</span>
                </span>
                <Pill bg={st[1]} ink={st[2]}>{st[0]}</Pill>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[['Stops', `${done}/${total}`], ['km', r.planned_km ?? '—'], ['Load', `${Math.round(r.load_kg ?? 0)} kg`], ['Ends', time(last)]].map(([k, v]) => (
                  <span key={k} className="flex flex-col rounded-[10px] bg-canvas py-2"><span className="text-[11px] text-ink-3">{k}</span><span className="font-mono text-[13px] font-medium">{v}</span></span>
                ))}
              </div>
              <span className="flex h-1.5 overflow-hidden rounded-[3px] bg-field"><span style={{ width: `${total ? (done / total) * 100 : 0}%`, background: r.color ?? '#5B5CF6' }} /></span>
            </Link>
          );
        })}
      </section>
      {(routes ?? []).length === 0 && <div className="card"><Empty title="No routes for this day" body="Press “Plan routes automatically” above, or build one by hand with “+ New route”." /></div>}
      <section className="card overflow-x-auto">
        <h2 className="px-5 pt-5 text-base font-semibold">Not on a route yet ({open.length})</h2>
        <table className="mt-2 w-full min-w-[720px] border-collapse text-[13px]"><tbody>{open.map((o) => (
          <tr key={o.id} className="border-t border-line"><td className="td pl-5 font-mono"><Link href={`/orders/${o.id}`} className="text-brand-hover">{o.code}</Link></td><td className="td">{o.customer_name}</td><td className="td text-ink-2">{o.address_line}{o.needs_pin && <span className="ml-2 text-xs text-danger-ink">needs pin</span>}</td><td className="td text-ink-2">{o.zone?.name ?? '—'}</td><td className="td font-mono text-ink-2">{o.weight_kg ?? '—'} kg</td><td className="td pr-5 text-right">{routeOpts.length ? <AddToRoute orderId={o.id} routes={routeOpts} /> : <span className="text-xs text-ink-3">Create a route first</span>}</td></tr>
        ))}</tbody></table>
        {open.length === 0 && <p className="px-5 pb-5 text-[13px] text-ink-3">Every order for this day is on a route.</p>}
      </section>
      <Link href={`/orders?date=${date}`} className="link text-[13px]">See all orders for {date} →</Link>
    </>
  );
}
