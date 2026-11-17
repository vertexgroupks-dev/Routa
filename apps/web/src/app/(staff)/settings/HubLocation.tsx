'use client';
// Where the vans start and end every route. Click the map or drag the pin, then save.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapView, type Pt } from '@/components/MapView';

export function HubLocation({ hubId, name, address, point }: { hubId: string; name: string; address: string | null; point: Pt | null }) {
  const router = useRouter();
  const [pin, setPin] = useState<Pt | null>(point);
  const [addr, setAddr] = useState(address ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function save() {
    if (!pin) return;
    setBusy(true); setMsg(null);
    const { error } = await createClient().rpc('set_hub_location', { p_hub: hubId, p_lat: pin.lat, p_lng: pin.lng, p_address: addr || null });
    setBusy(false);
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Hub location saved. New route plans start and end here.' });
    if (!error) router.refresh();
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-ink-2"><b>{name}</b> — every route starts and ends here. Click the map or drag the pin to the warehouse entrance.</p>
      <MapView height={300} pin={pin} center={pin ?? undefined} onPick={setPin} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="label min-w-[240px] flex-1">Address<input className="input" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Street, city" /></label>
        <button className="btn-dark" disabled={busy || !pin} onClick={save}>{busy ? 'Saving…' : 'Save hub location'}</button>
      </div>
      {msg && <p className={`rounded-xl px-3 py-2 text-[13px] ${msg.ok ? 'bg-success-tint text-success-ink' : 'bg-danger-tint text-danger-ink'}`}>{msg.text}</p>}
    </div>
  );
}
