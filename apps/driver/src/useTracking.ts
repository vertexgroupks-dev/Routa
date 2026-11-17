// While the route is being loaded or driven, share the phone's position with the office (Live map).
// Points are buffered and sent every ~30 s; nothing is shared when no route is active.
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

type Point = { lat: number; lng: number; speed: number | null; heading: number | null; accuracy: number | null; at: string };

export function useTracking(active: boolean) {
  const [sharing, setSharing] = useState(false);
  const buffer = useRef<Point[]>([]);

  useEffect(() => {
    if (!active) { setSharing(false); return; }
    let sub: Location.LocationSubscription | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let dead = false;

    const flush = async () => {
      if (!buffer.current.length) return;
      const points = buffer.current.splice(0, buffer.current.length);
      const { error } = await supabase.rpc('record_locations', { p_points: points });
      if (error) buffer.current.unshift(...points.slice(-20)); // keep the latest few and retry next time
    };

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (dead || status !== 'granted') return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 40 },
        (p) => {
          buffer.current.push({
            lat: p.coords.latitude, lng: p.coords.longitude,
            speed: p.coords.speed != null && p.coords.speed >= 0 ? Math.round(p.coords.speed * 3.6) : null,
            heading: p.coords.heading != null && p.coords.heading >= 0 ? Math.round(p.coords.heading) : null,
            accuracy: p.coords.accuracy ?? null, at: new Date(p.timestamp).toISOString()
          });
          if (buffer.current.length > 200) buffer.current.splice(0, buffer.current.length - 200);
        }
      );
      if (dead) { sub.remove(); return; }
      setSharing(true);
      timer = setInterval(flush, 30000);
      setTimeout(flush, 3000); // first point quickly so the office sees the driver straight away
    })();

    return () => { dead = true; sub?.remove(); if (timer) clearInterval(timer); flush(); setSharing(false); };
  }, [active]);

  return sharing;
}
