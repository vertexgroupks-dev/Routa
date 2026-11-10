'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { euro } from '@routa/shared';

/** Generic button that runs one Supabase call then refreshes the page. */
export function ActionButton({ label, kind = 'primary', run }: { label: string; kind?: 'primary' | 'ghost' | 'dark'; run: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button disabled={busy} className={`btn-${kind}`} onClick={async () => {
        setBusy(true); setErr(null);
        const spec = JSON.parse(run) as { table?: string; id?: string; patch?: Record<string, unknown>; rpc?: string; args?: Record<string, unknown> };
        const sb = createClient();
        const { error } = spec.rpc ? await sb.rpc(spec.rpc, spec.args ?? {}) : await sb.from(spec.table!).update(spec.patch!).eq('id', spec.id!);
        setBusy(false);
        if (error) setErr(error.message); else router.refresh();
      }}>{busy ? '…' : label}</button>
      {err && <span className="max-w-[260px] text-right text-xs text-danger-ink">{err}</span>}
    </span>
  );
}

export function ScanBox({ placeholder, rpc, argName, extra, button }: { placeholder: string; rpc: string; argName: string; extra?: Record<string, unknown>; button: string }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form className="card flex flex-wrap items-center gap-3 p-4" onSubmit={async (e) => {
      e.preventDefault(); setMsg(null);
      const { data, error } = await createClient().rpc(rpc, { ...(extra ?? {}), [argName]: code.trim() });
      if (error) setMsg({ ok: false, text: error.message }); else { setMsg({ ok: true, text: `Done · ${JSON.stringify(data).slice(0, 160)}` }); setCode(''); router.refresh(); }
    }}>
      <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder={placeholder} className="input max-w-[320px] font-mono" />
      <button className="btn-primary">{button}</button>
      {msg && <span className={`text-[13px] ${msg.ok ? 'text-success-ink' : 'text-danger-ink'}`}>{msg.text}</span>}
    </form>
  );
}

export function CashCheckIn() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [h, setH] = useState<any>(null);
  const [counted, setCounted] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const sb = createClient();
  return (
    <div className="card flex flex-col gap-4 p-5">
      <form className="flex flex-wrap gap-3" onSubmit={async (e) => {
        e.preventDefault(); setMsg(null); setH(null);
        const { data, error } = await sb.rpc('get_cash_handover', { p_code: code.trim() });
        if (error) setMsg({ ok: false, text: error.message }); else { setH(data); setCounted(String((data as any)?.expected_amount ?? '')); }
      }}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Driver’s 6-digit code or QR token" className="input max-w-[320px] font-mono text-lg tracking-[4px]" />
        <button className="btn-primary">Look up</button>
      </form>
      {h && (
        <div className="flex flex-wrap items-end gap-4 rounded-xl bg-canvas p-4 text-sm">
          <span className="flex flex-col"><span className="text-xs text-ink-3">Driver</span><span className="font-medium">{h.driver_name ?? h.driver ?? '—'}</span></span>
          <span className="flex flex-col"><span className="text-xs text-ink-3">Expected</span><span className="font-mono text-lg font-semibold">{euro(h.expected_amount)}</span></span>
          <label className="label">Counted (€)<input className="input w-40 font-mono" value={counted} onChange={(e) => setCounted(e.target.value)} /></label>
          <button className="btn-dark" onClick={async () => {
            const { data, error } = await sb.rpc('confirm_cash_handover', { p_code: code.trim(), p_counted: Number(counted), p_denominations: {}, p_note: null });
            if (error) setMsg({ ok: false, text: error.message }); else { setMsg({ ok: true, text: `Confirmed · difference ${euro((data as any)?.difference ?? 0)}` }); setH(null); setCode(''); router.refresh(); }
          }}>Confirm cash</button>
        </div>
      )}
      {msg && <p className={`rounded-[10px] px-3 py-2 text-[13px] ${msg.ok ? 'bg-success-tint text-success-ink' : 'bg-danger-tint text-danger-ink'}`}>{msg.text}</p>}
    </div>
  );
}
