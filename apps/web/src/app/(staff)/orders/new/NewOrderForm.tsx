'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { euro } from '@routa/shared';

type Props = { orgId: string; merchants: { id: string; name: string; code: string }[]; zones: { name: string; base_fee: number; sla: string | null; color: string | null }[] };

export function NewOrderForm({ orgId, merchants, zones }: Props) {
  const router = useRouter();
  const [f, setF] = useState({
    merchant_id: merchants[0]?.id ?? '', customer_name: '', customer_phone: '+383 ', address_line: '', city: 'Prishtinë', landmark: '',
    floor: '', apartment: '', lat: '', lng: '', weight_kg: '1', parcels: '1', cod_amount: '0', notes_driver: '', fee_payer: 'merchant'
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const hasPin = f.lat.trim() !== '' && f.lng.trim() !== '';
    const { data, error } = await createClient().from('orders').insert({
      org_id: orgId,
      merchant_id: f.merchant_id || null,
      source: 'front_desk',
      customer_name: f.customer_name.trim(),
      customer_phone: f.customer_phone.replace(/\s/g, ''),
      address_line: f.address_line.trim(),
      address_raw: [f.address_line, f.landmark, f.city].filter(Boolean).join(', '),
      city: f.city,
      landmark: f.landmark || null,
      address_details: { floor: f.floor || null, apartment: f.apartment || null },
      location: hasPin ? `SRID=4326;POINT(${Number(f.lng)} ${Number(f.lat)})` : null,
      geocode_confidence: hasPin ? 1 : null,
      weight_kg: Number(f.weight_kg) || null,
      parcels: Number(f.parcels) || 1,
      cod_amount: Number(f.cod_amount) || 0,
      fee_payer: f.fee_payer,
      notes_driver: f.notes_driver || null
    }).select('id').single();
    setBusy(false);
    if (error) return setError(error.message);
    router.push(`/orders/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-base font-semibold sm:col-span-2">Customer</h2>
          <label className="label">Full name<input className="input" required value={f.customer_name} onChange={set('customer_name')} placeholder="Liridona Berisha" /></label>
          <label className="label">Phone<input className="input" required value={f.customer_phone} onChange={set('customer_phone')} /></label>
          <label className="label sm:col-span-2">Merchant / sender
            <select className="input" value={f.merchant_id} onChange={set('merchant_id')}>
              <option value="">Walk-in customer (no merchant)</option>
              {merchants.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.code}</option>)}
            </select>
          </label>
        </section>
        <section className="card grid gap-4 p-5 sm:grid-cols-4">
          <h2 className="text-base font-semibold sm:col-span-4">Address</h2>
          <label className="label sm:col-span-3">Street and number<input className="input" required value={f.address_line} onChange={set('address_line')} placeholder="Rr. Agim Ramadani 14" /></label>
          <label className="label">City<input className="input" value={f.city} onChange={set('city')} /></label>
          <label className="label sm:col-span-2">Landmark (optional)<input className="input" value={f.landmark} onChange={set('landmark')} placeholder="afër shkollës Faik Konica" /></label>
          <label className="label">Floor<input className="input" value={f.floor} onChange={set('floor')} /></label>
          <label className="label">Apartment<input className="input" value={f.apartment} onChange={set('apartment')} /></label>
          <label className="label sm:col-span-2">Latitude<input className="input font-mono" value={f.lat} onChange={set('lat')} placeholder="42.6629" /></label>
          <label className="label sm:col-span-2">Longitude<input className="input font-mono" value={f.lng} onChange={set('lng')} placeholder="21.1655" /></label>
          <p className="text-xs text-ink-3 sm:col-span-4">No pin? Leave the coordinates empty — the order is flagged “Needs map pin” and Helpdesk fixes it before dispatch. Automatic address lookup arrives in Stage 3.</p>
        </section>
      </div>
      <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
        <section className="card grid grid-cols-2 gap-4 p-5">
          <h2 className="col-span-2 text-base font-semibold">Parcel & payment</h2>
          <label className="label">Weight (kg)<input className="input" type="number" step="0.1" min="0" value={f.weight_kg} onChange={set('weight_kg')} /></label>
          <label className="label">Parcels<input className="input" type="number" min="1" value={f.parcels} onChange={set('parcels')} /></label>
          <label className="label">Cash on delivery (€)<input className="input" type="number" step="0.01" min="0" value={f.cod_amount} onChange={set('cod_amount')} /></label>
          <label className="label">Fees paid by
            <select className="input" value={f.fee_payer} onChange={set('fee_payer')}><option value="merchant">Merchant</option><option value="customer">Customer</option></select>
          </label>
          <label className="label col-span-2">Note for the driver<textarea className="input min-h-16" value={f.notes_driver} onChange={set('notes_driver')} placeholder="Call before arriving" /></label>
        </section>
        <section className="card flex flex-col gap-2 p-5 text-[13px]">
          <h2 className="text-base font-semibold">Zone prices</h2>
          {zones.map((z) => (
            <span key={z.name} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-ink-2"><span className="h-2 w-2 rounded-sm" style={{ background: z.color ?? '#5B5CF6' }} />{z.name}</span>
              <span className="font-mono">{euro(z.base_fee)}</span>
            </span>
          ))}
          <span className="text-xs text-ink-3">Merchant contract prices override these. Weight above 2 kg and COD fees are added on save.</span>
        </section>
        {error && <p className="rounded-[10px] bg-danger-tint px-3 py-2 text-[13px] text-danger-ink">{error}</p>}
        <button disabled={busy} className="btn-primary py-3">{busy ? 'Saving…' : 'Create order'}</button>
      </aside>
    </form>
  );
}
