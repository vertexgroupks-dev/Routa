import Link from 'next/link';
import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Empty, StatusPill, Pill } from '@/components/ui';
import { TICKET_TYPE, phonePretty, type OrderStatus, type TicketType } from '@routa/shared';
import { ResolveButton } from './ResolveButton';

export const metadata = { title: 'Helpdesk' };

export default async function HelpdeskPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const ws = await requireStaff();
  const supabase = await createClient();
  const show = sp.status === 'resolved' ? 'resolved' : 'open';
  let q = supabase.from('tickets').select('id, type, status, priority, title, description, created_at, order:orders(id, code, status, customer_name, customer_phone, address_line)').eq('org_id', ws.org.id).order('priority').order('created_at', { ascending: false }).limit(100);
  q = show === 'open' ? q.neq('status', 'resolved') : q.eq('status', 'resolved');
  const { data: tickets } = await q;
  return (
    <>
      <PageHeader title="Helpdesk" subtitle="Failed deliveries, wrong addresses, proof-of-delivery reviews and cash differences — one queue.">
        <Link href="/helpdesk" className={show === 'open' ? 'btn-dark' : 'btn-ghost'}>Open</Link>
        <Link href="/helpdesk?status=resolved" className={show === 'resolved' ? 'btn-dark' : 'btn-ghost'}>Resolved</Link>
      </PageHeader>
      <section className="card flex flex-col">
        {(tickets ?? []).map((t: any) => (
          <div key={t.id} className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-4 last:border-0">
            <span className="flex min-w-[260px] flex-1 flex-col gap-1">
              <span className="flex items-center gap-2"><Pill bg={t.priority === 1 ? '#FDECEC' : '#F0F2F7'} ink={t.priority === 1 ? '#B42318' : '#5B6378'}>{TICKET_TYPE[t.type as TicketType]}</Pill><span className="text-sm font-medium">{t.title}</span></span>
              <span className="text-[13px] text-ink-2">{t.description}</span>
              {t.order && <span className="text-xs text-ink-3">{t.order.customer_name} · {phonePretty(t.order.customer_phone)} · {t.order.address_line}</span>}
            </span>
            {t.order && <StatusPill status={t.order.status as OrderStatus} />}
            {t.order && <a href={`tel:${t.order.customer_phone}`} className="btn-ghost">Call</a>}
            {t.order && <Link href={`/orders/${t.order.id}`} className="btn-ghost">Open order</Link>}
            {t.status !== 'resolved' && <ResolveButton id={t.id} />}
          </div>
        ))}
        {(tickets ?? []).length === 0 && <Empty title={show === 'open' ? 'Nothing waiting' : 'No resolved tickets yet'} />}
      </section>
    </>
  );
}
