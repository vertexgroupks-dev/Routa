import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty, StatCard, Avatar } from "@/components/ui";
import { euro } from '@routa/shared';
export const metadata = { title: 'Analytics' };
export default async function Page() {
  const ws = await requireStaff(); const sb = await createClient();
  const from = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const { data } = await sb.from('orders').select('status, cod_amount, delivery_fee, weight_fee, cod_fee, merchant:merchants(name), zone:zones(name)').eq('org_id', ws.org.id).gte('delivery_date', from);
  const o = (data ?? []) as any[];
  const delivered = o.filter((x) => x.status === 'delivered');
  const failed = o.filter((x) => ['failed_attempt', 'returned_to_merchant', 'returning', 'returned_to_hub'].includes(x.status));
  const revenue = delivered.reduce((s, x) => s + Number(x.delivery_fee || 0) + Number(x.weight_fee || 0) + Number(x.cod_fee || 0), 0);
  const group = (key: (x: any) => string) => { const m = new Map<string, { n: number; d: number }>(); o.forEach((x) => { const k = key(x) || '—'; const v = m.get(k) ?? { n: 0, d: 0 }; v.n++; if (x.status === 'delivered') v.d++; m.set(k, v); }); return [...m.entries()].sort((a, b) => b[1].n - a[1].n); };
  const Bars = ({ title, rows }: { title: string; rows: [string, { n: number; d: number }][] }) => { const max = Math.max(1, ...rows.map((r) => r[1].n)); return (
    <section className="card flex min-w-0 flex-[1_1_380px] flex-col gap-3 p-5"><h2 className="text-base font-semibold">{title}</h2>{rows.map(([k, v]) => (
      <div key={k} className="flex flex-col gap-1 text-[13px]"><span className="flex justify-between"><span>{k}</span><span className="font-mono text-ink-2">{v.n} orders · {v.d} delivered</span></span><span className="flex h-2 overflow-hidden rounded bg-field"><span className="bg-brand" style={{ width: `${(v.n / max) * 100}%` }} /></span></div>))}</section>); };
  return (<>
    <PageHeader title="Analytics" subtitle="Last 30 days" />
    <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      <StatCard label="Orders" value={String(o.length)} icon="package" tint="#EEF0FF" ink="#4A49E3" />
      <StatCard label="Success rate" value={`${delivered.length + failed.length ? ((delivered.length / (delivered.length + failed.length)) * 100).toFixed(1) : '0'}%`} icon="check" tint="#E8F8EF" ink="#067647" />
      <StatCard label="Delivery revenue" value={euro(revenue, 0)} icon="wallet" tint="#E9F3FF" ink="#175CD3" />
      <StatCard label="COD handled" value={euro(delivered.reduce((s, x) => s + Number(x.cod_amount || 0), 0), 0)} icon="banknote" tint="#FFF4E5" ink="#B54708" />
    </section>
    <div className="flex flex-wrap gap-4"><Bars title="By merchant" rows={group((x) => x.merchant?.name)} /><Bars title="By zone" rows={group((x) => x.zone?.name ?? 'No zone')} /></div>
  </>);
}
