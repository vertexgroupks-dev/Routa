import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { Icon } from '@/components/Icon';
import { StatusPill, Pill } from '@/components/ui';
import { STOP_STATUS, euro, time, type OrderStatus, type StopStatus } from '@routa/shared';
import { RouteSettings, StopControls } from '../DispatchActions';

export default async function RoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = await requireStaff();
  const sb = await createClient();
  const { data: r } = await sb.from('routes').select('*, driver:drivers(id, full_name), vehicle:vehicles(id, plate, model, capacity_kg, fuel_l_per_100km), stops:route_stops(id, sequence, status, eta, order:orders(id, code, status, customer_name, address_line, cod_amount, weight_kg, zone:zones(name)))').eq('id', id).maybeSingle();
  if (!r) notFound();
  const [{ data: drivers }, { data: vehicles }, { data: dayRoutes }] = await Promise.all([
    sb.from('drivers').select('id, full_name').eq('org_id', ws.org.id).eq('status', 'active').order('full_name'),
    sb.from('vehicles').select('id, plate, model').eq('org_id', ws.org.id).eq('active', true).order('plate'),
    sb.from('routes').select('id, code, driver:drivers(full_name)').eq('org_id', ws.org.id).eq('date', r.date).not('status', 'in', '(completed,cancelled)').order('code')
  ]);
  const stops = [...(r.stops ?? [])].sort((a: any, b: any) => a.sequence - b.sequence) as any[];
  const ids = stops.map((s) => s.id);
  const routeOpts = ((dayRoutes ?? []) as any[]).map((x) => ({ id: x.id, label: `${x.code} · ${x.driver?.full_name ?? 'no driver'}` }));
  const canEdit = ['owner', 'admin', 'dispatcher'].includes(ws.role) && !['completed', 'cancelled'].includes(r.status);
  const kg = stops.reduce((s, x) => s + Number(x.order?.weight_kg ?? 0), 0);
  const cap = Number(r.vehicle?.capacity_kg ?? 0);
  const fuel = r.planned_km && r.vehicle?.fuel_l_per_100km ? (Number(r.planned_km) * Number(r.vehicle.fuel_l_per_100km) / 100).toFixed(1) : null;
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/dispatch?date=${r.date}`} className="btn-ghost px-2.5"><Icon name="arrowLeft" size={16} /></Link>
        <span className="h-4 w-4 rounded-full" style={{ background: r.color ?? '#5B5CF6' }} />
        <h1 className="text-2xl font-semibold tracking-[-0.6px]">{r.code} · {r.driver?.full_name ?? 'No driver'}</h1>
        <Pill bg="#EEF0FF" ink="#3B38BF">{r.status.replace('_', ' ')}</Pill>
        <span className="flex-1" />
        <Link href={`/labels?ids=${stops.map((s) => s.order?.id).join(',')}`} target="_blank" className="btn-ghost">Print labels</Link>
      </div>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        {[['Stops', String(stops.length)], ['Load', `${Math.round(kg)} kg${cap ? ` / ${cap}` : ''}`], ['Planned km', r.planned_km ?? '—'], ['Fuel (est.)', fuel ? `${fuel} L` : '—'], ['Date', r.date]].map(([k, v]) => (
          <div key={k} className={`card p-4 ${k === 'Load' && cap && kg > cap ? 'border-danger' : ''}`}><span className="text-xs text-ink-3">{k}</span><p className="font-mono text-lg font-semibold">{v}</p></div>
        ))}
      </section>
      {canEdit && <section className="card p-5"><RouteSettings routeId={r.id} driverId={r.driver_id} vehicleId={r.vehicle_id} isDraft={r.status === 'draft'} drivers={(drivers ?? []).map((d) => ({ id: d.id, label: d.full_name }))} vehicles={(vehicles ?? []).map((v) => ({ id: v.id, label: `${v.plate} · ${v.model}` }))} /></section>}
      <section className="card overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-[13px]">
          <thead className="bg-white/30"><tr><th className="th pl-5">#</th><th className="th">Order</th><th className="th">Customer · address</th><th className="th">Zone</th><th className="th text-right">COD</th><th className="th">Stop</th><th className="th">ETA</th><th className="th pr-5 text-right"></th></tr></thead>
          <tbody>{stops.map((s, i) => (
            <tr key={s.id} className="border-t border-line">
              <td className="td pl-5 font-mono font-semibold">{s.sequence}</td>
              <td className="td"><Link href={`/orders/${s.order?.id}`} className="font-mono text-brand-hover">{s.order?.code}</Link><br /><StatusPill status={s.order?.status as OrderStatus} /></td>
              <td className="td"><span className="font-medium">{s.order?.customer_name}</span><br /><span className="text-ink-3">{s.order?.address_line}</span></td>
              <td className="td text-ink-2">{s.order?.zone?.name ?? '—'}</td>
              <td className="td text-right font-mono">{Number(s.order?.cod_amount) > 0 ? euro(s.order.cod_amount) : '—'}</td>
              <td className="td" style={{ color: STOP_STATUS[s.status as StopStatus]?.color }}>{STOP_STATUS[s.status as StopStatus]?.label}</td>
              <td className="td font-mono text-ink-2">{time(s.eta)}</td>
              <td className="td pr-5 text-right">{['pending', 'loaded'].includes(s.status) && <StopControls routeId={r.id} stopId={s.id} orderId={s.order?.id} ids={ids} index={i} routes={routeOpts} canEdit={canEdit} />}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>
    </>
  );
}
