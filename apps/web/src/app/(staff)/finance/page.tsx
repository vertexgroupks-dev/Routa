import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, StatCard, Pill, Empty } from '@/components/ui';
import { euro, todayKs } from '@routa/shared';

export const metadata = { title: 'Finance & COD' };
const PS: Record<string, [string, string]> = { draft: ['#F0F2F7', '#5B6378'], scheduled: ['#EEF0FF', '#3B38BF'], paid: ['#E8F8EF', '#067647'], on_hold: ['#FFF4E5', '#B54708'], issued: ['#EEF0FF', '#3B38BF'], void: ['#FDECEC', '#B42318'] };

export default async function FinancePage() {
  const ws = await requireStaff();
  const supabase = await createClient();
  const org = ws.org.id;
  const today = todayKs();
  const [{ data: cod }, { data: ledger }, { data: payouts }, { data: invoices }, { data: handovers }] = await Promise.all([
    supabase.from('cod_collections').select('amount, handover_id, driver:drivers(full_name)').eq('org_id', org).gte('collected_at', `${today}T00:00:00`),
    supabase.from('merchant_ledger').select('amount, merchant:merchants(id, name, code)').eq('org_id', org),
    supabase.from('payouts').select('id, amount, orders_count, status, period_start, period_end, paid_at, merchant:merchants(name)').eq('org_id', org).order('period_end', { ascending: false }).limit(10),
    supabase.from('invoices').select('id, number, total, status, due_at, merchant:merchants(name)').eq('org_id', org).order('number', { ascending: false }).limit(10),
    supabase.from('cash_handovers').select('id, expected_amount, counted_amount, difference, status, short_code, driver:drivers(full_name)').eq('org_id', org).eq('date', today)
  ]);
  const collected = (cod ?? []).reduce((s, c) => s + Number(c.amount), 0);
  const withDrivers = (cod ?? []).filter((c) => !c.handover_id).reduce((s, c) => s + Number(c.amount), 0);
  const perDriver = new Map<string, number>();
  (cod ?? []).filter((c: any) => !c.handover_id).forEach((c: any) => perDriver.set(c.driver?.full_name ?? '—', (perDriver.get(c.driver?.full_name ?? '—') ?? 0) + Number(c.amount)));
  const balances = new Map<string, { name: string; amount: number }>();
  (ledger ?? []).forEach((l: any) => { const k = l.merchant?.id; if (!k) return; const b = balances.get(k) ?? { name: l.merchant.name, amount: 0 }; b.amount += Number(l.amount); balances.set(k, b); });
  const owed = [...balances.values()].reduce((s, b) => s + b.amount, 0);

  return (
    <>
      <PageHeader title="Finance & COD" subtitle="Cash collected by drivers, what you owe each merchant, payouts and invoices." />
      <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <StatCard label="COD collected today" value={euro(collected, 0)} icon="banknote" tint="#E9F3FF" ink="#175CD3" note={`${cod?.length ?? 0} payments`} />
        <StatCard label="Still with drivers" value={euro(withDrivers, 0)} icon="truck" tint="#FFF4E5" ink="#B54708" note="Checked in at end of shift by QR" />
        <StatCard label="Balance owed to merchants" value={euro(owed, 0)} icon="store" tint="#EEF0FF" ink="#4A49E3" note="Ledger: COD in, fees out" />
        <StatCard label="Handovers today" value={String(handovers?.length ?? 0)} icon="check" tint="#E8F8EF" ink="#067647" note={`${(handovers ?? []).filter((h) => h.status === 'pending').length} waiting to be counted`} />
      </section>
      <div className="flex flex-wrap items-start gap-4">
        <section className="card flex min-w-0 flex-[1_1_320px] flex-col gap-2.5 p-5 text-[13px]">
          <h2 className="text-base font-semibold">Cash per driver (not handed in)</h2>
          {[...perDriver.entries()].sort((a, b) => b[1] - a[1]).map(([n, a]) => <span key={n} className="flex justify-between"><span>{n}</span><span className="font-mono">{euro(a)}</span></span>)}
          {perDriver.size === 0 && <Empty title="All cash handed in" />}
        </section>
        <section className="card flex min-w-0 flex-[1_1_320px] flex-col gap-2.5 p-5 text-[13px]">
          <h2 className="text-base font-semibold">Merchant balances</h2>
          {[...balances.values()].sort((a, b) => b.amount - a.amount).map((b) => <span key={b.name} className="flex justify-between"><span>{b.name}</span><span className={`font-mono ${b.amount < 0 ? 'text-danger-ink' : ''}`}>{euro(b.amount)}</span></span>)}
        </section>
      </div>
      <div className="flex flex-wrap items-start gap-4">
        <section className="card min-w-0 flex-[1_1_420px] overflow-x-auto">
          <h2 className="px-5 pt-5 text-base font-semibold">Payouts</h2>
          <table className="mt-2 w-full border-collapse text-[13px]"><tbody>{(payouts ?? []).map((p: any) => (
            <tr key={p.id} className="border-t border-line"><td className="td pl-5 font-medium">{p.merchant?.name}</td><td className="td font-mono text-ink-2">{p.period_start} → {p.period_end}</td><td className="td text-right font-mono">{euro(p.amount)}</td><td className="td pr-5"><Pill bg={PS[p.status]?.[0] ?? '#F0F2F7'} ink={PS[p.status]?.[1] ?? '#5B6378'}>{p.status}</Pill></td></tr>
          ))}</tbody></table>
        </section>
        <section className="card min-w-0 flex-[1_1_420px] overflow-x-auto">
          <h2 className="px-5 pt-5 text-base font-semibold">Invoices</h2>
          <table className="mt-2 w-full border-collapse text-[13px]"><tbody>{(invoices ?? []).map((i: any) => (
            <tr key={i.id} className="border-t border-line"><td className="td pl-5 font-mono font-medium">{i.number}</td><td className="td">{i.merchant?.name}</td><td className="td font-mono text-ink-2">due {i.due_at?.slice(0, 10)}</td><td className="td text-right font-mono">{euro(i.total)}</td><td className="td pr-5"><Pill bg={PS[i.status]?.[0] ?? '#F0F2F7'} ink={PS[i.status]?.[1] ?? '#5B6378'}>{i.status}</Pill></td></tr>
          ))}</tbody></table>
        </section>
      </div>
    </>
  );
}
