'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEMO_ROUTES, HUB } from './demoRoutes';

/* ───────── helpers ───────── */
const km = (a: [number, number], b: [number, number]) => {
  const R = 6371, t = Math.PI / 180;
  const h = Math.sin((b[0] - a[0]) * t / 2) ** 2 + Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin((b[1] - a[1]) * t / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)) * 1.35; // ×1.35: streets are not straight lines
};
const tripKm = (pts: [number, number][]) => { let s = 0, p = HUB; for (const q of pts) { s += km(p, q); p = q; } return s + km(p, HUB); };

function useInView<T extends Element>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

export function CountUp({ to, decimals = 0, prefix = '', suffix = '', duration = 1400 }: { to: number; decimals?: number; prefix?: string; suffix?: string; duration?: number }) {
  const [ref, seen] = useInView<HTMLSpanElement>();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return; }
    let raf = 0; const t0 = performance.now();
    const step = (now: number) => { const p = Math.min(1, (now - t0) / duration); setV(to * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);
  return <span ref={ref} className="tabular-nums">{prefix}{v.toFixed(decimals)}{suffix}</span>;
}

/* ───────── projected sketch of the real routes ───────── */
const ALL = [HUB, ...DEMO_ROUTES.flatMap((r) => r.line)];
const B = { minLat: Math.min(...ALL.map((p) => p[0])), maxLat: Math.max(...ALL.map((p) => p[0])), minLng: Math.min(...ALL.map((p) => p[1])), maxLng: Math.max(...ALL.map((p) => p[1])) };
function project([lat, lng]: [number, number], w: number, h: number, pad = 24): [number, number] {
  const sx = (w - pad * 2) / ((B.maxLng - B.minLng) * 0.74), sy = (h - pad * 2) / (B.maxLat - B.minLat), s = Math.min(sx, sy);
  const ox = (w - (B.maxLng - B.minLng) * 0.74 * s) / 2, oy = (h - (B.maxLat - B.minLat) * s) / 2;
  return [ox + (lng - B.minLng) * 0.74 * s, oy + (B.maxLat - lat) * s];
}
const pathOf = (pts: [number, number][], w: number, h: number) => pts.map((p, i) => { const [x, y] = project(p, w, h); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join(' ');

export function RouteSketch({ w = 520, h = 340, dark = true, vans = false }: { w?: number; h?: number; dark?: boolean; vans?: boolean }) {
  const [hx, hy] = project(HUB, w, h);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      <defs><pattern id={`g${dark}`} width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke={dark ? '#ffffff' : '#0E1325'} strokeOpacity={dark ? 0.05 : 0.06} /></pattern></defs>
      <rect width={w} height={h} fill={dark ? '#0B1030' : '#F1F3FF'} /><rect width={w} height={h} fill={`url(#g${dark})`} />
      {DEMO_ROUTES.map((r) => <path key={r.code} d={pathOf(r.line, w, h)} fill="none" stroke={r.color} strokeWidth="9" strokeOpacity="0.16" strokeLinecap="round" strokeLinejoin="round" />)}
      {DEMO_ROUTES.map((r) => <path key={`l${r.code}`} d={pathOf(r.line, w, h)} fill="none" stroke={dark ? r.color : shade(r.color)} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />)}
      {DEMO_ROUTES.map((r) => r.stops.map((s, k) => { const [x, y] = project(s, w, h); return <circle key={`${r.code}${k}`} cx={x} cy={y} r="4.5" fill={dark ? '#0B1030' : '#fff'} stroke={dark ? r.color : shade(r.color)} strokeWidth="2" />; }))}
      {vans && DEMO_ROUTES.map((r, i) => { const p = r.line[Math.floor(r.line.length * (0.3 + i * 0.12))]!; const [x, y] = project(p, w, h); return <circle key={`v${r.code}`} cx={x} cy={y} r="7" fill={r.color} className="van-pulse" />; })}
      <rect x={hx - 9} y={hy - 9} width="18" height="18" rx="5" fill="#4A49E3" />
    </svg>
  );
}
const shade = (c: string) => ({ '#C8F25C': '#5E8F00', '#38D6F5': '#0891B2', '#8B8AFF': '#4A49E3', '#F472B6': '#DB2777' } as Record<string, string>)[c] ?? c;

/* ───────── AI planning: before / after ───────── */
export function PlanCompare() {
  // Orders arrive mixed up; a dispatcher working by hand would drive them roughly in that order.
  const arrival = useMemo(() => {
    const lists = DEMO_ROUTES.map((r, k) => (k % 2 ? [...r.stops].reverse() : [...r.stops]));
    const out: [number, number][] = [];
    const max = Math.max(...lists.map((l) => l.length));
    for (let i = 0; i < max; i++) for (const l of lists) { const s = l[i]; if (s) out.push(s); }
    return out;
  }, []);
  const before = useMemo(() => tripKm(arrival), [arrival]);
  const after = useMemo(() => DEMO_ROUTES.reduce((s, r) => s + tripKm(r.stops), 0), []);
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  const [planned, setPlanned] = useState(false);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!seen || !auto) return;
    const t = setTimeout(() => setPlanned((p) => !p), planned ? 5200 : 2600);
    return () => clearTimeout(t);
  }, [seen, planned, auto]);
  const W = 560, H = 380;
  const value = planned ? after : before;
  return (
    <div ref={ref} className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-center">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0B1030] shadow-[0_40px_120px_-40px_rgb(74_73_227/0.7)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
          <defs><pattern id="pc" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#fff" strokeOpacity="0.05" /></pattern></defs>
          <rect width={W} height={H} fill="url(#pc)" />
          <path d={pathOf([HUB, ...arrival, HUB], W, H)} fill="none" stroke="#F87171" strokeWidth="2.4" strokeDasharray="6 7" strokeLinejoin="round"
            style={{ opacity: planned ? 0 : 0.95, transition: 'opacity .6s ease' }} />
          {DEMO_ROUTES.map((r, i) => (
            <path key={r.code} d={pathOf([HUB, ...r.stops, HUB], W, H)} fill="none" stroke={r.color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" pathLength={1}
              style={{ strokeDasharray: 1, strokeDashoffset: planned ? 0 : 1, transition: `stroke-dashoffset 1.1s cubic-bezier(.6,.1,.3,1) ${0.15 + i * 0.18}s`, filter: `drop-shadow(0 0 6px ${r.color})` }} />
          ))}
          {DEMO_ROUTES.flatMap((r) => r.stops.map((s, k) => { const [x, y] = project(s, W, H); return <circle key={`${r.code}${k}`} cx={x} cy={y} r="6" fill="#0B1030" stroke={planned ? r.color : '#E2E8F0'} strokeWidth="2.5" style={{ transition: 'stroke .5s' }} />; }))}
          {(() => { const [x, y] = project(HUB, W, H); return <rect x={x - 11} y={y - 11} width="22" height="22" rx="6" fill="#4A49E3" />; })()}
        </svg>
        <div className="absolute left-4 top-4 flex rounded-full border border-white/10 bg-white/5 p-1 text-[13px] backdrop-blur">
          {[['As the orders came in', false], ['Planned by Routa', true]].map(([l, v]) => (
            <button key={String(l)} onClick={() => { setAuto(false); setPlanned(v as boolean); }} className={`rounded-full px-3.5 py-1.5 font-semibold transition ${planned === v ? 'bg-white text-[#0B1030]' : 'text-white/70 hover:text-white'}`}>{l as string}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-5 text-white">
        <div>
          <span className="text-[15px] text-white/60">The 15 stops from the map above</span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className={`text-[64px] font-extrabold leading-none tracking-[-0.04em] transition-colors ${planned ? 'text-[#C8F25C]' : 'text-[#F87171]'}`}>{value.toFixed(1)}</span>
            <span className="text-[22px] font-semibold text-white/70">km</span>
          </div>
          <p className="mt-2 text-[15px] text-white/60">{planned ? `${DEMO_ROUTES.length} vans, each with a tight loop. ${Math.round((1 - after / before) * 100)}% less driving than going in arrival order.` : 'One long zig-zag across the city, the way stops get driven when nobody plans them.'}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#4A49E3] via-[#38D6F5] to-[#C8F25C] transition-[width] duration-700" style={{ width: `${(value / before) * 100}%` }} /></div>
        <p className="text-[12.5px] text-white/40">Distances estimated from the real addresses (straight line × 1.35 for streets).</p>
      </div>
    </div>
  );
}

/* ───────── Product tour ───────── */
export type TourTab = { key: string; label: string; color: string; title: string; body: string; view: React.ReactNode };
export function ProductTour({ tabs }: { tabs: TourTab[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ref, seen] = useInView<HTMLDivElement>(0.25);
  useEffect(() => {
    if (!seen || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setI((x) => (x + 1) % tabs.length), 6500);
    return () => clearTimeout(t);
  }, [i, paused, seen, tabs.length]);
  const tab = tabs[i]!;
  return (
    <div ref={ref} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div role="tablist" className="flex flex-wrap gap-2">
        {tabs.map((t, k) => (
          <button key={t.key} role="tab" aria-selected={k === i} onClick={() => { setI(k); setPaused(true); }}
            className={`relative overflow-hidden rounded-full border px-4 py-2 text-[14.5px] font-semibold transition ${k === i ? 'border-transparent text-[#0B1030]' : 'border-[#D9DCF5] bg-white text-[#3E4659] hover:border-[#4A49E3]'}`}
            style={k === i ? { background: t.color } : undefined}>
            {t.label}
            {k === i && !paused && seen && <span key={i} className="tour-progress absolute bottom-0 left-0 h-[3px] bg-[#0B1030]/40" />}
          </button>
        ))}
      </div>
      <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_1.55fr]">
        <div key={`t${tab.key}`} className="fade-swap">
          <h3 className="text-[30px] font-bold leading-[1.15] tracking-[-0.02em]">{tab.title}</h3>
          <p className="mt-4 text-[17px] leading-[1.65] text-[#3E4659]">{tab.body}</p>
        </div>
        <div key={`v${tab.key}`} className="fade-swap">{tab.view}</div>
      </div>
    </div>
  );
}
