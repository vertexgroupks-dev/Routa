import { requireMerchant } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Pill, Empty } from '@/components/ui';
export const metadata = { title: 'My stock' };
export default async function Page() {
  const ws = await requireMerchant(); const sb = await createClient();
  const { data } = await sb.from('skus').select('id, sku, name, low_stock_threshold, stock:stock_levels(on_hand, reserved)').eq('merchant_id', ws.merchant.id).order('sku');
  return (<>
    <PageHeader title="Stock in the warehouse" subtitle="Live stock the courier holds for you." />
    <section className="card overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-[13px]">
      <thead className="bg-[#FAFBFD]"><tr><th className="th pl-5">SKU</th><th className="th">Product</th><th className="th text-right">On hand</th><th className="th text-right">Reserved</th><th className="th pr-5">Status</th></tr></thead>
      <tbody>{((data ?? []) as any[]).map((s) => { const on = (s.stock ?? []).reduce((a: number, x: any) => a + x.on_hand, 0); const res = (s.stock ?? []).reduce((a: number, x: any) => a + x.reserved, 0); const av = on - res; return (
        <tr key={s.id} className="border-t border-line"><td className="td pl-5 font-mono">{s.sku}</td><td className="td font-medium">{s.name}</td><td className="td text-right font-mono">{on}</td><td className="td text-right font-mono">{res}</td><td className="td pr-5">{av <= 0 ? <Pill bg="#FDECEC" ink="#B42318">Out of stock</Pill> : av <= (s.low_stock_threshold ?? 5) ? <Pill bg="#FFF4E5" ink="#B54708">Low · {av}</Pill> : <Pill bg="#E8F8EF" ink="#067647">{av} available</Pill>}</td></tr>); })}</tbody></table>
      {(data ?? []).length === 0 && <Empty title="No products stored with the courier" body="You use delivery only." />}</section>
  </>);
}
