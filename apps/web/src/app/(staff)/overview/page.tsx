import Link from 'next/link';
import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { Icon, type IconName } from '@/components/Icon';
import { PageHeader, StatStrip, Accordion, Avatar, Empty, SectionTitle } from '@/components/ui';
import { dateLong, euro, todayKs, time, TICKET_TYPE, type TicketType } from '@routa/shared';

export const metadata = { title: 'Overview' };

const TICKET_ICON: Record<string, IconName> = { no_answer: 'phone', wrong_address: 'pin', pod_review: 'camera', refused: 'undo', cash_difference: 'banknote' };

export default async function OverviewPage() {
  const ws = await requireStaff('/overview');
  const sb = await createClient();
  const org = ws.org.id;
  const today = todayKs();
  const weekAgo = new Date(Date.now() - 6 * 86400_000).toLocaleDateString('en-CA', { timeZone: 'Europe/Belgrade' });
  const head = { count: 'exact' as const, head: true };
  // Start of today in Kosovo time, as an exact timestamp (handles summer/winter time).
  const tz = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Belgrade', timeZoneName: 'longOffset' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value.replace('GMT', '') || '+01:00';
  const dayStart = `${today}T00:00:00${tz}`;

  const [{ data: todayOrders }, { data: week }, { data: routes }, { data: tickets }, { data: cod }, m, d, v, mem, all, waiting, created] = await Promise.all([
    sb.from('orders').select('status').eq('org_id', org).eq('delivery_date', today),
    sb.from('orders').select('status, delivery_date').eq('org_id', org).gte('delivery_date', weekAgo).lte('delivery_date', today).in('status', ['delivered', 'failed_attempt', 'rescheduled', 'returning', 'returned_to_hub', 'returned_to_merchant']),
    sb.from('routes').select('id, code, color, status, driver:drivers(full_name), stops:route_stops(status, eta)').eq('org_id', org).eq('date', today).order('code'),
    sb.from('tickets').select('id, type, title, description').eq('org_id', org).neq('status', 'resolved').order('priority').order('created_at', { ascending: false }).limit(5),
    sb.from('cod_collections').select('amount, handover_id').eq('org_id', org).gte('collected_at', dayStart),
    sb.from('merchants').select('id', head).eq('org_id', org),
    sb.from('drivers').select('id', head).eq('org_id', org),
    sb.from('vehicles').select('id', head).eq('org_id', org),
    sb.from('memberships').select('id', head).eq('org_id', org),
    sb.from('orders').select('id', head).eq('org_id', org),
    sb.from('orders').select('id', head).eq('org_id', org).in('status', ['confirmed', 'received', 'packed']).lte('delivery_date', today),
    sb.from('orders').select('id', head).eq('org_id', org).gte('created_at', dayStart)
  ]);
  const newToday = created.count ?? 0;

  const o = todayOrders ?? [];
  const delivered = o.filter((x) => x.status === 'delivered').length;
  const problems = o.filter((x) => ['failed_attempt', 'rescheduled'].includes(x.status)).length;
  const onRoute = o.filter((x) => ['assigned', 'out_for_delivery'].includes(x.status)).length;
  const codCollected = (cod ?? []).reduce((s, c) => s + Number(c.amount), 0);
  const codWithDrivers = (cod ?? []).filter((c) => !c.handover_id).reduce((s, c) => s + Number(c.amount), 0);

  const steps = [
    { done: (m.count ?? 0) > 0, title: 'Add your first merchant', body: 'The shops you deliver for, with their prices.', href: '/merchants', icon: 'store' as IconName },
    { done: (v.count ?? 0) > 0, title: 'Add a vehicle', body: 'Plate, capacity and fuel use.', href: '/fleet', icon: 'truck' as IconName },
    { done: (d.count ?? 0) > 0, title: 'Add a driver', body: 'Then invite them to the driver app.', href: '/fleet', icon: 'users' as IconName },
    { done: (mem.count ?? 0) > 1, title: 'Invite your team', body: 'Dispatcher, warehouse, finance…', href: '/team', icon: 'team' as IconName },
    { done: (all.count ?? 0) > 0, title: 'Create the first order', body: 'Or let a merchant import a CSV.', href: '/orders/new', icon: 'package' as IconName },
    { done: (routes ?? []).length > 0, title: 'Plan and publish a route', body: 'Drivers see it in their app instantly.', href: '/dispatch', icon: 'route' as IconName }
  ];
  const doneSteps = steps.filter((s) => s.done).length;

  const days = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 86400_000).toLocaleDateString('en-CA', { timeZone: 'Europe/Belgrade' }));
  const bars = days.map((day) => { const rows = (week ?? []).filter((w) => w.delivery_date === day); const ok = rows.filter((r) => r.status === 'delivered').length; return { day, ok, bad: rows.length - ok }; });
  const max = Math.max(5, ...bars.map((b) => b.ok + b.bad));

  const routeRows = ((routes ?? []) as any[]).map((r) => {
    const stops = r.stops ?? [];
    const done = stops.filter((s: any) => ['delivered', 'failed', 'skipped'].includes(s.status)).length;
    const lastEta = stops.map((s: any) => s.eta).filter(Boolean).sort().pop();
    return { ...r, done, total: stops.length, pct: stops.length ? Math.round((done / stops.length) * 100) : 0, lastEta };
  });
  const hour = Number(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', timeZone: 'Europe/Belgrade' }));
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHeader title={`${greet}, ${ws.fullName.split(' ')[0]}`} subtitle={`${dateLong()} · ${routeRows.length} routes · ${newToday} new orders · ${o.length} due today`}>
        <Link href="/dispatch" className="btn-ghost">Open dispatch</Link>
      </PageHeader>

      {doneSteps < steps.length && (
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 px-5 pb-3 pt-5">
            <div className="flex flex-1 flex-col gap-1"><span className="eyebrow">Get started</span><h2 className="text-[17px] font-semibold tracking-[-0.3px]">Set up {ws.org.name} in six steps</h2></div>
            <span className="text-[13px] text-ink-3">{doneSteps} of {steps.length} done</span>
            <span className="h-1.5 w-40 overflow-hidden rounded-full bg-ink/[.06]"><span className="block h-full rounded-full bg-brand" style={{ width: `${(doneSteps / steps.length) * 100}%` }} /></span>
          </div>
          <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
            {steps.map((s, i) => (
              <Link key={s.title} href={s.href} className={`group flex items-start gap-3 rounded-2xl p-3.5 transition ${s.done ? 'opacity-60' : 'bg-white/50 hover:bg-white/90'}`}>
                <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-xl ${s.done ? 'bg-success text-white' : 'bg-ink text-lime'}`}><Icon name={s.done ? 'check' : s.icon} size={15} color="currentColor" strokeWidth={s.done ? 2.4 : 1.75} /></span>
                <span className="flex flex-1 flex-col"><span className={`text-[13.5px] font-medium ${s.done ? 'line-through' : ''}`}>{i + 1}. {s.title}</span><span className="text-[12.5px] text-ink-3">{s.body}</span></span>
                {!s.done && <Icon name="chevronRight" size={15} color="#9AA3BC" className="mt-2 transition group-hover:translate-x-0.5" />}
              </Link>
            ))}
          </div>
        </section>
      )}

      <StatStrip items={[
        { label: 'New orders today', value: String(newToday), note: `${o.length} due for delivery today · ${onRoute} on the road`, tone: 'brand' },
        { label: 'Delivered', value: String(delivered), note: o.length ? `${Math.round((delivered / o.length) * 100)}% of today's deliveries` : 'Nothing due today yet', tone: 'success' },
        { label: 'Problems', value: String(problems), note: problems ? 'Waiting in Helpdesk' : 'All clear', tone: 'warning' },
        { label: 'Cash collected', value: euro(codCollected, 0), note: `${euro(codWithDrivers, 0)} still with drivers`, tone: 'info' }
      ]} />

      <div className="grid items-start gap-5 xl:grid-cols-3">
        <section className="card flex flex-col gap-4 p-5 xl:col-span-2">
          <SectionTitle title="Live routes" action={<Link href="/dispatch" className="link text-[13px]">Dispatch →</Link>} />
          {routeRows.length === 0 && <Empty icon="route" title="No routes today" body="Add orders, then create and publish routes in Dispatch." action={<Link href="/dispatch" className="btn-primary mt-2">Plan routes</Link>} />}
          <div className="flex flex-col gap-1">
            {routeRows.map((r) => (
              <Link key={r.id} href={`/dispatch/${r.id}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/50">
                <Avatar name={r.driver?.full_name} bg={`${r.color ?? '#5B5CF6'}22`} ink={r.color ?? '#5B5CF6'} />
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className="flex items-center gap-2 text-[13.5px]"><span className="font-medium">{r.driver?.full_name ?? 'No driver'}</span><span className="font-mono text-[12px] text-ink-3">{r.code}</span></span>
                  <span className="flex h-1.5 overflow-hidden rounded-full bg-ink/[.06]"><span className="rounded-full" style={{ width: `${r.pct}%`, background: r.color ?? '#5B5CF6' }} /></span>
                </span>
                <span className="flex flex-col items-end text-[12.5px]"><span className="font-mono font-medium">{r.done}/{r.total}</span><span className="text-ink-3">{r.pct === 100 ? 'done' : `ends ${time(r.lastEta)}`}</span></span>
              </Link>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <section className="card flex flex-col gap-3 p-5">
            <SectionTitle title="Needs attention" action={<Link href="/helpdesk" className="link text-[13px]">Helpdesk →</Link>} />
            {(tickets ?? []).length === 0 && <p className="py-4 text-center text-[13px] text-ink-3">Nothing waiting. 👌</p>}
            {(tickets ?? []).map((t) => (
              <Link key={t.id} href="/helpdesk" className="flex gap-3 rounded-xl p-2 hover:bg-white/50">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-warning-tint"><Icon name={TICKET_ICON[t.type] ?? 'alert'} size={15} color="#B54708" /></span>
                <span className="flex min-w-0 flex-col"><span className="truncate text-[13px] font-medium">{t.title}</span><span className="truncate text-[12px] text-ink-3">{TICKET_TYPE[t.type as TicketType]} · {t.description}</span></span>
              </Link>
            ))}
          </section>
          <section className="card flex flex-col gap-2 p-5">
            <SectionTitle title="Up next" />
            <Link href="/dispatch" className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5 text-[13px] hover:bg-white/80"><span>Orders waiting for a route</span><span className="font-mono font-semibold">{waiting.count ?? 0}</span></Link>
            <Link href="/cash-check-in" className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5 text-[13px] hover:bg-white/80"><span>Cash still with drivers</span><span className="font-mono font-semibold">{euro(codWithDrivers, 0)}</span></Link>
          </section>
        </div>
      </div>

      <Accordion title="Last 7 days" icon="chart" meta={`${bars.reduce((s, b) => s + b.ok, 0)} delivered · ${bars.reduce((s, b) => s + b.bad, 0)} not delivered`}>
        <div className="grid h-[200px] grid-cols-7 items-end gap-4 px-6 pb-2 pt-6">
          {bars.map((b, i) => (
            <div key={b.day} className="flex h-full flex-col items-center justify-end gap-1">
              <span className="font-mono text-[11px] text-ink-3">{b.ok + b.bad || ''}</span>
              <div className="flex w-full max-w-10 flex-col gap-0.5">
                {b.bad > 0 && <span className="rounded-t-md bg-warning/80" style={{ height: Math.round((b.bad / max) * 140) + 2 }} />}
                <span className={b.bad ? 'rounded-b-md' : 'rounded-md'} style={{ height: Math.max(2, Math.round((b.ok / max) * 140)), background: i === 6 ? '#0E1325' : '#5B5CF6' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-4 px-6 pb-5">{bars.map((b, i) => <span key={b.day} className="text-center text-[11.5px] text-ink-3">{i === 6 ? 'Today' : new Date(b.day).toLocaleDateString('en-GB', { weekday: 'short' })}</span>)}</div>
      </Accordion>
    </>
  );
}
