import Link from 'next/link';
import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Avatar, Empty, Pill } from '@/components/ui';
import { todayKs, time } from '@routa/shared';
import { PublishButton } from './PublishButton';

export const metadata = { title: 'Dispatch & Routes' };
const RS: Record<string, [string, string, string]> = {
  draft: ['Draft', '#F0F2F7', '#5B6378'], published: ['Published', '#EEF0FF', '#3B38BF'], loading: ['Loading', '#FFF4E5', '#B54708'],
  in_progress: ['On the road', '#E9F3FF', '#175CD3'], completed: ['Completed', '#E8F8EF', '#067647'], cancelled: ['Cancelled', '#FDECEC', '#B42318']
};

export default async function DispatchPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const ws = await requireStaff();
  const supabase = await createClient();
  const date = sp.date ?? todayKs();
  const [{ data: routes }, { count: unplanned }, { count: noPin }] = await Promise.all([
    supabase.from('routes').select('id, code, status, color, planned_km, planned_minutes, load_kg, dock, driver:drivers(full_name, phone), vehicle:vehicles(plate, model, capacity_kg), stops:route_stops(status, eta)').eq('org_id', ws.org.id).eq('date', date).order('code'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('org_id', ws.org.id).eq('delivery_date', date).in('status', ['confirmed', 'received', 'packed']),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('org_id', ws.org.id).eq('delivery_date', date).eq('needs_pin', true)
  ]);
  const drafts = (routes ?? []).filter((r) => r.status === 'draft').length;

  return (
    <>
      <PageHeader title="Dispatch & Routes" subtitle={`${date} · ${routes?.length ?? 0} routes · ${unplanned ?? 0} orders not on a route · ${noPin ?? 0} need a map pin`}>
        <form action="/dispatch" className="flex gap-2"><input type="date" name="date" defaultValue={date} className="input py-2" /><button className="btn-ghost">Go</button></form>
        <PublishButton orgId={ws.org.id} date={date} drafts={drafts} />
      </PageHeader>

      <div className="rounded-[14px] border border-dashed border-brand bg-brand-tint px-5 py-4 text-[13px] text-brand-deep">
        <b>Automatic route optimisation</b> (VROOM + OSRM on the Kosovo road map) and the drag-and-drop map arrive in Stage 4. Publishing already works: it assigns orders, notifies drivers and creates the warehouse pick lists.
      </div>

      <section className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
        {(routes ?? []).map((r: any) => {
          const total = r.stops?.length ?? 0;
          const done = (r.stops ?? []).filter((s: any) => ['delivered', 'failed', 'skipped'].includes(s.status)).length;
          const last = (r.stops ?? []).map((s: any) => s.eta).filter(Boolean).sort().pop();
          const st = RS[r.status] ?? RS.draft!;
          return (
            <div key={r.id} className="card flex flex-col gap-3 p-4">
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
            </div>
          );
        })}
      </section>
      {(routes ?? []).length === 0 && <div className="card"><Empty title="No routes for this day" body="Once optimisation is connected (Stage 4) you’ll build routes here in one click." /></div>}
      <Link href={`/orders?date=${date}`} className="link text-[13px]">See all orders for {date} →</Link>
    </>
  );
}
