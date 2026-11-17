'use client';
// One map for the whole app: routes, stops, the hub, and a draggable pin for placing an address.
// OpenStreetMap tiles through Leaflet — no API key needed.
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export type Pt = { lat: number; lng: number };
export type MapMarker = Pt & { kind?: 'hub' | 'stop' | 'open'; label?: string; color?: string; title?: string; sub?: string; href?: string };
export type MapLine = { coords: [number, number][]; color: string; dashed?: boolean };

type Props = {
  markers?: MapMarker[];
  lines?: MapLine[];
  pin?: Pt | null;              // draggable pin (address picker)
  onPick?: (p: Pt) => void;     // click / drag sets the pin
  center?: Pt;
  height?: number | string;
  className?: string;
  keepView?: boolean;          // zoom to the data only the first time (live pages that refresh)
};

const esc = (s = '') => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const PRISHTINA: Pt = { lat: 42.6629, lng: 21.1655 };

export function MapView({ markers = [], lines = [], pin, onPick, center, height = 360, className = '', keepView = false }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const L = useRef<any>(null);
  const layer = useRef<any>(null);
  const pinRef = useRef<any>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const fitted = useRef('');

  // Create the map once
  useEffect(() => {
    let dead = false;
    (async () => {
      const mod: any = await import('leaflet');
      const Lf = mod.default ?? mod;
      if (dead || !box.current || map.current) return;
      L.current = Lf;
      const m = Lf.map(box.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView([(center ?? pin ?? PRISHTINA).lat, (center ?? pin ?? PRISHTINA).lng], 13);
      Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(m);
      m.on('click', (e: any) => pickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
      m.on('focus', () => m.scrollWheelZoom.enable());
      m.on('blur', () => m.scrollWheelZoom.disable());
      layer.current = Lf.layerGroup().addTo(m);
      map.current = m;
      draw();
    })();
    return () => { dead = true; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const Lf = L.current, m = map.current, g = layer.current;
    if (!Lf || !m || !g) return;
    g.clearLayers();
    const pts: [number, number][] = [];
    for (const l of lines) {
      if (l.coords.length < 2) continue;
      Lf.polyline(l.coords, { color: l.color, weight: 4, opacity: 0.85, dashArray: l.dashed ? '6 6' : undefined }).addTo(g);
      pts.push(...l.coords);
    }
    for (const mk of markers) {
      const c = mk.color ?? '#5B5CF6';
      const html = mk.kind === 'hub'
        ? `<span style="display:flex;width:30px;height:30px;align-items:center;justify-content:center;border-radius:10px;background:#0E1325;color:#C8F25C;font:600 12px system-ui;box-shadow:0 4px 12px rgba(14,19,37,.35)">H</span>`
        : mk.kind === 'open'
          ? `<span style="display:block;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #9AA3BC;box-shadow:0 2px 6px rgba(14,19,37,.25)"></span>`
          : `<span style="display:flex;min-width:24px;height:24px;padding:0 5px;align-items:center;justify-content:center;border-radius:12px;background:${c};color:#fff;font:600 11px ui-monospace,monospace;border:2px solid #fff;box-shadow:0 2px 8px rgba(14,19,37,.3)">${esc(mk.label ?? '')}</span>`;
      const size = mk.kind === 'hub' ? 30 : mk.kind === 'open' ? 14 : 24;
      const icon = Lf.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
      const marker = Lf.marker([mk.lat, mk.lng], { icon, zIndexOffset: mk.kind === 'hub' ? 1000 : 0 }).addTo(g);
      if (mk.title) marker.bindPopup(`<b>${esc(mk.title)}</b>${mk.sub ? `<br><span style="color:#5B6378">${esc(mk.sub)}</span>` : ''}${mk.href ? `<br><a href="${esc(mk.href)}" style="color:#3B38BF">Open →</a>` : ''}`);
      pts.push([mk.lat, mk.lng]);
    }
    // Draggable pin
    if (pin) {
      const icon = Lf.divIcon({ className: '', iconSize: [28, 38], iconAnchor: [14, 36],
        html: `<svg width="28" height="38" viewBox="0 0 28 38"><path d="M14 37s12-12.6 12-22A12 12 0 1 0 2 15c0 9.4 12 22 12 22z" fill="#5B5CF6" stroke="#fff" stroke-width="2"/><circle cx="14" cy="15" r="4.5" fill="#fff"/></svg>` });
      if (!pinRef.current) {
        pinRef.current = Lf.marker([pin.lat, pin.lng], { icon, draggable: true, zIndexOffset: 2000 }).addTo(m);
        pinRef.current.on('dragend', (e: any) => { const p = e.target.getLatLng(); pickRef.current?.({ lat: p.lat, lng: p.lng }); });
      } else {
        const cur = pinRef.current.getLatLng();
        if (Math.abs(cur.lat - pin.lat) > 1e-7 || Math.abs(cur.lng - pin.lng) > 1e-7) {
          pinRef.current.setLatLng([pin.lat, pin.lng]);
          m.setView([pin.lat, pin.lng], Math.max(m.getZoom(), 15)); // moved from outside (address search)
        }
      }
      pts.push([pin.lat, pin.lng]);
    } else if (pinRef.current) { pinRef.current.remove(); pinRef.current = null; }

    // Zoom to what's on the map (only when the set of things changes, not on every pin drag)
    const key = `${markers.length}:${lines.length}:${markers.map((x) => `${x.lat.toFixed(3)},${x.lng.toFixed(3)}`).join('|')}:${pin ? 'pin' : ''}`;
    if (key !== fitted.current && !(keepView && fitted.current)) {
      fitted.current = key;
      if (pts.length === 1) m.setView(pts[0], 15);
      else if (pts.length > 1) m.fitBounds(pts, { padding: [36, 36], maxZoom: 16 });
    }
  }

  useEffect(draw); // redraw when markers / lines / pin change

  return (
    <div className={`relative isolate overflow-hidden rounded-2xl border border-white/80 ${className}`} style={{ height }}>
      <div ref={box} className="absolute inset-0 z-0" />
    </div>
  );
}
