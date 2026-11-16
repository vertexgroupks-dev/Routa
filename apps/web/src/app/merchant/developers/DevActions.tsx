'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAction, Msg } from '@/components/useAction';

export function NewKey({ merchantId }: { merchantId: string }) {
  const a = useAction();
  const [name, setName] = useState('My shop');
  const [key, setKey] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <input className="input max-w-[240px] py-2" value={name} onChange={(e) => setName(e.target.value)} />
        <button disabled={a.busy} className="btn-primary" onClick={async () => { const k = await a.run(() => createClient().rpc('create_api_key', { p_merchant: merchantId, p_name: name })); if (typeof k === 'string') setKey(k); }}>Create key</button>
      </div>
      {key && <div className="rounded-[10px] bg-warning-tint p-3 text-[13px] text-warning-ink">Copy it now — it will not be shown again:<input readOnly value={key} onFocus={(e) => e.target.select()} className="input mt-2 font-mono text-xs" /></div>}
      <Msg error={a.error} />
    </div>
  );
}

export function RevokeKey({ id }: { id: string }) {
  const a = useAction();
  return <button disabled={a.busy} className="text-xs text-danger-ink" onClick={() => a.run(() => createClient().rpc('revoke_api_key', { p_id: id }))}>Revoke</button>;
}

export function Webhooks({ orgId, merchantId, hooks }: { orgId: string; merchantId: string; hooks: { id: string; url: string; secret: string; events: string[]; active: boolean }[] }) {
  const a = useAction();
  const [url, setUrl] = useState('');
  const sb = createClient();
  return (
    <section className="card flex flex-col gap-3 p-5">
      <h2 className="text-base font-semibold">Webhooks</h2>
      <p className="text-[13px] text-ink-3">We call your URL when an order goes out for delivery, is delivered, fails, is returned or cancelled.</p>
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); a.run(() => sb.from('webhook_endpoints').insert({ org_id: orgId, merchant_id: merchantId, url }), 'Webhook added.').then(() => setUrl('')); }}>
        <input className="input max-w-[420px] py-2 font-mono text-xs" placeholder="https://myshop.com/routa-webhook" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button disabled={a.busy || !url.startsWith('https://')} className="btn-primary">Add</button>
      </form>
      {hooks.map((h) => (
        <div key={h.id} className="flex flex-wrap items-center gap-3 border-t border-line py-2.5 text-[13px]">
          <span className="flex-1 font-mono text-xs">{h.url}</span>
          <span className="font-mono text-xs text-ink-3">secret {h.secret.slice(0, 8)}…</span>
          <button className="text-xs text-ink-2" onClick={() => a.run(() => sb.from('webhook_endpoints').update({ active: !h.active }).eq('id', h.id))}>{h.active ? 'Pause' : 'Resume'}</button>
          <button className="text-xs text-danger-ink" onClick={() => a.run(() => sb.from('webhook_endpoints').delete().eq('id', h.id))}>Delete</button>
        </div>
      ))}
      <Msg error={a.error} ok={a.ok} />
    </section>
  );
}
