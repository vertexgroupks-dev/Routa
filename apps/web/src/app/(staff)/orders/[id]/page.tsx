import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { StatusPill, Avatar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ORDER_STATUS, euro, phonePretty, time, type OrderStatus } from '@routa/shared';
import { OrderActions } from './OrderActions';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = await requireStaff();
  const supabase = await createClient();
  const { data: o } = await supabase
    .from('orders')
    .select('*, merchant:merchants(name, code, phone), zone:zones(name, color), items:order_items(*), events:order_events(id, type, from_status, to_status, note, internal, created_at), stop:route_stops(sequence, status, eta, route:routes(code, driver:drivers(full_name, phone))), pod:pods(recipient_type, recipient_name, distance_to_address_m, review_status, delivered_at), attempts_list:delivery_attempts(reason, note, attempted_at)')
    .eq('id', id)
    .maybeSingle();
  if (!o) notFound();

  const events = [...(o.events ?? [])].sort((a: any, b: any) => a.created_at.localeCompare(b.created_at));
  const stop = (o.stop ?? [])[0] as any;
  const pod = (o.pod ?? [])[0] as any;
  const d = (o.address_details ?? {}) as Record<string, unknown>;
  const fees = Number(o.delivery_fee ?? 0) + Number(o.weight_fee ?? 0) + Number(o.cod_fee ?? 0);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/orders" className="btn-ghost px-2.5"><Icon name="arrowLeft" size={16} /></Link>
        <h1 className="font-mono text-2xl font-semibold tracking-[-0.6px]">{o.code}</h1>
        <StatusPill status={o.status as OrderStatus} />
        {o.needs_pin && <span className="rounded-full bg-danger-tint px-2.5 py-0.5 text-xs font-medium text-danger-ink">Needs map pin</span>}
        <span className="flex-1" />
        <Link href={`/t/${o.tracking_code}`} target="_blank" className="btn-ghost">Customer tracking page ↗</Link>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
          <section className="card grid gap-5 p-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-3">CUSTOMER</span>
              <span className="text-[15px] font-semibold">{o.customer_name}</span>
              <a href={`tel:${o.customer_phone}`} className="link text-sm">{phonePretty(o.customer_phone)}</a>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-3">ADDRESS</span>
              <span className="text-sm font-medium">{o.address_line}, {o.city}</span>
              <span className="text-[13px] text-ink-2">{[d.floor != null && `Floor ${d.floor}`, d.apartment != null && `Ap. ${d.apartment}`, o.landmark].filter(Boolean).join(' · ') || '—'}</span>
              {o.zone && <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-2"><span className="h-2 w-2 rounded-sm" style={{ background: o.zone.color }} />{o.zone.name}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-3">MERCHANT</span>
              <span className="text-sm font-medium">{o.merchant?.name ?? 'Walk-in'}</span>
              <span className="text-[13px] text-ink-2">Ref {o.merchant_ref ?? '—'} · via {o.source}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-3">DELIVERY</span>
              <span className="text-sm font-medium">{o.delivery_date ?? 'Not scheduled'}{o.window_start ? ` · ${o.window_start.slice(0, 5)}–${o.window_end?.slice(0, 5)}` : ''}</span>
              <span className="text-[13px] text-ink-2">{o.weight_kg ?? '—'} kg · {o.parcels ?? 1} parcel(s) · attempt {o.attempts}</span>
            </div>
            {o.notes_driver && <div className="rounded-[10px] bg-warning-tint px-3 py-2 text-[13px] text-warning-ink sm:col-span-2">Note for driver: {o.notes_driver}</div>}
          </section>

          <section className="card flex flex-col gap-4 p-5">
            <h2 className="text-base font-semibold">Timeline</h2>
            <ol className="flex flex-col gap-0">
              {events.map((e: any, i: number) => {
                const s = e.to_status ? ORDER_STATUS[e.to_status as OrderStatus] : null;
                return (
                  <li key={e.id} className="flex gap-3">
                    <span className="flex flex-col items-center">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: s?.dot ?? '#9AA3BC' }} />
                      {i < events.length - 1 && <span className="w-px flex-1 bg-line" />}
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5 pb-4">
                      <span className="text-[13px] font-medium">{s ? s.label : e.type === 'note' ? 'Note' : e.type}{e.internal && <span className="ml-2 text-xs text-ink-3">internal</span>}</span>
                      {e.note && <span className="text-[13px] text-ink-2">{e.note}</span>}
                      <span className="font-mono text-xs text-ink-3">{new Date(e.created_at).toLocaleString('en-GB', { timeZone: 'Europe/Belgrade' })}</span>
                    </span>
                  </li>
                );
              })}
              {events.length === 0 && <li className="text-[13px] text-ink-3">No events yet.</li>}
            </ol>
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <section className="card flex flex-col gap-3 p-5 text-[13px]">
            <h2 className="text-base font-semibold">Money</h2>
            <Row k="Cash on delivery" v={Number(o.cod_amount) > 0 ? euro(o.cod_amount) : 'Prepaid'} />
            <Row k="COD status" v={o.cod_status} />
            <Row k="Delivery fee" v={euro(o.delivery_fee)} />
            <Row k="Weight fee" v={euro(o.weight_fee)} />
            <Row k="COD fee" v={euro(o.cod_fee)} />
            <div className="border-t border-line pt-2"><Row k={`Total fees · paid by ${o.fee_payer ?? 'merchant'}`} v={euro(fees)} bold /></div>
          </section>

          <section className="card flex flex-col gap-3 p-5 text-[13px]">
            <h2 className="text-base font-semibold">Route & driver</h2>
            {stop ? (
              <div className="flex items-center gap-2.5">
                <Avatar name={stop.route?.driver?.full_name} />
                <span className="flex flex-1 flex-col">
                  <span className="font-medium">{stop.route?.driver?.full_name ?? '—'}</span>
                  <span className="text-xs text-ink-3">{stop.route?.code} · stop {stop.sequence} · ETA {time(stop.eta)}</span>
                </span>
              </div>
            ) : <span className="text-ink-3">Not on a route yet.</span>}
            {pod && <div className="rounded-[10px] bg-success-tint px-3 py-2 text-success-ink">Delivered to {pod.recipient_name} ({pod.recipient_type}) · {pod.distance_to_address_m ?? '?'} m from address · {pod.review_status}</div>}
            {(o.attempts_list ?? []).map((a: any, i: number) => <div key={i} className="rounded-[10px] bg-warning-tint px-3 py-2 text-warning-ink">Failed: {a.reason.replace(/_/g, ' ')} · {a.note}</div>)}
          </section>

          <OrderActions orderId={o.id} orgId={ws.org.id} userId={ws.userId} status={o.status as OrderStatus} />
        </aside>
      </div>
    </>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <span className={`flex justify-between ${bold ? 'font-semibold' : ''}`}><span className={bold ? '' : 'text-ink-3'}>{k}</span><span className="font-mono">{v}</span></span>;
}
