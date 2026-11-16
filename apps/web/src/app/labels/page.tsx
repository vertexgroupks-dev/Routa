import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Barcode } from '@/components/Barcode';
import { PrintButton } from './PrintButton';
import { euro, phonePretty } from '@routa/shared';

export const metadata = { title: 'Parcel labels' };

// Printable 10×15 cm labels. /labels?ids=a,b,c  or  /labels?date=2026-11-17
export default async function Labels({ searchParams }: { searchParams: Promise<{ ids?: string; date?: string }> }) {
  const sp = await searchParams;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  let q = sb.from('orders').select('id, code, tracking_code, customer_name, customer_phone, address_line, city, landmark, address_details, cod_amount, weight_kg, parcels, delivery_date, notes_driver, merchant:merchants(name), zone:zones(name), stop:route_stops(sequence, route:routes(code))').order('code').limit(300);
  if (sp.ids) q = q.in('id', sp.ids.split(','));
  else if (sp.date) q = q.eq('delivery_date', sp.date).not('status', 'in', '(cancelled,delivered,returned_to_merchant)');
  else q = q.eq('id', '00000000-0000-0000-0000-000000000000');
  const { data } = await q;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://routalogistics.netlify.app';
  return (
    <>
      <style>{`@page { size: 100mm 150mm; margin: 0 } @media print { .noprint { display: none } body { background: #fff } } .label { width: 100mm; height: 150mm; page-break-after: always; }`}</style>
      <div className="noprint flex items-center gap-3 border-b border-line bg-white p-4 text-sm"><b>{data?.length ?? 0} labels</b><span className="text-ink-3">10 × 15 cm · choose your label printer and “Actual size”</span><span className="flex-1" /><PrintButton /></div>
      <div className="flex flex-wrap gap-4 bg-canvas p-4 print:block print:bg-white print:p-0">
        {((data ?? []) as any[]).map((o) => {
          const d = (o.address_details ?? {}) as Record<string, unknown>;
          const stop = (o.stop ?? [])[0];
          return (
            <div key={o.id} className="label flex flex-col gap-2 overflow-hidden border border-black bg-white p-[5mm] text-black print:border-0">
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5"><b className="text-lg">ROUTA</b><span className="text-right text-xs">{o.merchant?.name ?? 'Walk-in'}<br />{o.delivery_date}</span></div>
              <div className="flex items-end justify-between"><span className="font-mono text-2xl font-bold">{o.code}</span>{stop && <span className="rounded bg-black px-2 py-1 font-mono text-lg font-bold text-white">{stop.route?.code} · {stop.sequence}</span>}</div>
              <Barcode value={o.code} className="h-[18mm] w-full" />
              <div className="flex flex-col border-y border-black py-2">
                <span className="text-[10px] uppercase">Për / To</span>
                <span className="text-lg font-bold leading-6">{o.customer_name}</span>
                <span className="text-sm">{phonePretty(o.customer_phone)}</span>
                <span className="text-sm font-semibold">{o.address_line}{o.city ? `, ${o.city}` : ''}</span>
                <span className="text-xs">{[d.floor != null && d.floor !== null ? `Kati ${d.floor}` : null, d.apartment ? `Banesa ${d.apartment}` : null, o.landmark].filter(Boolean).join(' · ')}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center text-xs">
                <span className="border border-black p-1">Zona<br /><b>{o.zone?.name ?? '—'}</b></span>
                <span className="border border-black p-1">Pesha<br /><b>{o.weight_kg ?? '—'} kg</b></span>
                <span className="border border-black p-1">Pako<br /><b>{o.parcels ?? 1}</b></span>
              </div>
              <div className={`p-2 text-center ${Number(o.cod_amount) > 0 ? 'bg-black text-white' : 'border border-black'}`}>
                <span className="text-xs">{Number(o.cod_amount) > 0 ? 'PAGESË NË DORËZIM / COD' : 'E PAGUAR / PREPAID'}</span><br />
                <b className="text-2xl">{Number(o.cod_amount) > 0 ? euro(o.cod_amount) : '€0.00'}</b>
              </div>
              {o.notes_driver && <span className="text-xs">Shënim: {o.notes_driver}</span>}
              <span className="mt-auto text-[10px]">Gjurmo: {site.replace(/^https?:\/\//, '')}/t/{o.tracking_code}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
