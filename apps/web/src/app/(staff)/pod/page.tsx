import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty, StatCard, Avatar } from "@/components/ui";
import { time } from '@routa/shared';
import { ActionButton } from '../_actions';
export const metadata = { title: 'Proof of Delivery' };
export default async function Page({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const sp = await searchParams; const ws = await requireStaff(); const sb = await createClient();
  let q = sb.from('pods').select('id, recipient_type, recipient_name, distance_to_address_m, review_status, delivered_at, order:orders(code, customer_name, address_line), driver:drivers(full_name)').eq('org_id', ws.org.id).order('delivered_at', { ascending: false }).limit(100);
  if (!sp.all) q = q.eq('review_status', 'flagged');
  const { data } = await q;
  return (<>
    <PageHeader title="Proof of Delivery" subtitle={sp.all ? 'All deliveries with proof' : 'Deliveries flagged for review (far from address, no photo, or not the customer)'}>
      <a href="/pod" className={sp.all ? 'btn-ghost' : 'btn-dark'}>Needs review</a><a href="/pod?all=1" className={sp.all ? 'btn-dark' : 'btn-ghost'}>All</a>
    </PageHeader>
    <section className="card flex flex-col">{((data ?? []) as any[]).map((p) => (
      <div key={p.id} className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-3.5 text-[13px] last:border-0">
        <span className="font-mono font-medium">{p.order?.code}</span>
        <span className="flex min-w-[220px] flex-1 flex-col"><span className="font-medium">{p.order?.customer_name} · {p.order?.address_line}</span><span className="text-xs text-ink-3">{p.driver?.full_name} · {time(p.delivered_at)} · given to {p.recipient_name} ({p.recipient_type}) · {p.distance_to_address_m ?? '?'} m from address</span></span>
        <Pill bg={p.review_status === 'flagged' ? '#FFF4E5' : '#E8F8EF'} ink={p.review_status === 'flagged' ? '#B54708' : '#067647'}>{p.review_status.replace('_', ' ')}</Pill>
        {p.review_status === 'flagged' && <><ActionButton label="Approve" run={JSON.stringify({ table: 'pods', id: p.id, patch: { review_status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: ws.userId } })} /><ActionButton kind="ghost" label="Reject" run={JSON.stringify({ table: 'pods', id: p.id, patch: { review_status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: ws.userId } })} /></>}
      </div>))}
      {(data ?? []).length === 0 && <Empty title="Nothing to review" />}</section>
  </>);
}
