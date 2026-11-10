import Link from 'next/link';
import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { StatusPill, PageHeader, Empty } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ORDER_TABS, euro, phonePretty, type OrderStatus } from '@routa/shared';

export const metadata = { title: 'Orders' };
const PAGE = 50;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; page?: string; date?: string }> }) {
  const sp = await searchParams;
  const ws = await requireStaff();
  const supabase = await createClient();
  const tab = ORDER_TABS.find((t) => t.key === sp.tab) ?? ORDER_TABS[0]!;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? '').trim();

  let query = supabase
    .from('orders')
    .select('id, code, status, customer_name, customer_phone, address_line, city, delivery_date, cod_amount, delivery_fee, needs_pin, attempts, merchant:merchants(name, code), zone:zones(name, color)', { count: 'exact' })
    .eq('org_id', ws.org.id)
    .order('delivery_date', { ascending: false })
    .order('code', { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (tab.statuses) query = query.in('status', tab.statuses);
  if (sp.date) query = query.eq('delivery_date', sp.date);
  if (q) query = query.or(`code.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q.replace(/\s/g, '')}%,address_line.ilike.%${q}%,tracking_code.ilike.%${q}%`);
  const { data: orders, count, error } = await query;

  const counts = await Promise.all(ORDER_TABS.map(async (t) => {
    let c = supabase.from('orders').select('id', { count: 'exact', head: true }).eq('org_id', ws.org.id);
    if (t.statuses) c = c.in('status', t.statuses);
    return (await c).count ?? 0;
  }));
  const href = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const merged = { tab: tab.key, q: q || undefined, date: sp.date, ...p };
    Object.entries(merged).forEach(([k, v]) => v && u.set(k, v));
    return `/orders?${u.toString()}`;
  };

  return (
    <>
      <PageHeader title="Orders" subtitle={`${count ?? 0} orders${q ? ` matching “${q}”` : ''} · every parcel from every merchant in one list.`}>
        <Link href="/orders/new" className="btn-primary"><Icon name="plus" size={16} color="#fff" strokeWidth={2} />New order</Link>
      </PageHeader>

      <div className="flex flex-wrap gap-1 border-b border-line">
        {ORDER_TABS.map((t, i) => (
          <Link key={t.key} href={href({ tab: t.key, page: undefined })} className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm ${t.key === tab.key ? 'border-brand font-medium text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}>
            {t.label}<span className="rounded-full bg-field px-1.5 text-xs text-ink-2">{counts[i]}</span>
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/orders">
        <input type="hidden" name="tab" value={tab.key} />
        <input name="q" defaultValue={q} placeholder="Search code, customer, phone, address…" className="input max-w-[340px] py-2" />
        <input name="date" type="date" defaultValue={sp.date} className="input w-auto py-2" />
        <button className="btn-ghost">Filter</button>
        {(q || sp.date) && <Link href={`/orders?tab=${tab.key}`} className="text-[13px] text-ink-2">Clear</Link>}
      </form>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-[13px]">
            <thead className="bg-[#FAFBFD]"><tr>
              <th className="th pl-5">Order</th><th className="th">Customer</th><th className="th">Address</th><th className="th">Merchant</th>
              <th className="th">Zone</th><th className="th">Date</th><th className="th text-right">COD</th><th className="th pr-5">Status</th>
            </tr></thead>
            <tbody>
              {(orders ?? []).map((o: any) => (
                <tr key={o.id} className="border-t border-line hover:bg-[#FAFBFD]">
                  <td className="td pl-5"><Link href={`/orders/${o.id}`} className="font-mono font-medium text-brand-hover">{o.code}</Link></td>
                  <td className="td"><span className="flex flex-col"><span className="font-medium">{o.customer_name}</span><span className="text-xs text-ink-3">{phonePretty(o.customer_phone)}</span></span></td>
                  <td className="td max-w-[240px]"><span className="flex items-center gap-1.5">{o.needs_pin && <span title="Needs a map pin" className="h-1.5 w-1.5 flex-none rounded-full bg-danger" />}<span className="truncate text-ink-2">{o.address_line}{o.city ? `, ${o.city}` : ''}</span></span></td>
                  <td className="td text-ink-2">{o.merchant?.name ?? '—'}</td>
                  <td className="td">{o.zone ? <span className="inline-flex items-center gap-1.5 text-ink-2"><span className="h-2 w-2 rounded-sm" style={{ background: o.zone.color }} />{o.zone.name}</span> : <span className="text-danger-ink">No zone</span>}</td>
                  <td className="td font-mono text-ink-2">{o.delivery_date ?? '—'}</td>
                  <td className="td text-right font-mono">{Number(o.cod_amount) > 0 ? euro(o.cod_amount) : '—'}</td>
                  <td className="td pr-5"><StatusPill status={o.status as OrderStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {error && <p className="p-5 text-danger-ink">{error.message}</p>}
          {!error && (orders ?? []).length === 0 && <Empty title="No orders here" body="Try another tab or clear the search." />}
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[13px] text-ink-2">
          <span>Page {page} of {Math.max(1, Math.ceil((count ?? 0) / PAGE))}</span>
          <span className="flex gap-2">
            {page > 1 && <Link className="btn-ghost py-1.5" href={href({ page: String(page - 1) })}>Previous</Link>}
            {page * PAGE < (count ?? 0) && <Link className="btn-ghost py-1.5" href={href({ page: String(page + 1) })}>Next</Link>}
          </span>
        </div>
      </section>
    </>
  );
}
