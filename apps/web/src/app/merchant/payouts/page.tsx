import { requireMerchant } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Pill, Empty, StatCard } from '@/components/ui';
import { euro } from '@routa/shared';
export const metadata = { title: 'Payouts' };
export default async function Page() {
  const ws = await requireMerchant(); const sb = await createClient();
  const [{ data: payouts }, { data: ledger }, { data: invoices }] = await Promise.all([
    sb.from('payouts').select('id, period_start, period_end, amount, orders_count, status, paid_at').eq('merchant_id', ws.merchant.id).order('period_end', { ascending: false }),
    sb.from('merchant_ledger').select('id, type, amount, description, created_at').eq('merchant_id', ws.merchant.id).order('created_at', { ascending: false }).limit(50),
    sb.from('invoices').select('id, number, total, status, due_at').eq('merchant_id', ws.merchant.id).order('number', { ascending: false })
  ]);
  const balance = ((ledger ?? []) as any[]).reduce((s, l) => s + Number(l.amount), 0);
  return (<>
    <PageHeader title="Payouts & invoices" subtitle="Cash the courier collected for you, minus fees." />
    <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      <StatCard label="Current balance" value={euro(balance)} icon="wallet" tint="#E9F3FF" ink="#175CD3" note="Paid out weekly" />
      <StatCard label="Paid out so far" value={euro(((payouts ?? []) as any[]).filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0), 0)} icon="banknote" tint="#E8F8EF" ink="#067647" />
    </section>
    <div className="flex flex-wrap items-start gap-4">
      <section className="card min-w-0 flex-[1_1_420px] p-5"><h2 className="mb-2 text-base font-semibold">Payouts</h2>{((payouts ?? []) as any[]).map((p) => <div key={p.id} className="flex items-center gap-3 border-t border-line py-2.5 text-[13px]"><span className="flex-1 font-mono text-ink-2">{p.period_start} → {p.period_end}</span><span className="font-mono">{euro(p.amount)}</span><Pill bg={p.status === 'paid' ? '#E8F8EF' : '#EEF0FF'} ink={p.status === 'paid' ? '#067647' : '#3B38BF'}>{p.status}</Pill></div>)}{(payouts ?? []).length === 0 && <Empty title="No payouts yet" />}</section>
      <section className="card min-w-0 flex-[1_1_420px] p-5"><h2 className="mb-2 text-base font-semibold">Invoices</h2>{((invoices ?? []) as any[]).map((i) => <div key={i.id} className="flex items-center gap-3 border-t border-line py-2.5 text-[13px]"><span className="flex-1 font-mono">{i.number}</span><span className="font-mono">{euro(i.total)}</span><Pill bg="#EEF0FF" ink="#3B38BF">{i.status}</Pill></div>)}{(invoices ?? []).length === 0 && <Empty title="No invoices yet" />}</section>
    </div>
    <section className="card p-5"><h2 className="mb-2 text-base font-semibold">Recent movements</h2>{((ledger ?? []) as any[]).map((l) => <div key={l.id} className="flex gap-3 border-t border-line py-2 text-[13px]"><span className="flex-1">{l.description ?? l.type}</span><span className={`font-mono ${Number(l.amount) < 0 ? 'text-danger-ink' : 'text-success-ink'}`}>{euro(l.amount)}</span></div>)}</section>
  </>);
}
