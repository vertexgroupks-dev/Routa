'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function MerchantNewOrder({ orgId, merchantId, open: initial }: { orgId: string; merchantId: string; open: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(initial);
  const [f, setF] = useState({ customer_name: '', customer_phone: '+383 ', address_line: '', city: 'Prishtinë', cod_amount: '0', weight_kg: '1', merchant_ref: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { data, error } = await createClient().from('orders').insert({
      org_id: orgId, merchant_id: merchantId, source: 'manual', customer_name: f.customer_name, customer_phone: f.customer_phone.replace(/\s/g, ''),
      address_line: f.address_line, address_raw: `${f.address_line}, ${f.city}`, city: f.city, cod_amount: Number(f.cod_amount) || 0,
      weight_kg: Number(f.weight_kg) || null, merchant_ref: f.merchant_ref || null
    }).select('code, delivery_fee, weight_fee, cod_fee').single();
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    const fees = Number(data.delivery_fee ?? 0) + Number(data.weight_fee ?? 0) + Number(data.cod_fee ?? 0);
    setMsg({ ok: true, text: `Order ${data.code} created · fees €${fees.toFixed(2)}. The courier will place it on the map before dispatch.` });
    setF({ ...f, customer_name: '', customer_phone: '+383 ', address_line: '', cod_amount: '0', merchant_ref: '' });
    router.refresh();
  }

  if (!open) return <button onClick={() => setOpen(true)} className="btn-primary self-start">+ New order</button>;
  return (
    <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-4">
      <label className="label sm:col-span-2">Customer name<input className="input" required value={f.customer_name} onChange={set('customer_name')} /></label>
      <label className="label">Phone<input className="input" required value={f.customer_phone} onChange={set('customer_phone')} /></label>
      <label className="label">Your order ref<input className="input" value={f.merchant_ref} onChange={set('merchant_ref')} placeholder="#1042" /></label>
      <label className="label sm:col-span-2">Address<input className="input" required value={f.address_line} onChange={set('address_line')} /></label>
      <label className="label">City<input className="input" value={f.city} onChange={set('city')} /></label>
      <span className="grid grid-cols-2 gap-2">
        <label className="label">COD €<input className="input" type="number" step="0.01" value={f.cod_amount} onChange={set('cod_amount')} /></label>
        <label className="label">kg<input className="input" type="number" step="0.1" value={f.weight_kg} onChange={set('weight_kg')} /></label>
      </span>
      {msg && <p className={`rounded-[10px] px-3 py-2 text-[13px] sm:col-span-4 ${msg.ok ? 'bg-success-tint text-success-ink' : 'bg-danger-tint text-danger-ink'}`}>{msg.text}</p>}
      <span className="flex gap-2 sm:col-span-4"><button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Create order'}</button><button type="button" onClick={() => setOpen(false)} className="btn-ghost">Close</button></span>
    </form>
  );
}
