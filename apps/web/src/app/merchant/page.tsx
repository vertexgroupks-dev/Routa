import Link from 'next/link';
import { requireMerchant } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, StatCard, StatusPill } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { euro, todayKs, type OrderStatus } from '@routa/shared';

export const metadata = { title: 'Merchant portal' };

export default async function MerchantHome() {
  const ws = await requireMerchant();
  const supabase = await createClient();
  const id = ws.merchant.id;
  const today = todayKs();
  const [{ data: orders }, { data: recent }, { data: ledger }, { data: payout }] = await Promise.all([
    supabase.from('orders').select('status, cod_amount, delivery_date').eq('merchant_id', id).gte('delivery_date', today.slice(0, 7) + '-01'),
    supabase.from('orders').select('id, code, status, customer_name, address_line, cod_amount, delivery_date').eq('merchant_id', id).order('created_at', { ascending: false }).limit(8),
    supabase.from('merchant_ledger').select('amount').eq('merchant_id', id),
    supabase.from('payouts').select('amount, status, paid_at, period_end').eq('merchant_id', id).order('period_end', { ascending: false }).limit(1).maybeSingle()
  ]);
  const o = orders ?? [];
  const t = o.filter((x) => x.delivery_date === today);
  const delivered = o.filter((x) => x.status === 'delivered').length;
  const balance = (ledger ?? []).reduce((s, l) => s + Number(l.amount), 0);
  return (
    <>
      <PageHeader title={`Hi ${ws.fullName.split(' ')[0]} 👋`} subtitle={`${ws.merchant.name} · your parcels with ${ws.org?.name ?? 'your courier'}`}>
        <Link href="/merchant/orders?new=1" className="btn-primary"><Icon name="plus" size={16} color="#fff" strokeWidth={2} />New order</Link>
      </PageHeader>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <StatCard label="Orders today" value={String(t.length)} note={`${t.filter((x) => x.status === 'delivered').length} delivered so far`} icon="package" tint="#EEF0FF" ink="#4A49E3" />
        <StatCard label="Delivered this month" value={String(delivered)} note={`${o.length} orders this month`} icon="check" tint="#E8F8EF" ink="#067647" />
        <StatCard label="Balance owed to you" value={euro(balance)} note="Cash collected minus delivery fees" icon="wallet" tint="#E9F3FF" ink="#175CD3" />
        <StatCard label="Last payout" value={payout ? euro(payout.amount, 0) : '—'} note={payout ? `${payout.status} · period to ${payout.period_end}` : 'No payouts yet'} icon="banknote" tint="#FFF4E5" ink="#B54708" />
      </section>
      <section className="card overflow-x-auto">
        <div className="flex items-center px-5 pt-5"><h2 className="flex-1 text-base font-semibold">Latest orders</h2><Link href="/merchant/orders" className="link text-[13px]">All orders →</Link></div>
        <table className="mt-3 w-full min-w-[640px] border-collapse text-[13px]"><tbody>{(recent ?? []).map((r) => (
          <tr key={r.id} className="border-t border-line"><td className="td pl-5 font-mono font-medium">{r.code}</td><td className="td">{r.customer_name}</td><td className="td text-ink-2">{r.address_line}</td><td className="td font-mono text-ink-2">{r.delivery_date}</td><td className="td text-right font-mono">{Number(r.cod_amount) > 0 ? euro(r.cod_amount) : '—'}</td><td className="td pr-5"><StatusPill status={r.status as OrderStatus} /></td></tr>
        ))}</tbody></table>
      </section>
    </>
  );
}
