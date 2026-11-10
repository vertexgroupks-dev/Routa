import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty, StatCard, Avatar } from "@/components/ui";
import { ScanBox } from '../_actions';
export const metadata = { title: 'Returns' };
export default async function Page() {
  const ws = await requireStaff(); const sb = await createClient();
  const { data } = await sb.from('returns').select('id, reason, status, next_step, created_at, checked_in_at, order:orders(code, customer_name), merchant:merchants(name), driver:drivers(full_name)').eq('org_id', ws.org.id).order('created_at', { ascending: false }).limit(100);
  return (<>
    <PageHeader title="Returns check-in" subtitle="Parcels coming back from drivers. Scan or type the order code to check them in." />
    <ScanBox placeholder="Order code e.g. KS-20412" rpc="check_in_return" argName="p_code" extra={{ p_org: ws.org.id }} button="Check in" />
    <section className="card overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-[13px]">
      <thead className="bg-[#FAFBFD]"><tr><th className="th pl-5">Order</th><th className="th">Customer</th><th className="th">Merchant</th><th className="th">Driver</th><th className="th">Reason</th><th className="th pr-5">Status</th></tr></thead>
      <tbody>{((data ?? []) as any[]).map((r) => <tr key={r.id} className="border-t border-line"><td className="td pl-5 font-mono font-medium">{r.order?.code}</td><td className="td">{r.order?.customer_name}</td><td className="td text-ink-2">{r.merchant?.name}</td><td className="td text-ink-2">{r.driver?.full_name}</td><td className="td text-ink-2">{r.reason ?? '—'}</td><td className="td pr-5"><Pill bg={r.status === 'expected' ? '#FFF4E5' : '#E8F8EF'} ink={r.status === 'expected' ? '#B54708' : '#067647'}>{r.status.replace(/_/g, ' ')}</Pill></td></tr>)}</tbody></table>
      {(data ?? []).length === 0 && <Empty title="No returns" body="Returns appear when a driver ends a shift with undelivered parcels." />}</section>
  </>);
}
