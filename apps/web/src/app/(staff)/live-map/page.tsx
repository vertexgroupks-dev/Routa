import Link from 'next/link';
import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Pill, Empty } from '@/components/ui';
import { MapView, type MapMarker, type MapLine } from '@/components/MapView';
import { todayKs } from '@routa/shared';
import { AutoRefresh } from './AutoRefresh';
export const metadata = { title: 'Live map' };

const ago = (iso?: string | null) => {
  if (!iso) return 'never';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ago`;
};

export default async function Page({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const ws = await requireStaff('/live-map'); const sb = await createClient();
  const sp = await searchParams;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayKs();
  const [{ data: map }, { data: positions }, { data: routes }] = await Promise.all([
    sb.rpc('day_map', { p_org: ws.org.id, p_date: date }),
    sb.from('driver_positions').select('driver_id, route_id, lat, lng, speed_kmh, battery, recorded_at, driver:drivers(full_name, color, phone)').eq('org_id', ws.org.id),
    sb.from('routes').select('id, code, status, color, driver_id, driver:drivers(full_name), stops:route_stops(status)').eq('org_id', ws.org.id).eq('date', date).not('status', 'in', '(draft,cancelled)').order('code')
  ]);

  const markers: MapMarker[] = [];
  const lines: MapLine[] = [];
  if (map?.hub?.lat) markers.push({ lat: map.hub.lat, lng: map.hub.lng, kind: 'hub', title: map.hub.name ?? 'Hub' });
  for (const r of ((map?.routes ?? []) as any[]).filter((x) => x.status !== 'draft')) {
    if (r.line?.coordinates?.length) lines.push({ color: r.color ?? '#5B5CF6', coords: r.line.coordinates.map((c: number[]) => [c[1], c[0]]), dashed: r.status === 'published' });
    for (const st of r.stops ?? []) {
      const done = ['delivered', 'failed', 'skipped'].includes(st.status);
      markers.push({ lat: st.lat, lng: st.lng, label: done ? (st.status === 'delivered' ? '✓' : '!') : String(st.seq), color: done ? (st.status === 'delivered' ? '#0F9F5F' : '#D92D20') : r.color, title: `${r.code} · stop ${st.seq} · ${st.code}`, sub: `${st.name} · ${st.status}`, href: `/orders/${st.order_id}` });
    }
  }
  // Drivers seen in the last 12 hours
  const fresh = ((positions ?? []) as any[]).filter((p) => p.lat != null && Date.now() - new Date(p.recorded_at).getTime() < 12 * 3600_000);
  for (const p of fresh) {
    const initials = (p.driver?.full_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    markers.push({ lat: p.lat, lng: p.lng, label: `🚚 ${initials}`, color: p.driver?.color ?? '#0E1325', title: p.driver?.full_name ?? 'Driver', sub: `Seen ${ago(p.recorded_at)}${p.speed_kmh != null ? ` · ${p.speed_kmh} km/h` : ''}` });
  }
  const posOf = new Map(((positions ?? []) as any[]).map((p) => [p.driver_id, p]));

  return (<>
    <AutoRefresh />
    <PageHeader title="Live map" subtitle={`${date} · ${(routes ?? []).length} published route(s) · ${fresh.length} driver(s) sharing location · refreshes every 20 s`}>
      <form className="flex gap-2"><input type="date" name="date" key={date} defaultValue={date} className="input py-2" /><button className="btn-ghost">Show</button></form>
    </PageHeader>
    <MapView height={520} markers={markers} lines={lines} keepView />
    <section className="card flex flex-col">
      {((routes ?? []) as any[]).map((r) => {
        const total = r.stops?.length ?? 0;
        const done = (r.stops ?? []).filter((s: any) => ['delivered', 'failed', 'skipped'].includes(s.status)).length;
        const p = posOf.get(r.driver_id);
        return (
          <Link key={r.id} href={`/dispatch/${r.id}`} className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-3 text-[13px] last:border-0 hover:bg-white/40">
            <span className="h-3 w-3 flex-none rounded-full" style={{ background: r.color ?? '#5B5CF6' }} />
            <span className="w-16 font-mono font-medium">{r.code}</span>
            <span className="min-w-[140px] flex-1 font-medium">{r.driver?.full_name ?? 'No driver'}</span>
            <span className="w-40"><span className="block h-1.5 overflow-hidden rounded bg-white/70"><span className="block h-1.5 rounded bg-success" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></span><span className="text-xs text-ink-3">{done}/{total} stops</span></span>
            <span className="w-32 text-xs text-ink-3">{p ? `Seen ${ago(p.recorded_at)}` : 'No location yet'}</span>
            <Pill bg={r.status === 'in_progress' ? '#E8F8EF' : '#EEF0FF'} ink={r.status === 'in_progress' ? '#067647' : '#3B38BF'}>{r.status.replace('_', ' ')}</Pill>
          </Link>
        );
      })}
      {(routes ?? []).length === 0 && <Empty title="No published routes for this day" body="Publish routes in Dispatch. Drivers appear on the map once they start loading or driving." />}
    </section>
  </>);
}
