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

