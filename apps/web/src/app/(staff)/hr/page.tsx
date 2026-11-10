import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty, StatCard, Avatar } from "@/components/ui";
import { euro, phonePretty } from '@routa/shared';
export const metadata = { title: 'HR & Payroll' };
const SH: Record<string, string> = { morning: '#EEF0FF', afternoon: '#E9F3FF', full: '#E8F8EF', off: '#F0F2F7', leave: '#FFF4E5', sick: '#FDECEC' };
export default async function Page() {
  const ws = await requireStaff(); const sb = await createClient();
  const start = new Date(); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const days = Array.from({ length: 6 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d.toISOString().slice(0, 10); });
  const [{ data: emp }, { data: shifts }] = await Promise.all([
    sb.from('employees').select('id, full_name, phone, job_title, department, pay_model, base_salary, per_stop_rate, hourly_rate, start_date, status').eq('org_id', ws.org.id).order('department').order('full_name'),
    sb.from('shifts').select('employee_id, date, type, start_time, end_time').eq('org_id', ws.org.id).gte('date', days[0]).lte('date', days[5])
  ]);
  const payroll = ((emp ?? []) as any[]).reduce((s, e) => s + Number(e.base_salary || 0), 0);
  return (<>
    <PageHeader title="HR & Payroll" subtitle={`${emp?.length ?? 0} staff · base payroll ${euro(payroll, 0)} / month`} />
    <section className="card overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-[13px]">
      <thead className="bg-[#FAFBFD]"><tr><th className="th pl-5">Employee</th><th className="th">Role</th><th className="th">Pay</th>{days.map((d) => <th key={d} className="th text-center">{new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}</th>)}</tr></thead>
      <tbody>{((emp ?? []) as any[]).map((e) => (
        <tr key={e.id} className="border-t border-line"><td className="td pl-5"><span className="flex items-center gap-2.5"><Avatar name={e.full_name} size={28} /><span className="flex flex-col"><span className="font-medium">{e.full_name}</span><span className="text-xs text-ink-3">{phonePretty(e.phone)}</span></span></span></td>
          <td className="td text-ink-2">{e.job_title}</td>
          <td className="td font-mono text-xs">{e.pay_model === 'hourly' ? `${euro(e.hourly_rate)}/h` : e.pay_model === 'per_stop' ? `${euro(e.per_stop_rate)}/stop` : `${euro(e.base_salary, 0)}${Number(e.per_stop_rate) ? ` + ${euro(e.per_stop_rate)}/stop` : ''}`}</td>
          {days.map((d) => { const s = ((shifts ?? []) as any[]).find((x) => x.employee_id === e.id && x.date === d); return <td key={d} className="td text-center">{s ? <span className="rounded-md px-1.5 py-0.5 text-[11px]" style={{ background: SH[s.type] ?? '#F0F2F7' }}>{s.type === 'off' || s.type === 'leave' || s.type === 'sick' ? s.type : `${String(s.start_time).slice(0, 5)}–${String(s.end_time).slice(0, 5)}`}</span> : '—'}</td>; })}</tr>))}</tbody></table></section>
  </>);
}
