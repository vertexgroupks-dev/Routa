import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty, StatCard } from "@/components/ui";
export const metadata = { title: 'Inventory' };
export default async function Page() {
  const ws = await requireStaff(); const sb = await createClient();
  const { data } = await sb.from('stock_levels').select('id, on_hand, reserved, bin:bins(code), sku:skus(sku, name, low_stock_threshold, merchant:merchants(name))').eq('org_id', ws.org.id);
  const rows = (data ?? []) as any[];
  const low = rows.filter((r) => r.on_hand - r.reserved <= (r.sku?.low_stock_threshold ?? 5));
  return (<>
    <PageHeader title="Inventory" subtitle={`${rows.length} stock lines · ${low.length} low or out of stock`} />
    <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      <StatCard label="Units on hand" value={String(rows.reduce((s, r) => s + r.on_hand, 0))} icon="warehouse" tint="#EEF0FF" ink="#4A49E3" />
      <StatCard label="Reserved for orders" value={String(rows.reduce((s, r) => s + r.reserved, 0))} icon="package" tint="#E9F3FF" ink="#175CD3" />
      <StatCard label="Low stock" value={String(low.length)} icon="alert" tint="#FFF4E5" ink="#B54708" />
    </section>
    <section className="card overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-[13px]">
      <thead className="bg-[#FAFBFD]"><tr><th className="th pl-5">SKU</th><th className="th">Product</th><th className="th">Merchant</th><th className="th">Bin</th><th className="th text-right">On hand</th><th className="th text-right">Reserved</th><th className="th text-right">Available</th><th className="th pr-5">Status</th></tr></thead>
      <tbody>{rows.sort((a, b) => (a.on_hand - a.reserved) - (b.on_hand - b.reserved)).map((r) => { const av = r.on_hand - r.reserved; return (
        <tr key={r.id} className="border-t border-line"><td className="td pl-5 font-mono">{r.sku?.sku}</td><td className="td font-medium">{r.sku?.name}</td><td className="td text-ink-2">{r.sku?.merchant?.name}</td><td className="td font-mono text-ink-2">{r.bin?.code}</td><td className="td text-right font-mono">{r.on_hand}</td><td className="td text-right font-mono">{r.reserved}</td><td className="td text-right font-mono font-semibold">{av}</td>
        <td className="td pr-5">{av <= 0 ? <Pill bg="#FDECEC" ink="#B42318">Out of stock</Pill> : av <= (r.sku?.low_stock_threshold ?? 5) ? <Pill bg="#FFF4E5" ink="#B54708">Low</Pill> : <Pill bg="#E8F8EF" ink="#067647">OK</Pill>}</td></tr>); })}</tbody></table>
      {rows.length === 0 && <Empty title="No stock yet" />}</section>
  </>);
}
