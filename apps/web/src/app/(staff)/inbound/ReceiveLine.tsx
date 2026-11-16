'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAction } from '@/components/useAction';

export function ReceiveLine({ id, expected, received, damaged, bin, bins }: { id: string; expected: number; received: number; damaged: number; bin: string | null; bins: { id: string; code: string }[] }) {
  const a = useAction();
  const [r, setR] = useState(String(received || expected));
  const [d, setD] = useState(String(damaged || 0));
  const [b, setB] = useState(bin ?? bins[0]?.id ?? '');
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
      <input className="input w-16 py-1 text-right font-mono text-xs" value={r} onChange={(e) => setR(e.target.value)} title="Received" />
      <input className="input w-14 py-1 text-right font-mono text-xs" value={d} onChange={(e) => setD(e.target.value)} title="Damaged" />
      <select className="input w-auto py-1 font-mono text-xs" value={b} onChange={(e) => setB(e.target.value)}>{bins.map((x) => <option key={x.id} value={x.id}>{x.code}</option>)}</select>
      <button disabled={a.busy} className="btn-primary px-2.5 py-1 text-xs" onClick={() => a.run(() => createClient().rpc('receive_inbound_line', { p_line: id, p_received: Number(r), p_damaged: Number(d), p_bin: b || null }))}>Save</button>
      {a.error && <span className="w-full text-right text-xs text-danger-ink">{a.error}</span>}
    </span>
  );
}

export function AdjustStock({ id }: { id: string }) {
  const a = useAction();
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState('');
  const [note, setNote] = useState('');
  if (!open) return <button className="text-xs font-medium text-brand-hover" onClick={() => setOpen(true)}>Adjust</button>;
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
      <input className="input w-16 py-1 text-right font-mono text-xs" placeholder="±" value={delta} onChange={(e) => setDelta(e.target.value)} />
      <input className="input w-36 py-1 text-xs" placeholder="Reason (count, damage…)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button disabled={a.busy || !Number(delta)} className="btn-primary px-2.5 py-1 text-xs" onClick={async () => { const ok = await a.run(() => createClient().rpc('adjust_stock', { p_stock_level: id, p_delta: Number(delta), p_note: note })); if (ok) setOpen(false); }}>Save</button>
      {a.error && <span className="w-full text-right text-xs text-danger-ink">{a.error}</span>}
    </span>
  );
}
