'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAction, Msg } from '@/components/useAction';
import { todayKs } from '@routa/shared';

export function MoneyRuns({ orgId }: { orgId: string }) {
  const a = useAction();
  const [until, setUntil] = useState(todayKs());
  const [month, setMonth] = useState(new Date(Date.now() - 20 * 86400_000).toISOString().slice(0, 7));
  return (
    <section className="card flex flex-col gap-3 p-5">
      <h2 className="text-base font-semibold">Run payouts & invoices</h2>
      <p className="text-[13px] text-ink-3">These also run automatically: payouts every Monday morning, invoices on the 1st of each month.</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="label">Pay out balances up to<input type="date" className="input w-auto py-2" value={until} onChange={(e) => setUntil(e.target.value)} /></label>
        <button disabled={a.busy} className="btn-dark" onClick={() => a.run(() => createClient().rpc('generate_payouts', { p_org: orgId, p_until: until }), (n: number) => n ? `${n} payout(s) created.` : 'No merchant has a positive balance to pay out yet.')}>Create payouts</button>
        <span className="mx-2 h-8 w-px bg-line" />
        <label className="label">Invoice month<input type="month" className="input w-auto py-2" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
        <button disabled={a.busy} className="btn-ghost" onClick={() => a.run(() => createClient().rpc('generate_invoices', { p_org: orgId, p_month: `${month}-01` }), (n: number) => n ? `${n} invoice(s) issued.` : 'Nothing new to invoice for that month.')}>Issue invoices</button>
      </div>
      <Msg error={a.error} ok={a.ok} />
    </section>
  );
}

export function MarkPaid({ id }: { id: string }) {
  const a = useAction();
  const [ref, setRef] = useState('');
  return (
    <span className="inline-flex items-center gap-1.5">
      <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Bank ref" className="input w-28 py-1 text-xs" />
      <button disabled={a.busy} className="btn-primary px-2.5 py-1 text-xs" onClick={() => a.run(() => createClient().rpc('mark_payout_paid', { p_payout: id, p_reference: ref || null }))}>Paid</button>
      {a.error && <span className="text-xs text-danger-ink">{a.error}</span>}
    </span>
  );
}
