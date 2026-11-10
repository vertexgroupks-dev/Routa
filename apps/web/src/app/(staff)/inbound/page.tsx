import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty, StatCard } from "@/components/ui";
import { ActionButton } from '../_actions';
export const metadata = { title: 'Inbound' };
const S: Record<string, [string, string]> = { expected: ['#F0F2F7', '#5B6378'], in_transit: ['#E9F3FF', '#175CD3'], receiving: ['#FFF4E5', '#B54708'], received: ['#E8F8EF', '#067647'], cancelled: ['#FDECEC', '#B42318'] };
export default async function Page() {
  const ws = await requireStaff(); const sb = await createClient();
  const { data } = await sb.from('inbound_shipments').select('id, code, status, expected_at, arrived_at, packages, merchant:merchants(name), lines:inbound_lines(expected_qty, received_qty, damaged_qty, sku:skus(sku, name))').eq('org_id', ws.org.id).order('expected_at', { ascending: false });
  return (<>
    <PageHeader title="Inbound" subtitle="Merchant stock arriving at the warehouse." />
    <section className="flex flex-col gap-3">{((data ?? []) as any[]).map((i) => (
      <div key={i.id} className="card flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-3"><span className="font-mono font-semibold">{i.code}</span><span className="font-medium">{i.merchant?.name}</span><span className="text-[13px] text-ink-3">{i.packages} · expected {new Date(i.expected_at).toLocaleString('en-GB', { timeZone: 'Europe/Belgrade', dateStyle: 'short', timeStyle: 'short' })}</span><span className="flex-1" /><Pill bg={S[i.status]?.[0] ?? '#F0F2F7'} ink={S[i.status]?.[1] ?? '#5B6378'}>{i.status.replace('_', ' ')}</Pill>
          {i.status !== 'received' && i.status !== 'cancelled' && <ActionButton label={i.status === 'receiving' ? 'Mark received' : 'Start receiving'} run={JSON.stringify({ table: 'inbound_shipments', id: i.id, patch: i.status === 'receiving' ? { status: 'received' } : { status: 'receiving', arrived_at: new Date().toISOString() } })} />}</div>
        {i.lines?.length > 0 && <table className="w-full text-[13px]"><tbody>{i.lines.map((l: any, k: number) => <tr key={k} className="border-t border-line"><td className="td font-mono">{l.sku?.sku}</td><td className="td">{l.sku?.name}</td><td className="td text-right font-mono">{l.received_qty}/{l.expected_qty}</td><td className="td text-right text-danger-ink">{l.damaged_qty ? `${l.damaged_qty} damaged` : ''}</td></tr>)}</tbody></table>}
      </div>))}
      {(data ?? []).length === 0 && <div className="card"><Empty title="Nothing arriving" /></div>}</section>
  </>);
}
