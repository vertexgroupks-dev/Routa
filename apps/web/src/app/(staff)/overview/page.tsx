import Link from 'next/link';
import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { Icon, type IconName } from '@/components/Icon';
import { StatCard, PageHeader, Avatar, Empty } from '@/components/ui';
import { dateLong, euro, todayKs, time, TICKET_TYPE, type TicketType } from '@routa/shared';

export const metadata = { title: 'Overview' };

const TICKET_ICON: Record<string, { icon: IconName; tint: string; ink: string; cta: string }> = {
  no_answer: { icon: 'phone', tint: '#FFF4E5', ink: '#B54708', cta: 'Call' },
  wrong_address: { icon: 'pin', tint: '#FDECEC', ink: '#B42318', cta: 'Fix pin' },
  pod_review: { icon: 'camera', tint: '#EEF0FF', ink: '#4A49E3', cta: 'Review' },
  refused: { icon: 'undo', tint: '#FDECEC', ink: '#B42318', cta: 'Open' },
  cash_difference: { icon: 'banknote', tint: '#FFF4E5', ink: '#B54708', cta: 'Check' }
};
const TINTS = [['#EEF0FF', '#3B38BF'], ['#E8F8EF', '#067647'], ['#FFF4E5', '#B54708'], ['#E9F3FF', '#175CD3'], ['#F3EEFF', '#5B21B6']];

