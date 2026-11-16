import Link from 'next/link';
import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Empty } from '@/components/ui';
import { MarkAllRead } from './MarkAllRead';

export const metadata = { title: 'Notifications' };

export default async function Page() {
  const ws = await requireStaff();
  const sb = await createClient();
  const { data } = await sb.from('notifications').select('id, type, title, body, link, read_at, created_at').eq('user_id', ws.userId).order('created_at', { ascending: false }).limit(100);
  const unread = (data ?? []).filter((n) => !n.read_at).length;
  return (
    <>
      <PageHeader title="Notifications" subtitle={`${unread} unread`}>{unread > 0 && <MarkAllRead userId={ws.userId} />}</PageHeader>
      <section className="card flex flex-col">
        {(data ?? []).map((n) => (
          <Link key={n.id} href={n.link ?? '#'} className={`flex items-start gap-3 border-b border-line px-5 py-3.5 text-[13px] last:border-0 hover:bg-canvas ${n.read_at ? '' : 'bg-brand-tint/40'}`}>
            <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${n.read_at ? 'bg-line' : 'bg-brand'}`} />
            <span className="flex flex-1 flex-col"><span className="font-medium">{n.title}</span>{n.body && <span className="text-ink-2">{n.body}</span>}</span>
            <span className="font-mono text-xs text-ink-3">{new Date(n.created_at).toLocaleString('en-GB', { timeZone: 'Europe/Belgrade', dateStyle: 'short', timeStyle: 'short' })}</span>
          </Link>
        ))}
        {(data ?? []).length === 0 && <Empty title="Nothing yet" body="Expiring documents, payouts, invoices and route changes show up here." />}
      </section>
    </>
  );
}
