'use client';
// Hero: a real map of Prishtina with the routes Routa planned, and vans driving them.
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { DEMO_ROUTES, HUB } from './demoRoutes';

type Toast = { id: number; color: string; title: string; body: string };
const NAMES = [['Liridona B.', 'Faton H.', 'Arta M.', 'Besnik S.'], ['Vjosa K.', 'Gentrit R.', 'Albina B.', 'Dardan A.'], ['Elira Z.', 'Kushtrim H.', 'Mimoza T.', 'Ardit S.'], ['Rina O.', 'Valon K.', 'Liridona B.']];

// distance along a polyline, so vans move at a steady speed
function measure(line: [number, number][]) {
  const cum = [0];
  for (let i = 1; i < line.length; i++) {
    const [a, b] = [line[i - 1]!, line[i]!];
    cum.push(cum[i - 1]! + Math.hypot(a[0] - b[0], (a[1] - b[1]) * 0.74));
  }
  return cum;
}
function pointAt(line: [number, number][], cum: number[], t: number): [number, number] {
  const d = t * cum[cum.length - 1]!;
  let i = cum.findIndex((c) => c >= d);
  if (i <= 0) return line[0]!;
  const f = (d - cum[i - 1]!) / (cum[i]! - cum[i - 1]! || 1);
  const [a, b] = [line[i - 1]!, line[i]!];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

export function LiveRouteMap() {
  const box = useRef<HTMLDivElement>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [done, setDone] = useState(0);

  useEffect(() => {
    let map: any, raf = 0, dead = false, n = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    (async () => {
      const L = (await import('leaflet')).default ?? (await import('leaflet'));
      if (dead || !box.current) return;
      map = L.map(box.current, { zoomControl: false, attributionControl: true, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
      const all = DEMO_ROUTES.flatMap((r) => r.line);
      map.fitBounds(all, { padding: [30, 30] });

      const vans = DEMO_ROUTES.map((r, ri) => {
        L.polyline(r.line, { color: r.color, weight: 14, opacity: 0.16, lineCap: 'round', lineJoin: 'round' }).addTo(map);
        L.polyline(r.line, { color: r.color, weight: 3.5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(map);
        r.stops.forEach(([lat, lng], k) => L.marker([lat, lng], { icon: L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], html: `<span style="display:flex;width:22px;height:22px;align-items:center;justify-content:center;border-radius:11px;background:#0B1030;border:2px solid ${r.color};color:${r.color};font:700 11px system-ui">${k + 1}</span>` }) }).addTo(map));
        const icon = L.divIcon({ className: '', iconSize: [34, 34], iconAnchor: [17, 17], html: `<span style="display:flex;width:34px;height:34px;align-items:center;justify-content:center;border-radius:17px;background:${r.color};box-shadow:0 0 0 6px ${r.color}33,0 0 24px ${r.color};font-size:16px">🚚</span>` });
        const m = L.marker(r.line[0]!, { icon, zIndexOffset: 1000 }).addTo(map);
        // where along the line each stop is (closest vertex)
        const cum = measure(r.line);
        const stopT = r.stops.map(([lat, lng]) => {
          let best = 0, bd = Infinity;
          r.line.forEach(([a, b], i) => { const dd = Math.hypot(a - lat, (b - lng) * 0.74); if (dd < bd) { bd = dd; best = i; } });
          return cum[best]! / cum[cum.length - 1]!;
        });
        return { m, cum, r, ri, stopT, passed: new Set<number>(), period: 26000 + r.min * 260, offset: ri * 0.17 };
      });
      L.marker(HUB, { icon: L.divIcon({ className: '', iconSize: [36, 36], iconAnchor: [18, 18], html: '<span style="display:flex;width:36px;height:36px;align-items:center;justify-content:center;border-radius:11px;background:#4A49E3;color:#fff;font:800 12px system-ui;box-shadow:0 0 0 6px #4A49E355">HUB</span>' }), zIndexOffset: 2000 }).addTo(map);

      if (reduce) { vans.forEach((v) => v.m.setLatLng(pointAt(v.r.line, v.cum, 0.35))); return; }
      const t0 = performance.now();
      const tick = (now: number) => {
        for (const v of vans) {
          const t = ((now - t0) / v.period + v.offset) % 1;
          v.m.setLatLng(pointAt(v.r.line, v.cum, t));
          v.stopT.forEach((st, k) => {
            if (t >= st && !v.passed.has(k) && t - st < 0.05) {
              v.passed.add(k);
              const id = ++n;
              setDone((d) => d + 1);
              setToasts((ts) => [{ id, color: v.r.color, title: `${v.r.driver} delivered stop ${k + 1}`, body: `${NAMES[v.ri]![k] ?? 'Customer'} · photo, signature, GPS saved` }, ...ts].slice(0, 3));
              setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 5200);
            }
            if (t < st) v.passed.delete(k);
          });
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();
    return () => { dead = true; cancelAnimationFrame(raf); map?.remove(); };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={box} className="absolute inset-0 z-0 bg-[#0B1030]" />
      <div className="pointer-events-none absolute right-3 top-3 z-[500] flex w-[270px] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="toast-in flex gap-3 rounded-2xl border border-white/10 bg-[#0B1030]/85 p-3 text-white shadow-2xl backdrop-blur-md">
            <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full" style={{ background: t.color, boxShadow: `0 0 12px ${t.color}` }} />
            <span className="flex flex-col"><span className="text-[13px] font-semibold">{t.title}</span><span className="text-[12px] text-white/60">{t.body}</span></span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap gap-2">
        {DEMO_ROUTES.map((r) => (
          <span key={r.code} className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0B1030]/80 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-md">
            <span className="h-2 w-2 rounded-full" style={{ background: r.color, boxShadow: `0 0 10px ${r.color}` }} />{r.driver} <span className="text-white/55">{r.km} km</span>
          </span>
        ))}
        <span className="rounded-full border border-white/10 bg-[#0B1030]/80 px-3 py-1.5 text-[12px] font-medium text-[#C8F25C] backdrop-blur-md">{done} delivered</span>
      </div>
    </div>
  );
}
