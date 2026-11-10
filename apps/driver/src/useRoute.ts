import { useCallback, useEffect, useState } from 'react';
import { todayKs, type StopStatus } from '@routa/shared';
import { supabase } from './supabase';

export type Stop = {
  id: string; sequence: number; status: StopStatus; eta: string | null;
  order: { id: string; code: string; tracking_code: string; customer_name: string; customer_phone: string; address_line: string | null; city: string | null; landmark: string | null; address_details: Record<string, unknown> | null; notes_driver: string | null; cod_amount: number; parcels: number | null; weight_kg: number | null; window_start: string | null; window_end: string | null; lat: number | null; lng: number | null };
};
export type Route = { id: string; code: string; status: string; color: string | null; dock: string | null; planned_km: number | null; vehicle: { plate: string; model: string } | null; stops: Stop[] };

/** Today's route for the signed-in driver (RLS only returns the driver's own route). */
export function useTodayRoute() {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase
      .from('routes')
      .select('id, code, status, color, dock, planned_km, vehicle:vehicles(plate, model), stops:route_stops(id, sequence, status, eta, order:orders(id, code, tracking_code, customer_name, customer_phone, address_line, city, landmark, address_details, notes_driver, cod_amount, parcels, weight_kg, window_start, window_end, location))')
      .eq('date', todayKs())
      .neq('status', 'cancelled')
      .order('code')
      .limit(1)
      .maybeSingle();
    if (error) setError(error.message);
    if (data) {
      const r = data as any;
      r.stops = (r.stops ?? [])
        .map((s: any) => ({ ...s, order: { ...s.order, ...pointToLatLng(s.order?.location) } }))
        .sort((a: Stop, b: Stop) => a.sequence - b.sequence);
      setRoute(r);
    } else setRoute(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel(`my-route-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'route_stops' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  return { route, loading, error, reload: load };
}

// PostgREST returns geometry as GeoJSON ({ type: 'Point', coordinates: [lng, lat] }) or as hex EWKB.
function pointToLatLng(loc: unknown): { lat: number | null; lng: number | null } {
  if (loc && typeof loc === 'object' && Array.isArray((loc as any).coordinates)) {
    const [lng, lat] = (loc as any).coordinates;
    return { lat, lng };
  }
  if (typeof loc === 'string' && /^[0-9A-F]+$/i.test(loc) && loc.length >= 42) {
    const hex = loc.length === 50 ? loc.slice(18) : loc.slice(10);
    const read = (h: string) => { const b = new Uint8Array(8); for (let i = 0; i < 8; i++) b[i] = parseInt(h.substr(i * 2, 2), 16); return new DataView(b.buffer).getFloat64(0, true); };
    return { lng: read(hex.slice(0, 16)), lat: read(hex.slice(16, 32)) };
  }
  return { lat: null, lng: null };
}
