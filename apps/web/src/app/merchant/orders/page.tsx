import { requireMerchant } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, StatusPill, Empty } from '@/components/ui';
import { euro, phonePretty, type OrderStatus } from '@routa/shared';
import { MerchantNewOrder } from './MerchantNewOrder';

export const metadata = { title: 'My orders' };

export default async function MerchantOrders({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const sp = await searchParams;
  const ws = await requireMerchant();
  const supabase = await createClient();
  const { data: orders } = await supabase.from('orders').select('id, code, tracking_code, status, customer_name, customer_phone, address_line, city, cod_amount, delivery_fee, weight_fee, cod_fee, delivery_date').eq('merchant_id', ws.merchant.id).order('created_at', { ascending: false }).limit(200);
  return (
    <>
      <PageHeader title="Orders" subtitle="Every parcel you’ve sent. Fees are calculated from your contract the moment you create an order." />
      <MerchantNewOrder orgId={ws.merchant.org_id} merchantId={ws.merchant.id} open={sp.new === '1'} />
      <section className="card overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-[13px]">
          <thead className="bg-[#FAFBFD]"><tr><th className="th pl-5">Order</th><th className="th">Customer</th><th className="th">Address</th><th className="th">Date</th><th className="th text-right">COD</th><th className="th text-right">Fees</th><th className="th">Status</th><th className="th pr-5">Tracking</th></tr></thead>
          <tbody>{(orders ?? []).map((o) => (
            <tr key={o.id} className="border-t border-line">
              <td className="td pl-5 font-mono font-medium">{o.code}</td>
              <td className="td"><span className="flex flex-col"><span className="font-medium">{o.customer_name}</span><span className="text-xs text-ink-3">{phonePretty(o.customer_phone)}</span></span></td>
              <td className="td text-ink-2">{o.address_line}, {o.city}</td>
              <td className="td font-mono text-ink-2">{o.delivery_date}</td>
              <td className="td text-right font-mono">{Number(o.cod_amount) > 0 ? euro(o.cod_amount) : '—'}</td>
              <td className="td text-right font-mono">{euro(Number(o.delivery_fee ?? 0) + Number(o.weight_fee ?? 0) + Number(o.cod_fee ?? 0))}</td>
              <td className="td"><StatusPill status={o.status as OrderStatus} /></td>
              <td className="td pr-5"><a href={`/t/${o.tracking_code}`} target="_blank" className="link">Open ↗</a></td>
            </tr>
          ))}</tbody>
        </table>
        {(orders ?? []).length === 0 && <Empty title="No orders yet" body="Create your first order above, or import a CSV (Stage 3)." />}
      </section>
    </>
  );
}
