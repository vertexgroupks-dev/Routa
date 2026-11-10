import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Avatar, Pill } from '@/components/ui';
import { phonePretty } from '@routa/shared';

export const metadata = { title: 'Fleet & Drivers' };

export default async function FleetPage() {
  const ws = await requireStaff();
  const supabase = await createClient();
  const [{ data: drivers }, { data: vehicles }] = await Promise.all([
    supabase.from('drivers').select('id, full_name, phone, color, status, rating, licence_expires, user_id, vehicle:vehicles(plate, model)').eq('org_id', ws.org.id).order('full_name'),
    supabase.from('vehicles').select('id, plate, model, type, capacity_kg, odometer_km, next_service_km, next_service_date, registration_expires, active').eq('org_id', ws.org.id).order('plate')
  ]);
  const soon = (d?: string | null) => !!d && new Date(d).getTime() - Date.now() < 30 * 86400_000;
  return (
    <>
      <PageHeader title="Fleet & Drivers" subtitle={`${drivers?.length ?? 0} drivers · ${vehicles?.length ?? 0} vehicles`} />
      <div className="flex flex-wrap items-start gap-4">
        <section className="card min-w-0 flex-[3_1_560px] overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead className="bg-[#FAFBFD]"><tr><th className="th pl-5">Driver</th><th className="th">Vehicle</th><th className="th">Licence</th><th className="th">App</th><th className="th text-right">Rating</th><th className="th pr-5">Status</th></tr></thead>
            <tbody>{(drivers ?? []).map((d: any) => (
              <tr key={d.id} className="border-t border-line">
                <td className="td pl-5"><span className="flex items-center gap-2.5"><Avatar name={d.full_name} bg={d.color ?? '#DFE2FF'} ink="#fff" /><span className="flex flex-col"><span className="font-medium">{d.full_name}</span><span className="text-xs text-ink-3">{phonePretty(d.phone)}</span></span></span></td>
                <td className="td text-ink-2">{d.vehicle ? `${d.vehicle.plate} · ${d.vehicle.model}` : '—'}</td>
                <td className={`td font-mono ${soon(d.licence_expires) ? 'text-danger-ink' : 'text-ink-2'}`}>{d.licence_expires ?? '—'}</td>
                <td className="td">{d.user_id ? <Pill bg="#E8F8EF" ink="#067647">Linked</Pill> : <Pill bg="#F0F2F7" ink="#5B6378">Not signed in</Pill>}</td>
                <td className="td text-right">★ {d.rating ?? '—'}</td>
                <td className="td pr-5">{d.status === 'active' ? <Pill bg="#E8F8EF" ink="#067647">Active</Pill> : <Pill bg="#FFF4E5" ink="#B54708">{String(d.status).replace('_', ' ')}</Pill>}</td>
              </tr>
            ))}</tbody>
          </table>
        </section>
        <section className="card flex min-w-0 flex-[2_1_380px] flex-col gap-3 p-5">
          <h2 className="text-base font-semibold">Vehicles</h2>
          {(vehicles ?? []).map((v) => {
            const service = (v.next_service_km && v.odometer_km && v.next_service_km - v.odometer_km < 500) || soon(v.next_service_date);
            return (
              <div key={v.id} className="flex items-center gap-3 rounded-xl border border-line p-3 text-[13px]">
                <span className="flex flex-1 flex-col"><span className="font-mono font-medium">{v.plate}</span><span className="text-xs text-ink-3">{v.model} · {v.type} · {v.capacity_kg} kg</span></span>
                <span className="flex flex-col items-end gap-1">
                  <span className="font-mono text-xs text-ink-2">{v.odometer_km?.toLocaleString()} km</span>
                  {service && <Pill bg="#FFF4E5" ink="#B54708">Service due</Pill>}
                  {soon(v.registration_expires) && <Pill bg="#FDECEC" ink="#B42318">Registration {v.registration_expires}</Pill>}
                </span>
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}
