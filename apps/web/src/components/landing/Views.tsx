// Product screens for the landing page, drawn with the same data the app produced in testing.
import { RouteSketch } from './Interactive';
import { DEMO_ROUTES } from './demoRoutes';
import { LogoMark } from '@/components/Logo';

export function Frame({ url, children, dark = false }: { url: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-[22px] border shadow-[0_50px_100px_-40px_rgb(36_34_140/0.55)] ${dark ? 'border-white/10 bg-[#0B1030]' : 'border-[#D9DCF5] bg-white'}`}>
      <div className={`flex items-center gap-2 border-b px-4 py-2.5 ${dark ? 'border-white/10' : 'border-[#ECEEFB] bg-[#F7F8FF]'}`}>
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF6159]" /><span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28C941]" />
        <span className={`ml-3 rounded-md px-3 py-1 text-[11.5px] ${dark ? 'bg-white/5 text-white/50' : 'bg-white text-[#6B7489]'}`}>routa.app{url}</span>
      </div>
      {children}
    </div>
  );
}

function Side({ active }: { active: string }) {
  const items = ['Overview', 'Orders', 'Dispatch', 'Live map', 'Helpdesk', 'Pick & pack', 'Cash check-in', 'Finance'];
  return (
    <div className="hidden w-[150px] flex-none flex-col gap-1 border-r border-[#ECEEFB] bg-[#FAFBFF] p-3 sm:flex">
      <span className="mb-2 flex items-center gap-2 px-1"><LogoMark size={20} /><span className="text-[12px] font-bold">Prishtina Express</span></span>
      {items.map((i) => <span key={i} className={`rounded-lg px-2.5 py-1.5 text-[12px] ${i === active ? 'bg-[#4A49E3] font-semibold text-white' : 'text-[#5B6378]'}`}>{i}</span>)}
    </div>
  );
}

export function OverviewView() {
  const stats = [['Orders today', '46', '#4A49E3'], ['Delivered', '31', '#0F9F5F'], ['Problems', '2', '#E8590C'], ['Cash collected', '€1,284', '#0891B2']];
  return (
    <Frame url="/overview">
      <div className="flex">
        <Side active="Overview" />
        <div className="flex min-w-0 flex-1 flex-col gap-3 bg-[#F4F6FF] p-4">
          <span className="text-[15px] font-bold">Good morning, Donjeta</span>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {stats.map(([k, v, c]) => <div key={k} className="rounded-xl bg-white p-3"><span className="flex items-center gap-1.5 text-[11px] text-[#6B7489]"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{k}</span><span className="text-[20px] font-extrabold">{v}</span></div>)}
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-xl bg-white p-3">
              <span className="text-[12.5px] font-bold">Live routes</span>
              {DEMO_ROUTES.map((r, i) => (
                <div key={r.code} className="mt-2.5 flex items-center gap-2 text-[11.5px]">
                  <span className="w-12 font-semibold">{r.driver}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF0FB]"><span className="block h-full rounded-full" style={{ width: `${[75, 50, 100, 33][i]}%`, background: r.color === '#C8F25C' ? '#7CB518' : r.color }} /></span>
                  <span className="w-10 text-right text-[#6B7489]">{[3, 2, 4, 1][i]}/{r.stops.length}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-white p-3 text-[11.5px]">
              <span className="text-[12.5px] font-bold">Needs attention</span>
              <p className="mt-2 rounded-lg bg-[#FFF4E5] p-2 text-[#B54708]">KS-20866 · no answer, call back</p>
              <p className="mt-1.5 rounded-lg bg-[#EEF0FF] p-2 text-[#3B38BF]">1 address needs a map pin</p>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function DispatchView() {
  return (
    <Frame url="/dispatch?date=2026-11-18">
      <div className="flex">
        <Side active="Dispatch" />
        <div className="flex min-w-0 flex-1 flex-col gap-3 bg-[#F4F6FF] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1030] text-[#C8F25C]">✦</span>
            <span className="flex-1 text-[12.5px] font-bold">Automatic route planning</span>
            <span className="rounded-lg bg-[#0B1030] px-3 py-1.5 text-[11.5px] font-semibold text-white">Plan routes</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-[11px]">
            {[['Routes', '4'], ['Planned', '15/16'], ['Total drive', '36.6 km'], ['Last van back', '08:47']].map(([k, v]) => <div key={k} className="rounded-lg bg-white p-2"><span className="block text-[#6B7489]">{k}</span><span className="text-[14px] font-bold">{v}</span></div>)}
          </div>
          <div className="h-[220px] overflow-hidden rounded-xl"><RouteSketch w={560} h={260} dark={false} /></div>
        </div>
      </div>
    </Frame>
  );
}

export function LiveMapView() {
  return (
    <Frame url="/live-map" dark>
      <div className="relative h-[330px]">
        <RouteSketch w={640} h={330} vans />
        <div className="absolute right-3 top-3 flex w-[200px] flex-col gap-1.5">
          {DEMO_ROUTES.map((r, i) => (
            <div key={r.code} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11.5px] text-white backdrop-blur">
              <span className="h-2 w-2 rounded-full" style={{ background: r.color, boxShadow: `0 0 8px ${r.color}` }} />
              <span className="flex-1 font-semibold">{r.driver}</span><span className="text-white/55">{['2 min ago', 'now', '1 min ago', 'now'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

export function PhoneView() {
  return (
    <div className="mx-auto w-[270px] rounded-[42px] border-[10px] border-[#0B1030] bg-[#F4F6FF] shadow-[0_50px_100px_-40px_rgb(36_34_140/0.6)]">
      <div className="flex flex-col gap-3 p-4 pt-6 text-[13px]">
        <div className="rounded-2xl bg-[#0B1030] p-3.5 text-white">
          <div className="flex items-center justify-between"><span className="font-bold">Route PR-03</span><span className="font-semibold text-[#C8F25C]">2/4</span></div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-full w-1/2 rounded-full bg-[#C8F25C]" /></div>
          <p className="mt-2 text-[11.5px] text-[#C8F25C]">● Sharing your location with the office</p>
        </div>
        <span className="text-[18px] font-bold leading-tight">Albina Bytyqi</span>
        <span className="text-[#4B5468]">Rruga Ilaz Agushi 7, Sunny Hill</span>
        <div className="grid grid-cols-2 gap-2">
          <span className="rounded-xl bg-[#4A49E3] py-2.5 text-center font-semibold text-white">Navigate</span>
          <span className="rounded-xl border border-[#D9DCF5] bg-white py-2.5 text-center font-semibold">Call</span>
        </div>
        <div className="flex items-baseline justify-between rounded-xl bg-white p-3"><span className="text-[#6B7489]">Cash to collect</span><span className="text-[18px] font-bold">€32.00</span></div>
        <div className="flex gap-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#C7C9FF] to-[#9DE9F7] text-[18px]">📦</span>
          <span className="flex h-16 flex-1 items-center justify-center rounded-xl bg-white">
            <svg viewBox="0 0 120 40" className="h-9 w-28"><path d="M6 28 C16 6 22 34 32 18 S48 8 54 26 S70 30 78 14 S98 24 114 12" fill="none" stroke="#0B1030" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </span>
        </div>
        <span className="rounded-xl bg-[#0F9F5F] py-3 text-center text-[14px] font-semibold text-white">Confirm delivery</span>
      </div>
    </div>
  );
}

export function CashView() {
  const rows = [['KS-20853', 'Liridona Berisha', '24.90'], ['KS-20857', 'Vjosa Kelmendi', '15.50'], ['KS-20859', 'Albina Bytyqi', '32.00'], ['KS-20864', 'Ardit Selimi', '27.50']];
  return (
    <Frame url="/cash-check-in">
      <div className="flex">
        <Side active="Cash check-in" />
        <div className="flex min-w-0 flex-1 flex-col gap-3 bg-[#F4F6FF] p-4">
          <div className="rounded-xl border-2 border-[#4A49E3]/30 bg-white p-4">
            <span className="text-[13px] font-bold">Arben Krasniqi, end of shift</span>
            <div className="mt-2 divide-y divide-[#EEF0FB] text-[12px]">
              {rows.map(([c, n, a]) => <div key={c} className="flex gap-3 py-1.5"><span className="w-16 text-[#6B7489]">{c}</span><span className="flex-1">{n}</span><span>€{a}</span></div>)}
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <span className="flex flex-col"><span className="text-[11px] text-[#6B7489]">Should hand in</span><span className="text-[18px] font-extrabold">€99.90</span></span>
              <span className="mb-1 rounded-full bg-[#E3F6EC] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#067647]">✓ matches</span>
              <span className="ml-auto rounded-lg bg-[#4A49E3] px-3 py-1.5 text-[12px] font-semibold text-white">Cash received</span>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function WarehouseView() {
  const rows = [['A-01-03', 'Wireless earbuds', 2, 'PR-03'], ['A-02-01', 'Phone case', 1, 'PR-03'], ['B-01-04', 'Desk lamp', 1, 'PR-01'], ['B-03-02', 'Coffee grinder', 1, 'PR-02']];
  return (
    <Frame url="/pick-pack">
      <div className="flex">
        <Side active="Pick & pack" />
        <div className="flex min-w-0 flex-1 flex-col gap-3 bg-[#F4F6FF] p-4">
          <div className="flex items-center gap-2"><span className="text-[13px] font-bold">Pick list, dock 2</span><span className="rounded-full bg-[#E0F7FD] px-2 py-0.5 text-[11px] font-semibold text-[#0E7490]">Loading order: last stop first</span></div>
          <div className="rounded-xl bg-white p-3 text-[12px]">
            {rows.map(([bin, item, q, r], i) => (
              <div key={bin} className="flex items-center gap-3 border-b border-[#EEF0FB] py-2 last:border-0">
                <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${i < 2 ? 'border-[#0F9F5F] bg-[#0F9F5F] text-white' : 'border-[#CDD3DF]'}`}>{i < 2 ? '✓' : ''}</span>
                <span className="w-16 font-semibold">{bin}</span><span className="flex-1">{item}</span><span className="text-[#6B7489]">×{q}</span><span className="rounded bg-[#EEF0FF] px-1.5 text-[11px] text-[#3B38BF]">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}
