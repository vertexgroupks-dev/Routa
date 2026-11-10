import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty, StatCard } from "@/components/ui";
import { todayKs } from '@routa/shared';
import { ActionButton } from '../_actions';
export const metadata = { title: 'Pick & Pack' };
export default async function Page() {
  const ws = await requireStaff(); const sb = await createClient();
  const [{ data: lists }, { data: toPack }] = await Promise.all([
    sb.from('pick_lists').select('id, status, dock, created_at, route:routes(code, date, driver:drivers(full_name)), items:pick_list_items(id)').eq('org_id', ws.org.id).order('created_at', { ascending: false }).limit(30),
    sb.from('orders').select('id, code, status, customer_name, merchant:merchants(name)').eq('org_id', ws.org.id).in('status', ['received']).gte('delivery_date', todayKs()).order('delivery_date').limit(60)
  ]);
  return (<>
    <PageHeader title="Pick & Pack" subtitle="Pick lists are created automatically when Dispatch publishes routes. Parcels in the warehouse are packed here." />
    <div className="flex flex-wrap items-start gap-4">
      <section className="card min-w-0 flex-[1_1_420px] p-5"><h2 className="mb-3 text-base font-semibold">Pick lists</h2>
        {((lists ?? []) as any[]).map((l) => <div key={l.id} className="flex items-center gap-3 border-t border-line py-2.5 text-[13px]"><span className="font-mono font-medium">{l.route?.code ?? '—'}</span><span className="flex-1">{l.route?.driver?.full_name} · {l.items?.length ?? 0} parcels · {l.dock ?? ''}</span><Pill bg="#F0F2F7" ink="#5B6378">{l.status}</Pill>{l.status !== 'loaded' && <ActionButton kind="ghost" label="Mark loaded" run={JSON.stringify({ table: 'pick_lists', id: l.id, patch: { status: 'loaded', finished_at: new Date().toISOString() } })} />}</div>)}
        {(lists ?? []).length === 0 && <Empty title="No pick lists yet" body="Publish routes in Dispatch to create them." />}</section>
      <section className="card min-w-0 flex-[1_1_420px] p-5"><h2 className="mb-3 text-base font-semibold">Ready to pack ({toPack?.length ?? 0})</h2>
        {((toPack ?? []) as any[]).map((o) => <div key={o.id} className="flex items-center gap-3 border-t border-line py-2.5 text-[13px]"><span className="font-mono font-medium">{o.code}</span><span className="flex-1">{o.customer_name} · {o.merchant?.name}</span><ActionButton kind="ghost" label="Packed" run={JSON.stringify({ rpc: 'set_order_status', args: { p_order_id: o.id, p_status: 'packed', p_note: 'Packed in warehouse' } })} /></div>)}
        {(toPack ?? []).length === 0 && <Empty title="Nothing waiting to be packed" />}</section>
    </div>
  </>);
}
