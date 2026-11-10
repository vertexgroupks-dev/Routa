import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Pill } from '@/components/ui';
import { euro, phonePretty, todayKs } from '@routa/shared';

export const metadata = { title: 'Merchants' };
const S: Record<string, [string, string, string]> = { active: ['Active', '#E8F8EF', '#067647'], invited: ['Invited', '#EEF0FF', '#3B38BF'], on_hold: ['On hold', '#FFF4E5', '#B54708'] };
const COLORS = ['#1D72D8', '#0F9F5F', '#DB2777', '#0891B2', '#D9740B', '#65A30D', '#7C3AED'];

export default async function MerchantsPage() {
  const ws = await requireStaff();
  const supabase = await createClient();
  const month = todayKs().slice(0, 7) + '-01';
  const [{ data: merchants }, { data: orders }, { data: ledger }] = await Promise.all([
    supabase.from('merchants').select('id, name, code, contact_name, phone, service_type, status, pricing').eq('org_id', ws.org.id).order('name'),
    supabase.from('orders').select('merchant_id, status').eq('org_id', ws.org.id).gte('delivery_date', month),
    supabase.from('merchant_ledger').select('merchant_id, amount').eq('org_id', ws.org.id)
  ]);
  const stat = (id: string) => {
    const mine = (orders ?? []).filter((o) => o.merchant_id === id);
    const closed = mine.filter((o) => ['delivered', 'failed_attempt', 'returned_to_merchant'].includes(o.status));
    const ok = closed.filter((o) => o.status === 'delivered').length;
    return { n: mine.length, success: closed.length ? `${((ok / closed.length) * 100).toFixed(1)}%` : '—', balance: (ledger ?? []).filter((l) => l.merchant_id === id).reduce((s, l) => s + Number(l.amount), 0) };
  };
  return (
    <>
      <PageHeader title="Merchants" subtitle={`${merchants?.length ?? 0} online stores and businesses that send parcels with you. Each one gets its own portal login.`} />
      <section className="card overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-[13px]">
          <thead className="bg-[#FAFBFD]"><tr><th className="th pl-5">Merchant</th><th className="th">Service</th><th className="th text-right">Orders · this month</th><th className="th text-right">Success</th><th className="th text-right">Balance owed</th><th className="th">Pricing</th><th className="th pr-5">Status</th></tr></thead>
          <tbody>{(merchants ?? []).map((m, i) => {
            const s = stat(m.id); const st = S[m.status] ?? S.active!; const p = (m.pricing ?? {}) as Record<string, number>;
            return (
              <tr key={m.id} className="border-t border-line">
                <td className="td pl-5"><span className="flex items-center gap-2.5"><span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg text-[11px] font-semibold text-white" style={{ background: COLORS[i % COLORS.length] }}>{m.code}</span><span className="flex flex-col"><span className="font-medium">{m.name}</span><span className="text-xs text-ink-3">{m.contact_name} · {phonePretty(m.phone)}</span></span></span></td>
                <td className="td text-ink-2">{m.service_type === 'fulfillment' ? 'Fulfillment + delivery' : 'Delivery only'}</td>
                <td className="td text-right font-mono">{s.n}</td>
                <td className="td text-right font-mono">{s.success}</td>
                <td className="td text-right font-mono">{euro(s.balance)}</td>
                <td className="td text-ink-2">{p.delivery_fee ? `${euro(p.delivery_fee)} custom` : 'Zone prices'}</td>
                <td className="td pr-5"><Pill bg={st[1]} ink={st[2]}>{st[0]}</Pill></td>
              </tr>
            );
          })}</tbody>
        </table>
      </section>
    </>
  );
}
