'use client';
// Cash desk: drivers who ended their shift wait here. Finance opens one (or types / scans the driver's
// code), sees which orders the cash is for, counts it and confirms. Differences open a ticket.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { euro } from '@routa/shared';

type Pending = { id: string; short_code: string; token: string; expected_amount: number; date: string; created_at: string; driver: string | null; route: string | null };
type Detail = {
  ok: boolean; error?: string;
  handover?: { id: string; short_code: string; token: string; expected_amount: number; date: string };
  driver?: { full_name: string; phone?: string | null };
  orders?: { order_id: string; code: string; customer: string; amount: number; method: string }[];
  returns?: { order_id: string; code: string }[];
};

export function CashDesk({ pending }: { pending: Pending[] }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [open, setOpen] = useState<{ code: string; d: Detail } | null>(null);
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function lookUp(c: string) {
    const clean = c.trim();
    if (!clean) return;
    setBusy(true); setMsg(null); setOpen(null);
    const { data, error } = await createClient().rpc('get_cash_handover', { p_code: clean });
    setBusy(false);
    const d = data as Detail | null;
    if (error || !d?.ok || !d.handover) return setMsg({ ok: false, text: error?.message ?? 'No open handover with that code. Check the 6 digits on the driver’s phone.' });
    setOpen({ code: clean, d });
    setCounted(Number(d.handover.expected_amount).toFixed(2));
    setNote('');
  }

  async function confirm() {
    if (!open) return;
    const amount = Number(counted.replace(',', '.'));
    if (!Number.isFinite(amount) || amount < 0) return setMsg({ ok: false, text: 'Enter the amount you counted.' });
    setBusy(true);
    const { data, error } = await createClient().rpc('confirm_cash_handover', { p_code: open.code, p_counted: amount, p_denominations: {}, p_note: note || null });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    const r = data as { status: string; difference: number };
    setMsg({ ok: r.status === 'confirmed', text: r.status === 'confirmed'
      ? `Cash received from ${open.d.driver?.full_name ?? 'driver'} · ${euro(amount)} · matches. Merchants’ balances updated.`
      : `Saved with a difference of ${euro(r.difference)}. A ticket was opened in Helpdesk so it can be checked.` });
    setOpen(null); setCode('');
    router.refresh();
  }

  const exp = open ? Number(open.d.handover!.expected_amount) : 0;
  const diff = open ? Number(counted.replace(',', '.') || 0) - exp : 0;

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="flex-1 text-[15px] font-semibold">Waiting at the cash desk <span className="text-ink-3">({pending.length})</span></h2>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); lookUp(code); }}>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code or scan QR" className="input w-48 font-mono tracking-[3px]" />
            <button className="btn-ghost" disabled={busy}>Find</button>
          </form>
        </div>
        {pending.length === 0 ? (
          <p className="text-[13px] text-ink-3">Nobody is waiting. When a driver presses “End shift” in the driver app, they appear here.</p>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {pending.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="flex min-w-[180px] flex-1 flex-col">
                  <span className="font-medium">{p.driver ?? 'Driver'}</span>
                  <span className="text-xs text-ink-3">{p.route ? `Route ${p.route} · ` : ''}{p.date} · code <span className="font-mono">{p.short_code}</span></span>
                </span>
                <span className="font-mono text-[15px] font-semibold">{euro(p.expected_amount)}</span>
                <button className="btn-dark" disabled={busy} onClick={() => lookUp(p.short_code)}>Count & confirm</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {open && (
        <section className="card flex flex-col gap-4 border-2 border-brand/40 p-5">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="flex-1 text-[15px] font-semibold">{open.d.driver?.full_name ?? 'Driver'} · code <span className="font-mono">{open.d.handover!.short_code}</span></h2>
            <button className="text-[13px] text-ink-3 hover:text-ink" onClick={() => setOpen(null)}>Close</button>
          </div>
          <div className="overflow-x-auto rounded-xl bg-white/50">
            <table className="w-full text-[13px]">
              <thead><tr><th className="th pl-4">Order</th><th className="th">Customer</th><th className="th text-right pr-4">Cash</th></tr></thead>
              <tbody>
                {(open.d.orders ?? []).map((o) => (
                  <tr key={o.order_id} className="border-t border-line"><td className="td pl-4 font-mono">{o.code}</td><td className="td">{o.customer}</td><td className="td pr-4 text-right font-mono">{euro(o.amount)}</td></tr>
                ))}
                {(open.d.orders ?? []).length === 0 && <tr><td colSpan={3} className="td pl-4 text-ink-3">No cash orders on this shift.</td></tr>}
              </tbody>
            </table>
          </div>
          {(open.d.returns ?? []).length > 0 && (
            <p className="rounded-xl bg-warning-tint px-3 py-2 text-[13px] text-warning-ink">Also bringing back {open.d.returns!.length} parcel(s) that couldn’t be delivered: {open.d.returns!.map((r) => r.code).join(', ')}. Receive them in Returns.</p>
          )}
          <div className="flex flex-wrap items-end gap-4">
            <span className="flex flex-col"><span className="text-xs text-ink-3">Should hand in</span><span className="font-mono text-xl font-semibold">{euro(exp)}</span></span>
            <label className="label">Counted (€)<input className="input w-36 font-mono text-lg" inputMode="decimal" value={counted} onChange={(e) => setCounted(e.target.value)} /></label>
            <span className={`pb-2 font-mono text-sm ${Math.abs(diff) < 0.005 ? 'text-success-ink' : 'text-danger-ink'}`}>{Math.abs(diff) < 0.005 ? '✓ matches' : `${diff > 0 ? '+' : ''}${euro(diff)}`}</span>
            <label className="label min-w-[200px] flex-1">Note (optional)<input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. €5 missing, driver will bring tomorrow" /></label>
            <button className="btn-brand h-11 px-5" disabled={busy} onClick={confirm}>{busy ? 'Saving…' : 'Cash received ✓'}</button>
          </div>
        </section>
      )}

      {msg && <p className={`rounded-xl px-3 py-2 text-[13px] ${msg.ok ? 'bg-success-tint text-success-ink' : 'bg-danger-tint text-danger-ink'}`}>{msg.text}</p>}
    </div>
  );
}
