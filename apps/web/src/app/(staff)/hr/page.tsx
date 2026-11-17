import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty, StatCard, Avatar, Accordion } from "@/components/ui";
import { RecordForm, type Field } from "@/components/RecordForm";
import { euro, phonePretty } from '@routa/shared';
import { PayrollRun, ApprovePayroll } from './PayrollRun';
const EMP_FIELDS: Field[] = [
  { key: 'full_name', label: 'Full name' }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
  { key: 'job_title', label: 'Job title', placeholder: 'Driver, Dispatcher…' },
  { key: 'department', label: 'Department', type: 'select', options: [['drivers', 'Drivers'], ['warehouse', 'Warehouse'], ['dispatch', 'Dispatch'], ['office', 'Office'], ['finance', 'Finance']] },
  { key: 'pay_model', label: 'Pay model', type: 'select', options: [['salary', 'Monthly salary'], ['salary_plus_stop', 'Salary + per stop'], ['per_stop', 'Per stop only'], ['hourly', 'Hourly']] },
  { key: 'base_salary', label: 'Monthly salary €', type: 'number' }, { key: 'per_stop_rate', label: 'Per stop €', type: 'number' }, { key: 'hourly_rate', label: 'Per hour €', type: 'number' },
  { key: 'start_date', label: 'Start date', type: 'date' }, { key: 'iban', label: 'IBAN', span: 2 }
];
export const metadata = { title: 'HR & Payroll' };
const SH: Record<string, string> = { morning: '#EEF0FF', afternoon: '#E9F3FF', full: '#E8F8EF', off: '#F0F2F7', leave: '#FFF4E5', sick: '#FDECEC' };
export default async function Page() {
  const ws = await requireStaff('/hr'); const sb = await createClient();
  const start = new Date(); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const days = Array.from({ length: 6 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d.toISOString().slice(0, 10); });
  const [{ data: emp }, { data: shifts }, { data: runs }] = await Promise.all([
    sb.from('employees').select('id, full_name, phone, job_title, department, pay_model, base_salary, per_stop_rate, hourly_rate, start_date, status').eq('org_id', ws.org.id).order('department').order('full_name'),
    sb.from('shifts').select('employee_id, date, type, start_time, end_time').eq('org_id', ws.org.id).gte('date', days[0]).lte('date', days[5]),
    sb.from('payroll_runs').select('id, period_start, period_end, status, total, created_at, slips:payslips(id, base, stop_count, stop_bonus, hours, deductions, net, employee:employees(full_name, job_title))').eq('org_id', ws.org.id).order('created_at', { ascending: false }).limit(3)
  ]);
  const payroll = ((emp ?? []) as any[]).reduce((s, e) => s + Number(e.base_salary || 0), 0);
  return (<>
    <PageHeader title="People & payroll" subtitle={`${emp?.length ?? 0} staff · base payroll ${euro(payroll, 0)} / month`}>
      <RecordForm table="employees" kind="primary" label="+ Add employee" extra={{ org_id: ws.org.id, hub_id: ws.hub?.id }} initial={{ pay_model: 'salary', department: 'drivers', status: 'active' }} fields={EMP_FIELDS} />
    </PageHeader>
    {['owner', 'admin', 'finance', 'hr'].includes(ws.role) && <PayrollRun orgId={ws.org.id} />}
    {((runs ?? []) as any[]).map((r, idx) => (
      <Accordion key={r.id} defaultOpen={idx === 0} icon="wallet" title={`Payroll ${r.period_start} → ${r.period_end}`} meta={`${euro(r.total)} · ${r.status}`}>
      <section className="overflow-x-auto">
        <div className="flex flex-wrap items-center gap-3 px-5 pt-4"><span className="flex-1" /><Pill bg={r.status === 'approved' ? '#E8F8EF' : '#FFF4E5'} ink={r.status === 'approved' ? '#067647' : '#B54708'}>{r.status}</Pill>{r.status === 'draft' && ['owner', 'admin', 'finance'].includes(ws.role) && <ApprovePayroll id={r.id} />}</div>
        <table className="mt-2 w-full min-w-[760px] border-collapse text-[13px]"><thead className="bg-white/30"><tr><th className="th pl-5">Employee</th><th className="th text-right">Base</th><th className="th text-right">Stops</th><th className="th text-right">Bonus</th><th className="th text-right">Hours</th><th className="th text-right">Deductions</th><th className="th pr-5 text-right">Net</th></tr></thead>
        <tbody>{(r.slips ?? []).sort((a: any, b: any) => b.net - a.net).map((p: any) => <tr key={p.id} className="border-t border-line"><td className="td pl-5"><span className="font-medium">{p.employee?.full_name}</span> <span className="text-xs text-ink-3">{p.employee?.job_title}</span></td><td className="td text-right font-mono">{euro(p.base)}</td><td className="td text-right font-mono">{p.stop_count}</td><td className="td text-right font-mono">{euro(p.stop_bonus)}</td><td className="td text-right font-mono">{p.hours}</td><td className={`td text-right font-mono ${Number(p.deductions) > 0 ? 'text-danger-ink' : ''}`}>{Number(p.deductions) > 0 ? '−' + euro(p.deductions) : '—'}</td><td className="td pr-5 text-right font-mono font-semibold">{euro(p.net)}</td></tr>)}</tbody></table>
      </section></Accordion>))}
    <section className="card overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-[13px]">
      <thead className="bg-white/30"><tr><th className="th pl-5">Employee</th><th className="th">Role</th><th className="th">Pay</th>{days.map((d) => <th key={d} className="th text-center">{new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}</th>)}</tr></thead>
      <tbody>{((emp ?? []) as any[]).map((e) => (
        <tr key={e.id} className="border-t border-line"><td className="td pl-5"><span className="flex items-center gap-2.5"><Avatar name={e.full_name} size={28} /><span className="flex flex-col"><span className="font-medium">{e.full_name}</span><span className="text-xs text-ink-3">{phonePretty(e.phone)}</span></span></span></td>
          <td className="td text-ink-2">{e.job_title}</td>
          <td className="td font-mono text-xs">{e.pay_model === 'hourly' ? `${euro(e.hourly_rate)}/h` : e.pay_model === 'per_stop' ? `${euro(e.per_stop_rate)}/stop` : `${euro(e.base_salary, 0)}${Number(e.per_stop_rate) ? ` + ${euro(e.per_stop_rate)}/stop` : ''}`}</td>
          {days.map((d) => { const s = ((shifts ?? []) as any[]).find((x) => x.employee_id === e.id && x.date === d); return <td key={d} className="td text-center">{s ? <span className="rounded-md px-1.5 py-0.5 text-[11px]" style={{ background: SH[s.type] ?? '#F0F2F7' }}>{s.type === 'off' || s.type === 'leave' || s.type === 'sick' ? s.type : `${String(s.start_time).slice(0, 5)}–${String(s.end_time).slice(0, 5)}`}</span> : '—'}</td>; })}</tr>))}</tbody></table></section>
  </>);
}