export default async function OverviewPage() {
  const ws = await requireStaff();
  const supabase = await createClient();
  const org = ws.org.id;
  const today = todayKs();
  const weekAgo = new Date(Date.now() - 6 * 86400_000).toLocaleDateString('en-CA', { timeZone: 'Europe/Belgrade' });

  const [{ data: todayOrders }, { data: week }, { data: routes }, { data: tickets }, { data: cod }] = await Promise.all([
    supabase.from('orders').select('status, cod_amount, cod_status').eq('org_id', org).eq('delivery_date', today),
    supabase.from('orders').select('status, delivery_date').eq('org_id', org).gte('delivery_date', weekAgo).lte('delivery_date', today).in('status', ['delivered', 'failed_attempt', 'rescheduled', 'returning', 'returned_to_hub', 'returned_to_merchant']),
    supabase.from('routes').select('id, code, color, status, driver:drivers(full_name, rating), stops:route_stops(status, eta, order:orders(zone:zones(name)))').eq('org_id', org).eq('date', today).order('code'),
    supabase.from('tickets').select('id, type, title, description, created_at').eq('org_id', org).neq('status', 'resolved').order('priority').order('created_at', { ascending: false }).limit(4),
    supabase.from('cod_collections').select('amount, handover_id').eq('org_id', org).gte('collected_at', `${today}T00:00:00`)
  ]);

  const o = todayOrders ?? [];
  const delivered = o.filter((x) => x.status === 'delivered').length;
  const failed = o.filter((x) => ['failed_attempt', 'rescheduled'].includes(x.status)).length;
  const onRoute = o.filter((x) => ['assigned', 'out_for_delivery'].includes(x.status)).length;
  const codCollected = (cod ?? []).reduce((s, c) => s + Number(c.amount), 0);
  const codWithDrivers = (cod ?? []).filter((c) => !c.handover_id).reduce((s, c) => s + Number(c.amount), 0);

  const days = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 86400_000).toLocaleDateString('en-CA', { timeZone: 'Europe/Belgrade' }));
  const bars = days.map((d) => {
    const rows = (week ?? []).filter((w) => w.delivery_date === d);
    return { d, delivered: rows.filter((r) => r.status === 'delivered').length, failed: rows.length - rows.filter((r) => r.status === 'delivered').length };
  });
  const max = Math.max(10, ...bars.map((b) => b.delivered + b.failed));
  const wkDelivered = bars.reduce((s, b) => s + b.delivered, 0);
  const wkFailed = bars.reduce((s, b) => s + b.failed, 0);

  const routeRows = (routes ?? []).map((r: any, i: number) => {
    const stops = r.stops ?? [];
    const done = stops.filter((s: any) => ['delivered', 'failed', 'skipped'].includes(s.status)).length;
    const lastEta = stops.map((s: any) => s.eta).filter(Boolean).sort().pop();
    const zones = [...new Set(stops.map((s: any) => s.order?.zone?.name).filter(Boolean))].slice(0, 2).join(', ');
    return { ...r, done, total: stops.length, pct: stops.length ? Math.round((done / stops.length) * 100) : 0, lastEta, zones, tint: TINTS[i % 5] };
  });
  const drivers = [...routeRows].sort((a, b) => b.done - a.done).slice(0, 5);
  const hour = Number(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', timeZone: 'Europe/Belgrade' }));
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHeader title={`${greet}, ${ws.fullName.split(' ')[0]}`} subtitle={`${dateLong()} · ${routeRows.length} routes today · ${o.length} orders`}>
        <Link href="/orders" className="btn-ghost"><Icon name="calendar" size={16} color="#5B6378" />Today</Link>
        <Link href="/dispatch" className="btn-dark"><Icon name="bolt" size={16} color="#C8F25A" />Plan tomorrow’s routes</Link>
      </PageHeader>

      <section aria-label="Key metrics" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <StatCard label="Orders today" value={String(o.length)} note={`${onRoute} on routes right now`} icon="package" tint="#EEF0FF" ink="#4A49E3" />
        <StatCard label="Delivered" value={String(delivered)} delta={{ text: o.length ? `${Math.round((delivered / o.length) * 100)}%` : '0%', bg: '#E8F8EF', ink: '#067647' }} note={`${onRoute} still on routes · ${failed} failed`} icon="check" tint="#E8F8EF" ink="#067647" />
        <StatCard label="Failed / no answer" value={String(failed)} delta={{ text: o.length ? `${((failed / o.length) * 100).toFixed(1)}%` : '0%', bg: '#FFF4E5', ink: '#B54708' }} note="Go to Helpdesk to call back or reschedule" icon="alert" tint="#FFF4E5" ink="#B54708" />
        <StatCard label="COD collected" value={euro(codCollected, 0)} note={`${euro(codWithDrivers, 0)} still with drivers`} icon="banknote" tint="#E9F3FF" ink="#175CD3" />
      </section>

      <div className="flex flex-wrap gap-4">
        <section className="card flex min-w-0 flex-[2_1_520px] flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 flex-col gap-0.5">
              <h2 className="text-base font-semibold">Deliveries · last 7 days</h2>
              <span className="text-[13px] text-ink-3">{wkDelivered} delivered · {wkFailed} failed · {wkDelivered + wkFailed ? ((wkDelivered / (wkDelivered + wkFailed)) * 100).toFixed(1) : '0'}% success</span>
            </div>
            <span className="flex gap-3.5 text-xs text-ink-2">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-brand" />Delivered</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-[#F59E0B]" />Failed</span>
            </span>
          </div>
          <div className="grid h-[220px] grid-cols-7 items-end gap-3.5 border-b border-line pt-2">
            {bars.map((b, i) => (
              <div key={b.d} className="flex h-full flex-col items-center justify-end gap-1.5">
                <span className="font-mono text-[11px] text-ink-2">{b.delivered + b.failed}</span>
                <div className="flex w-full max-w-11 flex-col gap-0.5">
                  {b.failed > 0 && <span className="rounded-t bg-[#F59E0B]" style={{ height: Math.round((b.failed / max) * 170) + 2 }} />}
                  <span className={b.failed > 0 ? 'rounded-b' : 'rounded'} style={{ height: Math.round((b.delivered / max) * 170), background: i === 6 ? '#0B0F1E' : '#5B5CF6' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="-mt-2 grid grid-cols-7 gap-3.5">
            {bars.map((b, i) => <span key={b.d} className="text-center text-xs text-ink-3">{i === 6 ? 'Today' : new Date(b.d).toLocaleDateString('en-GB', { weekday: 'short' })}</span>)}
          </div>
        </section>

        <section className="card flex min-w-0 flex-[1_1_320px] flex-col gap-3.5 p-5">
          <div className="flex items-center"><h2 className="flex-1 text-base font-semibold">Route progress</h2><Link href="/dispatch" className="link text-[13px]">All routes →</Link></div>
          {routeRows.length === 0 && <Empty title="No routes today" body="Plan and publish routes from Dispatch." />}
          {routeRows.map((r) => (
            <div key={r.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <Avatar name={r.driver?.full_name} bg={r.tint[0]} ink={r.tint[1]} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] font-medium">{r.driver?.full_name ?? 'Unassigned'} · {r.code}</span>
                  <span className="truncate text-xs text-ink-3">{r.zones || '—'} · {r.pct === 100 ? 'returning to hub' : `ETA ${time(r.lastEta)}`}</span>
                </span>
                <span className="font-mono text-[13px] text-ink-2">{r.done}/{r.total}</span>
              </div>
              <span className="flex h-1.5 overflow-hidden rounded-[3px] bg-field"><span className="rounded-[3px]" style={{ width: `${r.pct}%`, background: r.color ?? '#5B5CF6' }} /></span>
            </div>
          ))}
        </section>
      </div>

      <div className="flex flex-wrap gap-4">
        <section className="card flex min-w-0 flex-[1_1_380px] flex-col gap-3.5 p-5">
          <div className="flex items-center gap-2">
            <h2 className="flex-1 text-base font-semibold">Needs attention</h2>
            <span className="rounded-full bg-danger-tint px-2 py-0.5 text-xs font-medium text-danger-ink">{tickets?.length ?? 0} open</span>
          </div>
          {(tickets ?? []).length === 0 && <Empty title="All clear" body="No open problems right now." />}
          {(tickets ?? []).map((t) => {
            const m = TICKET_ICON[t.type] ?? { icon: 'alert' as IconName, tint: '#F0F2F7', ink: '#5B6378', cta: 'Open' };
            return (
              <div key={t.id} className="flex gap-3 rounded-xl border border-line p-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg" style={{ background: m.tint }}><Icon name={m.icon} size={16} color={m.ink} /></span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13px] font-medium">{t.title}</span>
                  <span className="text-xs text-ink-3">{TICKET_TYPE[t.type as TicketType]} · {t.description}</span>
                </span>
                <Link href="/helpdesk" className="link self-center text-[13px]">{m.cta}</Link>
              </div>
            );
          })}
        </section>

        <section className="card flex min-w-0 flex-[1_1_380px] flex-col gap-3.5 p-5">
          <h2 className="text-base font-semibold">Drivers today</h2>
          <table className="w-full border-collapse text-[13px]">
            <thead><tr className="text-left text-xs text-ink-3"><th className="pb-2.5 font-medium">Driver</th><th className="pb-2.5 text-right font-medium">Stops done</th><th className="pb-2.5 text-right font-medium">Progress</th><th className="pb-2.5 text-right font-medium">Rating</th></tr></thead>
            <tbody>
              {drivers.map((d, i) => (
                <tr key={d.id} className="border-t border-line">
                  <td className="py-2.5"><span className="flex items-center gap-2.5"><span className="w-3.5 font-mono text-ink-3">{i + 1}</span><span className="font-medium">{d.driver?.full_name ?? '—'}</span></span></td>
                  <td className="py-2.5 text-right font-mono">{d.done}</td>
                  <td className="py-2.5 text-right font-mono">{d.pct}%</td>
                  <td className="py-2.5 text-right">★ {d.driver?.rating ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
