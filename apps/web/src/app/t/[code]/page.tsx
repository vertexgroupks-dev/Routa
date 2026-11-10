import { createClient } from '@/lib/supabase/server';
import { LogoMark } from '@/components/Logo';
import { Icon } from '@/components/Icon';
import { ORDER_STATUS, euro, time, type OrderStatus } from '@routa/shared';
import { AutoRefresh } from './AutoRefresh';

export const metadata = { title: 'Track your parcel' };
export const dynamic = 'force-dynamic';

const STEPS: { key: OrderStatus[]; label: string }[] = [
  { key: ['confirmed'], label: 'Order received' },
  { key: ['received', 'packed', 'assigned'], label: 'At the courier' },
  { key: ['out_for_delivery', 'failed_attempt', 'rescheduled'], label: 'On the way' },
  { key: ['delivered'], label: 'Delivered' }
];

export default async function TrackPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc('track_lookup', { p_code: code });
  const t = (data ?? { found: false }) as any;

  if (!t.found) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[440px] flex-col items-center justify-center gap-3 p-6 text-center">
        <LogoMark dark size={40} />
        <h1 className="text-xl font-semibold">We couldn’t find that parcel</h1>
        <p className="text-sm text-ink-2">Check the link in your SMS, or contact the shop you ordered from.</p>
      </main>
    );
  }
  const status = t.status as OrderStatus;
  const stepIdx = Math.max(0, STEPS.findIndex((s) => s.key.includes(status)));
  const s = ORDER_STATUS[status];
  const map = t.destination ? `https://www.openstreetmap.org/?mlat=${t.destination.lat}&mlon=${t.destination.lng}#map=16/${t.destination.lat}/${t.destination.lng}` : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-[440px] flex-col gap-4 bg-canvas p-4">
      <AutoRefresh seconds={30} />
      <header className="flex items-center gap-2.5 pt-2">
        <LogoMark dark />
        <span className="flex flex-1 flex-col"><span className="text-sm font-semibold">{t.company}</span><span className="text-xs text-ink-3">Parcel from {t.merchant ?? 'a shop'} · {t.code}</span></span>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl bg-night p-5 text-white">
        <span className="font-mono text-xs tracking-[.6px] text-lime">{s.labelSq.toUpperCase()} · {s.label.toUpperCase()}</span>
        {status === 'delivered' ? (
          <h1 className="text-[26px] font-semibold leading-8 tracking-[-0.6px]">Delivered at {time(t.delivered_at)}</h1>
        ) : status === 'out_for_delivery' ? (
          <h1 className="text-[26px] font-semibold leading-8 tracking-[-0.6px]">Arriving around {time(t.eta)}</h1>
        ) : (
          <h1 className="text-[26px] font-semibold leading-8 tracking-[-0.6px]">Delivery on {t.delivery_date ?? 'a date to be confirmed'}</h1>
        )}
        {status === 'out_for_delivery' && t.stops_ahead != null && <p className="text-sm text-muted">{t.stops_ahead === 0 ? 'You are the next stop.' : `${t.stops_ahead} stops before yours.`}</p>}
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {STEPS.map((st, i) => <span key={st.label} className={`h-1.5 rounded-full ${i <= stepIdx ? 'bg-lime' : 'bg-night-line'}`} />)}
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-[11px] text-muted">{STEPS.map((st) => <span key={st.label}>{st.label}</span>)}</div>
      </section>

      {t.driver && status === 'out_for_delivery' && (
        <section className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-deep">{String(t.driver.first_name ?? '?')[0]}</span>
          <span className="flex flex-1 flex-col"><span className="text-sm font-medium">{t.driver.first_name} is bringing your parcel</span><span className="text-xs text-ink-3">{t.driver.vehicle} · ★ {t.driver.rating}</span></span>
        </section>
      )}

      <section className="card flex flex-col gap-3 p-4 text-sm">
        <span className="flex items-start gap-3"><Icon name="pin" color="#5B6378" /><span className="flex flex-1 flex-col"><span className="font-medium">{t.address}</span>{map && <a href={map} target="_blank" className="link text-[13px]">Check the pin on the map ↗</a>}</span></span>
        {t.cod_open && Number(t.cod_amount) > 0 && (
          <span className="flex items-center gap-3 rounded-[10px] bg-warning-tint px-3 py-2.5 text-warning-ink"><Icon name="banknote" color="#B54708" /><span>Please have <b>{euro(t.cod_amount)}</b> ready — cash or card.</span></span>
        )}
      </section>

      {(t.events ?? []).length > 0 && (
        <section className="card flex flex-col gap-2 p-4 text-[13px]">
          {(t.events as { at: string; status: OrderStatus }[]).slice().reverse().map((e, i) => (
            <span key={i} className="flex justify-between"><span>{ORDER_STATUS[e.status]?.label ?? e.status}</span><span className="font-mono text-ink-3">{new Date(e.at).toLocaleString('en-GB', { timeZone: 'Europe/Belgrade', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></span>
          ))}
        </section>
      )}
      <p className="pb-4 text-center text-xs text-ink-3">Powered by Routa · this page updates by itself</p>
    </main>
  );
}
