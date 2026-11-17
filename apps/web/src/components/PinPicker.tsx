'use client';
// Put an address on the map: "Find on map" looks it up (remembered addresses → known neighbourhoods →
// OpenStreetMap), or the user clicks / drags the pin. With orderId it saves straight to the order.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MapView, type Pt } from './MapView';

type Addr = { address_line?: string; city?: string; landmark?: string; phone?: string };
type Props = {
  orgId: string;
  address: Addr;
  value?: Pt | null;
  onChange?: (p: Pt | null, confidence: number) => void;
  orderId?: string;          // edit mode: saves to this order
  hub?: Pt | null;
  height?: number;
};

export function PinPicker({ orgId, address, value = null, onChange, orderId, hub, height = 300 }: Props) {
  const router = useRouter();
  const [pin, setPin] = useState<Pt | null>(value);
  const [conf, setConf] = useState(1);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{ lat: number; lng: number; label: string }[]>([]);

  useEffect(() => { setPin(value); }, [value?.lat, value?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (p: Pt | null, c: number, manual: boolean) => { setPin(p); setConf(c); setDirty(manual); onChange?.(p, c); };

  async function find() {
    setBusy(true); setNote(null); setResults([]);
    const { data, error } = await createClient().functions.invoke('geocode', { body: { org_id: orgId, ...address, order_id: orderId } });
    setBusy(false);
    if (error || data?.error) return setNote('Lookup failed. Click on the map to place the pin.');
    if (!data?.found) return setNote('Not found. Type a nearby place in the search box, or click on the map.');
    set({ lat: data.lat, lng: data.lng }, data.confidence, false);
    setNote(`${data.source === 'remembered' ? 'Remembered from an earlier order' : data.label?.split(',').slice(0, 3).join(',')}${data.confidence < 0.9 ? ' · approximate — drag the pin to the exact door if you know it' : ''}`);
    if (orderId && data.saved) router.refresh();
  }

  async function search() {
    if (!q.trim()) return;
    setBusy(true);
    const { data } = await createClient().functions.invoke('geocode', { body: { org_id: orgId, query: q } });
    setBusy(false);
    setResults(data?.results ?? []);
    if (!data?.results?.length) setNote('Nothing found for that search.');
  }

  async function save() {
    if (!orderId || !pin) return;
    setBusy(true);
    const { data, error } = await createClient().rpc('set_order_pin', { p_order: orderId, p_lat: pin.lat, p_lng: pin.lng, p_confidence: dirty ? 1 : conf, p_remember: true });
    setBusy(false);
    if (error) return setNote(error.message);
    setDirty(false);
    setNote(data?.zone ? `Saved · zone ${data.zone}` : 'Saved · outside your delivery zones');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy} onClick={find} className="btn-dark">{busy ? 'Looking…' : 'Find on map'}</button>
        <span className="flex min-w-[220px] flex-1 gap-2">
          <input className="input py-2" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} placeholder="Or search a place: school, shop, street… (Enter)" />
        </span>
        {orderId && pin && dirty && <button type="button" disabled={busy} onClick={save} className="btn-brand">Save pin</button>}
      </div>
      {results.length > 0 && (
        <div className="flex flex-col overflow-hidden rounded-xl border border-white/80 bg-white/70 text-[13px]">
          {results.map((r, i) => (
            <button type="button" key={i} onClick={() => { set({ lat: r.lat, lng: r.lng }, 0.9, true); setResults([]); setNote(r.label.split(',').slice(0, 3).join(',')); }} className="px-3 py-2 text-left hover:bg-white">{r.label}</button>
          ))}
        </div>
      )}
      <MapView height={height} pin={pin} center={pin ?? hub ?? undefined} onPick={(p) => set(p, 1, true)}
        markers={hub ? [{ ...hub, kind: 'hub', title: 'Your hub' }] : []} />
      <p className="text-xs text-ink-3">{note ?? (pin ? 'Drag the pin or click the map to adjust.' : 'Press “Find on map”, or click on the map where the customer is.')}</p>
    </div>
  );
}
