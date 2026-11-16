'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAction, Msg } from '@/components/useAction';

export function PayrollRun({ orgId }: { orgId: string }) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
  const a = useAction();
  const [f, setF] = useState({ start: first, end: now.toLocaleDateString('en-CA') });
  return (
    <section className="card flex flex-wrap items-end gap-3 p-5">
      <h2 className="w-full text-base font-semibold">Payroll run</h2>
      <p className="w-full text-[13px] text-ink-3">Salary + per-stop bonus (from delivered stops) + hours (from shifts) − cash shortages (from cash check-in).</p>
      <label className="label">From<input type="date" className="input w-auto py-2" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></label>
      <label className="label">To<input type="date" className="input w-auto py-2" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></label>
      <button disabled={a.busy} className="btn-dark" onClick={() => a.run(() => createClient().rpc('run_payroll', { p_org: orgId, p_start: f.start, p_end: f.end }), 'Payroll calculated. Review the payslips below.')}>{a.busy ? 'Calculating…' : 'Calculate payroll'}</button>
      <div className="w-full"><Msg error={a.error} ok={a.ok} /></div>
    </section>
  );
}

export function ApprovePayroll({ id }: { id: string }) {
  const a = useAction();
  return <span className="inline-flex flex-col items-end"><button disabled={a.busy} className="btn-primary" onClick={() => a.run(() => createClient().rpc('approve_payroll', { p_run: id }))}>Approve</button>{a.error && <span className="text-xs text-danger-ink">{a.error}</span>}</span>;
}
