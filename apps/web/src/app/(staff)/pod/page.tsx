import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty, StatCard, Avatar } from "@/components/ui";
import { time } from '@routa/shared';
import { ActionButton } from '../_actions';
export const metadata = { title: 'Proof of Delivery' };
export default async function Page({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const sp = await searchParams; const ws = await requireStaff('/pod'); const sb = await createClient();
  let q = sb.from('pods').select('id, recipient_type, recipient_name, signature_path, distance_to_address_m, review_status, delivered_at, order:orders(id, code, customer_name, address_line), driver:drivers(full_name), photos:pod_photos(path)').eq('org_id', ws.org.id).order('delivered_at', { ascending: false }).limit(100);
  if (!sp.all) q = q.eq('review_status', 'flagged');
  const { data } = await q;
  // Short-lived links to the private photos and signatures (valid 1 hour)
  const rows = (data ?? []) as any[];
  const photoPaths = rows.flatMap((p) => (p.photos ?? []).map((x: any) => x.path)).filter(Boolean);
  const sigPaths = rows.map((p) => p.signature_path).filter(Boolean);
  const [ph, sg] = await Promise.all([
    photoPaths.length ? sb.storage.from('pod-photos').createSignedUrls(photoPaths, 3600) : Promise.resolve({ data: [] as any[] }),
    sigPaths.length ? sb.storage.from('signatures').createSignedUrls(sigPaths, 3600) : Promise.resolve({ data: [] as any[] })
  ]);
  const url = new Map<string, string>([...(ph.data ?? []), ...(sg.data ?? [])].filter((x: any) => x?.signedUrl && x?.path).map((x: any) => [x.path, x.signedUrl]));
  return (<>
    <PageHeader title="Proof of Delivery" subtitle={sp.all ? 'All deliveries with proof' : 'Deliveries flagged for review (far from address, no photo, or not the customer)'}>
      <a href="/pod" className={sp.all ? 'btn-ghost' : 'btn-dark'}>Needs review</a><a href="/pod?all=1" className={sp.all ? 'btn-dark' : 'btn-ghost'}>All</a>
    </PageHeader>
    <section className="card flex flex-col">{((data ?? []) as any[]).map((p) => (
      <div key={p.id} className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-3.5 text-[13px] last:border-0">
        <span className="font-mono font-medium">{p.order?.code}</span>
        <span className="flex min-w-[220px] flex-1 flex-col"><span className="font-medium">{p.order?.customer_name} · {p.order?.address_line}</span><span className="text-xs text-ink-3">{p.driver?.full_name} · {time(p.delivered_at)} · given to {p.recipient_name} ({p.recipient_type}) · {p.distance_to_address_m ?? '?'} m from address</span></span>
        <span className="flex items-center gap-2">
          {(p.photos ?? []).map((x: any) => url.get(x.path) && <a key={x.path} href={url.get(x.path)} target="_blank" rel="noopener noreferrer"><img src={url.get(x.path)} alt="Delivery photo" className="h-14 w-14 rounded-lg object-cover ring-1 ring-line" /></a>)}
          {p.signature_path && url.get(p.signature_path) && <img src={url.get(p.signature_path)} alt="Signature" className="h-14 w-24 rounded-lg bg-white object-contain ring-1 ring-line" />}
          {!(p.photos ?? []).length && !p.signature_path && <span className="text-xs text-ink-3">No photo / signature</span>}
        </span>
        <Pill bg={p.review_status === 'flagged' ? '#FFF4E5' : '#E8F8EF'} ink={p.review_status === 'flagged' ? '#B54708' : '#067647'}>{p.review_status.replace('_', ' ')}</Pill>
        {p.review_status === 'flagged' && <><ActionButton label="Approve" run={JSON.stringify({ table: 'pods', id: p.id, patch: { review_status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: ws.userId } })} /><ActionButton kind="ghost" label="Reject" run={JSON.stringify({ table: 'pods', id: p.id, patch: { review_status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: ws.userId } })} /></>}
      </div>))}
      {(data ?? []).length === 0 && <Empty title="Nothing to review" />}</section>
  </>);
}
