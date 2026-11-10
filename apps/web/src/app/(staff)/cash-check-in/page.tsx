import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty, StatCard, Avatar } from "@/components/ui";
import { euro, todayKs } from '@routa/shared';
import { CashCheckIn } from '../_actions';
export const metadata = { title: 'Cash Check-in' };
export default async function Page() {
  const ws = await requireStaff(); const sb = await createClient();
  const { data } = await sb.from('cash_handovers').select('id, short_code, expected_amount, counted_amount, difference, status, confirmed_at, created_at, driver:drivers(full_name)').eq('org_id', ws.org.id).order('created_at', { ascending: false }).limit(50);
  return (<>
    <PageHeader title="Cash Check-in" subtitle="At the end of the shift the driver shows a 6-digit code. Type it, count the cash, confirm." />
    <CashCheckIn />
    <section className="card overflow-x-auto"><table className="w-full min-w-[640px] border-collapse text-[13px]">
      <thead className="bg-[#FAFBFD]"><tr><th className="th pl-5">Driver</th><th className="th">Code</th><th className="th text-right">Expected</th><th className="th text-right">Counted</th><th className="th text-right">Difference</th><th className="th pr-5">Status</th></tr></thead>
      <tbody>{((data ?? []) as any[]).map((h) => <tr key={h.id} className="border-t border-line"><td className="td pl-5 font-medium">{h.driver?.full_name}</td><td className="td font-mono">{h.short_code}</td><td className="td text-right font-mono">{euro(h.expected_amount)}</td><td className="td text-right font-mono">{h.counted_amount != null ? euro(h.counted_amount) : '—'}</td><td className={`td text-right font-mono ${Number(h.difference) < 0 ? 'text-danger-ink' : ''}`}>{h.difference != null ? euro(h.difference) : '—'}</td><td className="td pr-5"><Pill bg={h.status === 'pending' ? '#FFF4E5' : h.status === 'confirmed' ? '#E8F8EF' : '#FDECEC'} ink={h.status === 'pending' ? '#B54708' : h.status === 'confirmed' ? '#067647' : '#B42318'}>{h.status}</Pill></td></tr>)}</tbody></table>
      {(data ?? []).length === 0 && <Empty title="No handovers yet" body="They appear when drivers end their shift in the driver app." />}</section>
  </>);
}
