import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty } from "@/components/ui";
import { euro } from '@routa/shared';
import { CashDesk } from './CashDesk';
export const metadata = { title: 'Cash Check-in' };

export default async function Page() {
  const ws = await requireStaff('/cash-check-in'); const sb = await createClient();
  const [{ data: pending }, { data: done }] = await Promise.all([
    sb.from('cash_handovers').select('id, short_code, token, expected_amount, date, created_at, driver:drivers(full_name), route:routes(code)').eq('org_id', ws.org.id).eq('status', 'pending').order('created_at'),
    sb.from('cash_handovers').select('id, short_code, expected_amount, counted_amount, difference, status, confirmed_at, note, driver:drivers(full_name)').eq('org_id', ws.org.id).neq('status', 'pending').order('confirmed_at', { ascending: false }).limit(50)
  ]);
  const waiting = ((pending ?? []) as any[]).map((p) => ({ id: p.id, short_code: p.short_code, token: p.token, expected_amount: Number(p.expected_amount), date: p.date, created_at: p.created_at, driver: p.driver?.full_name ?? null, route: p.route?.code ?? null }));
  return (<>
    <PageHeader title="Cash Check-in" subtitle="Drivers who ended their shift wait here. Count their cash and confirm — merchants’ balances update automatically." />
    <CashDesk pending={waiting} />
    <section className="card overflow-x-auto">
      <h2 className="px-5 pt-4 text-[15px] font-semibold">Checked in</h2>
      <table className="w-full min-w-[640px] border-collapse text-[13px]">
        <thead className="bg-white/30"><tr><th className="th pl-5">Driver</th><th className="th">When</th><th className="th text-right">Expected</th><th className="th text-right">Counted</th><th className="th text-right">Difference</th><th className="th pr-5">Status</th></tr></thead>
        <tbody>{((done ?? []) as any[]).map((h) => (
          <tr key={h.id} className="border-t border-line">
            <td className="td pl-5 font-medium">{h.driver?.full_name ?? '—'}{h.note ? <span className="block text-xs font-normal text-ink-3">{h.note}</span> : null}</td>
            <td className="td">{h.confirmed_at ? new Date(h.confirmed_at).toLocaleString('en-GB', { timeZone: 'Europe/Belgrade', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
            <td className="td text-right font-mono">{euro(h.expected_amount)}</td>
            <td className="td text-right font-mono">{h.counted_amount != null ? euro(h.counted_amount) : '—'}</td>
            <td className={`td text-right font-mono ${Number(h.difference) < 0 ? 'text-danger-ink' : ''}`}>{h.difference != null ? euro(h.difference) : '—'}</td>
            <td className="td pr-5"><Pill bg={h.status === 'confirmed' ? '#E8F8EF' : '#FDECEC'} ink={h.status === 'confirmed' ? '#067647' : '#B42318'}>{h.status === 'confirmed' ? 'Received' : 'Difference'}</Pill></td>
          </tr>))}
        </tbody>
      </table>
      {(done ?? []).length === 0 && <Empty title="Nothing checked in yet" body="Confirmed cash handovers appear here." />}
    </section>
  </>);
}
