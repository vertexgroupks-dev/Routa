import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Avatar, Pill } from '@/components/ui';
import { RecordForm, type Field } from '@/components/RecordForm';
import { phonePretty } from '@routa/shared';

export const metadata = { title: 'Fleet & Drivers' };

export default async function FleetPage() {
  const ws = await requireStaff('/fleet');
  const supabase = await createClient();
  const [{ data: drivers }, { data: vehicles }] = await Promise.all([
    supabase.from('drivers').select('id, full_name, phone, color, status, rating, licence_category, licence_expires, user_id, default_vehicle_id, vehicle:vehicles(plate, model)').eq('org_id', ws.org.id).order('full_name'),
    supabase.from('vehicles').select('id, plate, model, type, capacity_kg, capacity_parcels, odometer_km, next_service_km, next_service_date, registration_expires, fuel_l_per_100km, active').eq('org_id', ws.org.id).order('plate')
  ]);
  const soon = (d?: string | null) => !!d && new Date(d).getTime() - Date.now() < 30 * 86400_000;
  const vehicleOptions: [string, string][] = [['', '— none —'], ...((vehicles ?? []).map((v) => [v.id, `${v.plate} · ${v.model}`] as [string, string]))];
  const driverFields: Field[] = [
    { key: 'full_name', label: 'Full name' }, { key: 'phone', label: 'Phone', placeholder: '+38344…' },
    { key: 'status', label: 'Status', type: 'select', options: [['active', 'Active'], ['on_leave', 'On leave'], ['inactive', 'Inactive']] },
    { key: 'default_vehicle_id', label: 'Usual vehicle', type: 'select', options: vehicleOptions },
    { key: 'licence_category', label: 'Licence category' }, { key: 'licence_expires', label: 'Licence expires', type: 'date' },
    { key: 'color', label: 'Route colour', placeholder: '#5B5CF6' }
  ];
  const vehicleFields: Field[] = [
    { key: 'plate', label: 'Plate', placeholder: '01-234-KS' }, { key: 'model', label: 'Model', span: 2 },
    { key: 'type', label: 'Type', type: 'select', options: [['van', 'Van'], ['car', 'Car'], ['scooter', 'Scooter'], ['truck', 'Truck'], ['bike', 'Bike']] },
    { key: 'capacity_kg', label: 'Capacity (kg)', type: 'number' }, { key: 'capacity_parcels', label: 'Capacity (parcels)', type: 'number' },
    { key: 'fuel_l_per_100km', label: 'Fuel (L / 100 km)', type: 'number' }, { key: 'odometer_km', label: 'Odometer (km)', type: 'number' },
    { key: 'next_service_km', label: 'Next service (km)', type: 'number' }, { key: 'next_service_date', label: 'Next service date', type: 'date' },
    { key: 'registration_expires', label: 'Registration expires', type: 'date' }
  ];
  const hub = ws.hub?.id;
  return (
    <>
      <PageHeader title="Fleet & Drivers" subtitle={`${drivers?.length ?? 0} drivers · ${vehicles?.length ?? 0} vehicles`}>
        <RecordForm table="drivers" fields={driverFields} extra={{ org_id: ws.org.id, hub_id: hub }} initial={{ status: 'active', licence_category: 'B' }} label="+ Add driver" kind="primary" />
        <RecordForm table="vehicles" fields={vehicleFields} extra={{ org_id: ws.org.id, hub_id: hub }} initial={{ type: 'van', fuel_l_per_100km: 7.5 }} label="+ Add vehicle" kind="primary" />
      </PageHeader>
      <p className="-mt-2 text-[13px] text-ink-3">A new driver gets the app by an invitation from Team & roles (role “Driver”, with the same phone number).</p>
      <div className="flex flex-wrap items-start gap-4">
        <section className="card min-w-0 flex-[3_1_560px] overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-[13px]">
            <thead className="bg-white/30"><tr><th className="th pl-5">Driver</th><th className="th">Vehicle</th><th className="th">Licence</th><th className="th">App</th><th className="th">Status</th><th className="th pr-5"></th></tr></thead>
            <tbody>{(drivers ?? []).map((d: any) => (
              <tr key={d.id} className="border-t border-line align-top">
                <td className="td pl-5"><span className="flex items-center gap-2.5"><Avatar name={d.full_name} bg={d.color ?? '#DFE2FF'} ink="#fff" /><span className="flex flex-col"><span className="font-medium">{d.full_name}</span><span className="text-xs text-ink-3">{phonePretty(d.phone)} · ★ {d.rating ?? '—'}</span></span></span></td>
                <td className="td text-ink-2">{d.vehicle ? `${d.vehicle.plate} · ${d.vehicle.model}` : '—'}</td>
                <td className={`td font-mono ${soon(d.licence_expires) ? 'text-danger-ink' : 'text-ink-2'}`}>{d.licence_category ?? ''} {d.licence_expires ?? '—'}</td>
                <td className="td">{d.user_id ? <Pill bg="#E8F8EF" ink="#067647">Linked</Pill> : <Pill bg="#F0F2F7" ink="#5B6378">Not signed in</Pill>}</td>
                <td className="td">{d.status === 'active' ? <Pill bg="#E8F8EF" ink="#067647">Active</Pill> : <Pill bg="#FFF4E5" ink="#B54708">{String(d.status).replace('_', ' ')}</Pill>}</td>
                <td className="td pr-5 text-right"><RecordForm table="drivers" id={d.id} fields={driverFields} initial={d} label="Edit" /></td>
              </tr>
            ))}</tbody>
          </table>
        </section>
        <section className="card flex min-w-0 flex-[2_1_380px] flex-col gap-3 p-5">
          <h2 className="text-base font-semibold">Vehicles</h2>
          {(vehicles ?? []).map((v) => {
            const service = (v.next_service_km && v.odometer_km && v.next_service_km - v.odometer_km < 500) || soon(v.next_service_date);
            return (
              <div key={v.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3 text-[13px]">
                <span className="flex flex-1 flex-col"><span className="font-mono font-medium">{v.plate}</span><span className="text-xs text-ink-3">{v.model} · {v.type} · {v.capacity_kg} kg · {v.fuel_l_per_100km ?? '—'} L/100km</span></span>
                <span className="flex flex-col items-end gap-1">
                  <span className="font-mono text-xs text-ink-2">{v.odometer_km?.toLocaleString()} km</span>
                  {service && <Pill bg="#FFF4E5" ink="#B54708">Service due</Pill>}
                  {soon(v.registration_expires) && <Pill bg="#FDECEC" ink="#B42318">Registration {v.registration_expires}</Pill>}
                </span>
                <RecordForm table="vehicles" id={v.id} fields={vehicleFields} initial={v} label="Edit" />
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}
