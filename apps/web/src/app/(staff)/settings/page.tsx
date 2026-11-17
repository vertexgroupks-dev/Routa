import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty, StatCard, Avatar, Accordion } from "@/components/ui";
import { euro } from '@routa/shared';
import { ZonePrice } from './ZonePrice';
import { HubLocation } from './HubLocation';
export const metadata = { title: 'Settings' };
export default async function Page() {
  const ws = await requireStaff('/settings'); const sb = await createClient();
  const [{ data: zones }, { data: hub }, { data: point }] = await Promise.all([
    sb.from('zones').select('id, name, color, base_fee, sla, cutoff_time, delivery_days, active').eq('org_id', ws.org.id).order('sort'),
    sb.from('hubs').select('id, name, address').eq('org_id', ws.org.id).order('is_default', { ascending: false }).order('created_at').limit(1).maybeSingle(),
    sb.rpc('hub_point', { p_org: ws.org.id })
  ]);
  const s = (ws.org.settings ?? {}) as Record<string, any>;
  return (<>
    <PageHeader title="Settings" subtitle="Zones, prices and delivery rules. New orders use these automatically." />
    <div className="flex flex-wrap items-start gap-4">
      <section className="card min-w-0 flex-[2_1_520px] overflow-x-auto"><h2 className="px-5 pt-5 text-base font-semibold">Zones & prices</h2>
        <table className="mt-2 w-full min-w-[560px] border-collapse text-[13px]"><thead><tr><th className="th pl-5">Zone</th><th className="th">Service</th><th className="th">Cut-off</th><th className="th pr-5 text-right">Base fee</th></tr></thead>
        <tbody>{((zones ?? []) as any[]).map((z) => <tr key={z.id} className="border-t border-line"><td className="td pl-5"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: z.color }} />{z.name}</span></td><td className="td text-ink-2">{z.sla}</td><td className="td font-mono text-ink-2">{String(z.cutoff_time).slice(0, 5)}</td><td className="td pr-5 text-right"><ZonePrice id={z.id} value={Number(z.base_fee)} /></td></tr>)}</tbody></table></section>
      <div className="min-w-0 flex-[1_1_300px]"><Accordion title="Delivery rules" icon="settings"><div className="flex flex-col gap-2.5 p-5 text-[13px]">
        {[['Max delivery attempts', s.max_attempts], ['Included weight', `${s.base_weight_kg ?? 2} kg`], ['Extra per kg', euro(s.extra_kg_fee ?? 0)], ['COD fee', `${s.cod_fee_pct ?? 1}%`], ['Return fee', euro(s.return_fee ?? 0)], ['POD max distance', `${s.pod_max_distance_m ?? 150} m`], ['Language', s.default_locale === 'sq' ? 'Shqip' : 'English']].map(([k, v]) => <span key={String(k)} className="flex justify-between"><span className="text-ink-3">{k}</span><span className="font-mono">{String(v ?? '—')}</span></span>)}</div></Accordion></div>
    </div>
    {hub && <Accordion title="Hub location" icon="map"><div className="p-5"><HubLocation hubId={hub.id} name={hub.name} address={hub.address} point={point?.lat != null ? { lat: point.lat, lng: point.lng } : null} /></div></Accordion>}
  </>);
}
