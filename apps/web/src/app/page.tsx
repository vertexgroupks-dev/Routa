import Link from 'next/link';
import type { Metadata } from 'next';
import { Schibsted_Grotesk } from 'next/font/google';
import { Logo, LogoMark, Wordmark } from '@/components/Logo';
import { LiveRouteMap } from '@/components/landing/LiveRouteMap';
import { CountUp, PlanCompare, ProductTour, type TourTab } from '@/components/landing/Interactive';
import { OverviewView, DispatchView, LiveMapView, PhoneView, CashView, WarehouseView, Frame } from '@/components/landing/Views';

const grotesk = Schibsted_Grotesk({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700', '800'], variable: '--font-landing' });

export const metadata: Metadata = {
  title: 'Routa — the operating system for delivery companies',
  description: 'AI route planning, a driver app with proof of delivery, live tracking, cash on delivery, warehouse, finance and HR in one platform. Built in Prishtina.'
};

// Where "Talk to sales" goes. Replace with your sales email, WhatsApp or booking link.
const SALES_HREF = 'https://vertex-growth.co';

const TOUR: TourTab[] = [
  { key: 'overview', label: 'Overview', color: '#C7C9FF', title: 'The whole day on one screen.', body: 'Orders, deliveries, problems and cash in real time. Every route’s progress, and the few things that need a person — a customer who didn’t answer, an address without a pin.', view: <OverviewView /> },
  { key: 'dispatch', label: 'Dispatch', color: '#C8F25C', title: 'Plan every route with one button.', body: 'Routa reads the day’s orders, the free drivers and the size of every van, then publishes a plan the dispatcher only has to check. Choose to finish sooner or to spend less fuel.', view: <DispatchView /> },
  { key: 'live', label: 'Live map', color: '#9DE9F7', title: 'Know where every van is.', body: 'Drivers share their position while they work. The office sees each route, each stop done and each stop left — and the customer gets a tracking page with the van approaching.', view: <LiveMapView /> },
  { key: 'driver', label: 'Driver app', color: '#FBCFE8', title: 'A driver app that proves every delivery.', body: 'Scan parcels into the van, navigate stop by stop, call the customer, collect cash. Each delivery closes with a photo, a signature and the GPS point.', view: <PhoneView /> },
  { key: 'cash', label: 'Cash desk', color: '#C8F25C', title: 'Every euro of cash on delivery, counted.', body: 'At the end of the shift the driver shows a QR code. Finance sees exactly which orders the money is for, counts it and confirms. Shops’ balances update on the spot.', view: <CashView /> },
  { key: 'warehouse', label: 'Warehouse', color: '#9DE9F7', title: 'Fulfilment for the shops you deliver for.', body: 'Receive shops’ stock into bins, reserve it per order and pick by route, loaded in reverse stop order so the first delivery is at the door of the van.', view: <WarehouseView /> }
];

const MODULES: { name: string; color: string; text: string; items: string[]; span?: string }[] = [
  { name: 'Dispatch & AI planning', color: '#4A49E3', text: 'Routes planned on real roads in seconds.', items: ['Capacity, parcels and working hours', 'Re-plan any time', 'Publish to drivers'], span: 'lg:col-span-2' },
  { name: 'Driver app', color: '#DB2777', text: 'Android and iPhone.', items: ['Scan to load', 'Photo + signature', 'Live location'] },
  { name: 'Warehouse', color: '#0891B2', text: 'Stock, bins and returns.', items: ['Inbound receiving', 'Pick & pack by route', 'Returns check-in'] },
  { name: 'Finance', color: '#5E8F00', text: 'Cash on delivery, payouts, invoices.', items: ['Cash desk with QR', 'Weekly shop payouts', 'Monthly invoices'] },
  { name: 'Helpdesk', color: '#E8590C', text: 'Every failed delivery becomes a task.', items: ['Call-backs', 'Move to another day', 'Proof review'] },
  { name: 'People', color: '#7C3AED', text: 'Drivers, fleet and payroll.', items: ['Salary, per-stop or hourly', 'Licence & service dates'] },
  { name: 'Shop portal & API', color: '#0F766E', text: 'The shops you deliver for, connected.', items: ['Orders, stock, payouts', 'CSV import', 'API keys & webhooks'], span: 'lg:col-span-2' }
];

const DAY: [string, string, string][] = [
  ['Day before', 'Orders arrive', 'Until the 12:00 cut-off, shops send orders from their portal, a CSV file or the API. Zone, price and delivery day are set automatically.'],
  ['07:30', 'Routes are planned', 'The dispatcher presses Plan routes, checks the map and publishes. Every driver gets their route on the phone.'],
  ['08:00', 'Vans are loaded', 'The warehouse picks by route; drivers scan each parcel label into the van.'],
  ['08:30', 'Parcels go out', 'Navigation, calls, photo, signature and cash at every stop. The office watches the live map.'],
  ['17:30', 'Cash comes back', 'QR code at the cash desk, counted against the orders. Shops’ balances update.'],
  ['Friday', 'Shops get paid', 'Payouts and invoices for every shop, prepared in one go.']
];

const FAQ: [string, string][] = [
  ['How does the AI plan routes?', 'It places every address on the map (including neighbourhood addresses like “Dardania, hyrja 4”), measures real driving distance and time between every pair of stops, splits the orders between your free vans by weight, parcels and working hours, and orders each van’s stops for the shortest drive. The dispatcher reviews and publishes.'],
  ['Our customers don’t give exact addresses. Will it work?', 'Yes. Routa understands Prishtina’s neighbourhoods and landmarks. When an address can’t be found, the dispatcher drops a pin once and Routa remembers it for that customer.'],
  ['Do drivers need special phones?', 'No. The driver app runs on any recent Android phone or iPhone.'],
  ['Can each employee see only their part?', 'Yes. Dispatch, warehouse, helpdesk, finance and HR each see only the screens for their job, and the database enforces the same rules.'],
  ['How is Routa priced?', 'Per company, based on the size of your fleet and the number of hubs — not per parcel and not per user. Talk to us and we’ll prepare an offer for your company.']
];

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[13.5px] font-medium text-white/85 backdrop-blur">
    <span className="h-1.5 w-1.5 rounded-full bg-[#C8F25C] shadow-[0_0_10px_#C8F25C]" />{children}
  </span>
);

export default function Landing() {
  return (
    <div className={`${grotesk.variable} landing min-h-screen overflow-x-clip bg-[#F4F6FF] text-[#0B1030]`} style={{ fontFamily: 'var(--font-landing), system-ui, sans-serif' }}>
      <style>{`
        .night-tiles { filter: invert(1) hue-rotate(205deg) brightness(.78) contrast(1.15) saturate(.55); }
        .landing .leaflet-control-attribution { background: rgba(7,11,36,.7); color: rgba(255,255,255,.55); }
        .landing .leaflet-control-attribution a { color: rgba(255,255,255,.75); }
        .landing ::selection { background: #C8F25C; color: #0B1030; }
        .landing a:focus-visible, .landing button:focus-visible, .landing input:focus-visible, .landing summary:focus-visible { outline: 2px solid #8B8AFF; outline-offset: 3px; border-radius: 10px; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(-8px) scale(.97); } to { opacity: 1; transform: none; } }
        .toast-in { animation: toastIn .35s ease-out; }
        @keyframes fadeSwap { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .fade-swap { animation: fadeSwap .45s ease-out; }
        @keyframes tourBar { from { width: 0; } to { width: 100%; } }
        .tour-progress { animation: tourBar 6.5s linear forwards; }
        @keyframes vanPulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
        .van-pulse { animation: vanPulse 1.6s ease-in-out infinite; }
        @keyframes drift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, -20px); } }
        .glow { animation: drift 14s ease-in-out infinite; }
        @keyframes heroIn { from { opacity: 0; transform: translateY(24px) scale(.98); } to { opacity: 1; transform: none; } }
        .hero-in { animation: heroIn .9s cubic-bezier(.2,.7,.2,1) .15s both; }
        @media (prefers-reduced-motion: reduce) { .toast-in, .fade-swap, .tour-progress, .van-pulse, .glow, .hero-in { animation: none !important; } }
      `}</style>

      {/* ───────────── Hero ───────────── */}
      <section className="relative overflow-hidden bg-[#070B24] text-white">
        <div aria-hidden className="glow pointer-events-none absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-[#4A49E3] opacity-40 blur-[140px]" />
        <div aria-hidden className="glow pointer-events-none absolute -right-32 top-24 h-[520px] w-[520px] rounded-full bg-[#38D6F5] opacity-20 blur-[140px]" style={{ animationDelay: '-6s' }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />

        <header className="relative mx-auto flex max-w-[1240px] items-center gap-6 px-5 py-5 sm:px-8">
          <Logo light dark />
          <nav className="ml-6 hidden gap-7 text-[15px] text-white/70 lg:flex">
            <a href="#ai" className="hover:text-white">AI planning</a>
            <a href="#product" className="hover:text-white">Product</a>
            <a href="#platform" className="hover:text-white">Platform</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="rounded-xl px-3.5 py-2 text-[15px] font-medium text-white/85 hover:bg-white/10">Sign in</Link>
            <a href={SALES_HREF} className="rounded-xl bg-[#C8F25C] px-4 py-2.5 text-[15px] font-semibold text-[#0B1030] hover:bg-[#D9F88A]">Talk to sales</a>
          </div>
        </header>

        <div className="relative mx-auto max-w-[1240px] px-5 pb-10 pt-10 sm:px-8 lg:pt-16">
          <div className="max-w-[880px]">
            <Pill>AI route planning, live in Prishtina</Pill>
            <h1 className="mt-6 text-[46px] font-extrabold leading-[0.98] tracking-[-0.045em] sm:text-[78px]">
              The operating system for <span className="bg-gradient-to-r from-[#A5A4FF] via-[#7DE3F8] to-[#C8F25C] bg-clip-text text-transparent">delivery companies</span>.
            </h1>
            <p className="mt-7 max-w-[40em] text-[18.5px] leading-[1.6] text-white/70">
              Routa plans every route with AI, sends drivers the shortest way on real roads, proves every delivery and counts every euro of cash. Dispatch, warehouse, drivers, finance and HR — one platform, one login per person.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={SALES_HREF} className="rounded-2xl bg-[#C8F25C] px-6 py-4 text-[16.5px] font-semibold text-[#0B1030] shadow-[0_10px_40px_-10px_#C8F25C] hover:bg-[#D9F88A]">Talk to sales</a>
              <a href="#ai" className="rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-[16.5px] font-semibold text-white backdrop-blur hover:bg-white/10">Watch it plan</a>
            </div>
          </div>

          <div className="hero-in relative mt-14">
            <div aria-hidden className="absolute -inset-x-10 -bottom-10 top-10 rounded-[48px] bg-gradient-to-r from-[#4A49E3]/50 via-[#38D6F5]/30 to-[#C8F25C]/30 blur-3xl" />
            <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-[#0B1030] shadow-[0_60px_140px_-40px_rgb(74_73_227/0.8)]">
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/[.03] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF6159]" /><span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28C941]" />
                <span className="ml-3 rounded-md bg-white/5 px-3 py-1 text-[12px] text-white/50">routa.app/live-map</span>
                <span className="ml-auto hidden items-center gap-2 text-[12px] text-white/60 sm:flex"><span className="h-2 w-2 animate-pulse rounded-full bg-[#C8F25C]" />Live, Prishtinë</span>
              </div>
              <div className="h-[420px] sm:h-[520px]"><LiveRouteMap /></div>
            </div>
          </div>
        </div>

        {/* proof numbers */}
        <div className="relative mx-auto grid max-w-[1240px] gap-8 px-5 pb-20 pt-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {[
            [<CountUp key="a" to={59} suffix="%" />, 'less driving', '155 km down to 63 km for the same 40 addresses'],
            [<CountUp key="b" to={2.7} decimals={1} suffix="×" />, 'sooner back at the hub', '4 vans finish in about 40 minutes instead of one van in 1 h 48'],
            [<span key="c">1 click</span>, 'from orders to routes', 'addresses placed, vans filled, stops ordered'],
            [<CountUp key="d" to={6} />, 'teams in one system', 'dispatch, warehouse, drivers, helpdesk, finance, HR']
          ].map(([n, l, s], i) => (
            <div key={i} className="border-l-2 border-[#C8F25C]/70 pl-5">
              <div className="text-[46px] font-extrabold leading-none tracking-[-0.04em]">{n}</div>
              <div className="mt-2 text-[16px] font-semibold">{l as string}</div>
              <div className="mt-1 text-[14px] text-white/55">{s as string}</div>
            </div>
          ))}
          <p className="text-[12.5px] text-white/35 sm:col-span-2 lg:col-span-4">Results from Routa’s planner on test orders across Prishtina, November 2026.</p>
        </div>
      </section>

      {/* ───────────── AI ───────────── */}
      <section id="ai" className="relative overflow-hidden bg-gradient-to-b from-[#070B24] to-[#12164A] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8">
          <div className="max-w-[760px]">
            <h2 className="text-[38px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[54px]">AI that saves kilometres, fuel and hours — every single morning.</h2>
            <p className="mt-5 text-[18px] leading-[1.6] text-white/65">Planning 40 deliveries by hand takes an hour and still zig-zags across the city. Routa does it in seconds, on real roads, within each van’s capacity and the drivers’ working hours.</p>
          </div>
          <div className="mt-14"><PlanCompare /></div>
          <ol className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Reads every address', 'Streets, neighbourhoods and landmarks become exact points on the map. Corrected pins are remembered.', '#8B8AFF'],
              ['Measures real roads', 'Driving distance and time between every pair of stops, from the actual street network.', '#38D6F5'],
              ['Fills the vans', 'Orders are shared between free drivers by weight, parcel count and working hours.', '#F472B6'],
              ['Orders the stops', 'Each route is untangled until no swap makes it shorter, then published to the driver.', '#C8F25C']
            ].map(([t, b, c], i) => (
              <li key={t} className="rounded-3xl border border-white/10 bg-white/[.04] p-6 backdrop-blur">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-extrabold text-[#0B1030]" style={{ background: c }}>{i + 1}</span>
                <h3 className="mt-4 text-[18px] font-bold">{t}</h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-white/60">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── Product tour ───────────── */}
      <section id="product" className="relative">
        <div aria-hidden className="pointer-events-none absolute right-0 top-20 h-[420px] w-[420px] rounded-full bg-[#C7C9FF] opacity-50 blur-[120px]" />
        <div className="relative mx-auto max-w-[1240px] px-5 py-24 sm:px-8">
          <h2 className="max-w-[760px] text-[38px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[54px]">See your company run itself.</h2>
          <p className="mt-5 max-w-[40em] text-[18px] leading-[1.6] text-[#3E4659]">Every screen below is from Routa, filled with the routes our planner made for a morning in Prishtina.</p>
          <div className="mt-12"><ProductTour tabs={TOUR} /></div>
        </div>
      </section>

      {/* ───────────── Platform bento ───────────── */}
      <section id="platform" className="bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8">
          <h2 className="max-w-[820px] text-[38px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[54px]">Manage the whole company from one platform.</h2>
          <p className="mt-5 max-w-[40em] text-[18px] leading-[1.6] text-[#3E4659]">No spreadsheets passed between teams. Each person signs in and sees exactly the screens their job needs.</p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m) => (
              <div key={m.name} className={`group relative overflow-hidden rounded-3xl p-7 text-white ${m.span ?? ''}`} style={{ background: `linear-gradient(145deg, ${m.color}, ${m.color}CC)` }}>
                <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                <h3 className="relative text-[21px] font-bold">{m.name}</h3>
                <p className="relative mt-1 text-[15px] text-white/80">{m.text}</p>
                <ul className="relative mt-5 flex flex-wrap gap-2">
                  {m.items.map((it) => <li key={it} className="rounded-full bg-white/15 px-3 py-1.5 text-[13.5px] font-medium backdrop-blur">{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── A day ───────────── */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8">
        <h2 className="text-[38px] font-extrabold tracking-[-0.035em] sm:text-[54px]">A day with Routa</h2>
        <ol className="relative mt-14 grid gap-8 lg:grid-cols-6 lg:gap-5">
          <div aria-hidden className="absolute left-0 right-0 top-[22px] hidden h-[3px] rounded-full bg-gradient-to-r from-[#4A49E3] via-[#38D6F5] to-[#C8F25C] lg:block" />
          {DAY.map(([time, title, body]) => (
            <li key={time} className="relative flex flex-col gap-2">
              <span className="relative z-10 flex h-11 w-fit items-center rounded-full border-[3px] border-[#F4F6FF] bg-[#0B1030] px-4 text-[14px] font-bold text-white">{time}</span>
              <span className="mt-2 text-[17px] font-bold">{title}</span>
              <span className="text-[14.5px] leading-[1.55] text-[#3E4659]">{body}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────── Built for the job ───────────── */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-[38px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[48px]">Built for how Kosovo delivers.</h2>
            <ul className="mt-8 grid gap-5 text-[16.5px] leading-[1.55]">
              {[
                ['Addresses people actually write', 'Neighbourhoods, entrances and landmarks are understood, and every corrected pin is remembered for that customer.', '#4A49E3'],
                ['Cash on delivery, first-class', 'Each euro is tied to an order, counted at the desk and paid out to the shop — with differences flagged automatically.', '#5E8F00'],
                ['Proof that holds up', 'Photo, signature, time and GPS on every delivery. The office can review a proof but never change the evidence.', '#DB2777'],
                ['Each person sees their part', 'Seven office roles plus drivers and shops, enforced in the database itself, not just hidden in the menu.', '#0891B2']
              ].map(([t, b, c]) => (
                <li key={t} className="flex gap-4">
                  <span className="mt-1.5 h-3 w-3 flex-none rounded-full" style={{ background: c, boxShadow: `0 0 0 5px ${c}22` }} />
                  <span><b className="font-bold">{t}.</b> <span className="text-[#3E4659]">{b}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div aria-hidden className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-[#C7C9FF] via-[#9DE9F7] to-[#E9FBB5] opacity-70 blur-2xl" />
            <div className="relative"><Frame url="/pod"><ProofList /></Frame></div>
          </div>
        </div>
      </section>

      {/* ───────────── Pricing ───────────── */}
      <section id="pricing" className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8">
        <div className="relative overflow-hidden rounded-[36px] bg-[#070B24] p-8 text-white sm:p-14">
          <div aria-hidden className="glow pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#4A49E3] opacity-50 blur-[110px]" />
          <div aria-hidden className="glow pointer-events-none absolute -bottom-32 left-10 h-[360px] w-[360px] rounded-full bg-[#C8F25C] opacity-20 blur-[110px]" style={{ animationDelay: '-7s' }} />
          <div className="relative grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <h2 className="text-[38px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[52px]">One platform. Priced for your company.</h2>
              <p className="mt-5 max-w-[34em] text-[18px] leading-[1.6] text-white/70">Routa is licensed per company, sized to your fleet and hubs — not per parcel, not per user. Every module is included, and we set it up with your team.</p>
              <a href={SALES_HREF} className="mt-9 inline-flex rounded-2xl bg-[#C8F25C] px-7 py-4 text-[17px] font-semibold text-[#0B1030] shadow-[0_10px_40px_-10px_#C8F25C] hover:bg-[#D9F88A]">Talk to sales</a>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {['AI route planning', 'Driver app for every driver', 'Live map and customer tracking', 'Proof of delivery', 'Cash desk and shop payouts', 'Warehouse and returns', 'Helpdesk', 'Payroll and fleet', 'Shop portal, CSV and API', 'Unlimited office users', 'Setup and training for your team', 'Priority support'].map((it) => (
                <li key={it} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 text-[15px] backdrop-blur">
                  <svg viewBox="0 0 16 16" className="h-4 w-4 flex-none"><path d="M3 8.5l3 3 7-7" fill="none" stroke="#C8F25C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>{it}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 pb-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <h2 className="text-[38px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[48px]">Questions</h2>
        <div className="divide-y divide-[#D9DCF5] border-y border-[#D9DCF5]">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-semibold">
                {q}<span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#EEF0FF] text-[20px] text-[#4A49E3] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-[42em] text-[16px] leading-[1.65] text-[#3E4659]">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ───────────── Closing ───────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4A49E3] via-[#3B38BF] to-[#0E7490] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[60px]">Send us one day of orders. We’ll show you the routes.</h2>
            <p className="mt-5 max-w-[34em] text-[18px] text-white/80">In a short call we plan your real orders with your drivers, and you see the map, the kilometres and the time each van gets back.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a href={SALES_HREF} className="rounded-2xl bg-[#C8F25C] px-7 py-4 text-[17px] font-semibold text-[#0B1030] hover:bg-[#D9F88A]">Talk to sales</a>
            <Link href="/login" className="rounded-2xl border border-white/30 px-7 py-4 text-[17px] font-semibold hover:bg-white/10">Sign in</Link>
          </div>
        </div>
      </section>

      {/* ───────────── Footer ───────────── */}
      <footer className="bg-[#070B24] text-white/60">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-start gap-10 px-5 py-14 text-[14.5px] sm:px-8">
          <div className="flex flex-col gap-3">
            <span className="flex items-center gap-2.5"><LogoMark dark size={30} /><Wordmark color="#fff" dot="#C8F25C" height={23} /></span>
            <span className="max-w-[24em]">The operating system for delivery companies. Made in Prishtina by <a href="https://vertex-growth.co" className="text-white underline underline-offset-2">Vertex Growth</a>.</span>
          </div>
          <form action="/t" className="flex flex-col gap-2">
            <label htmlFor="track" className="font-semibold text-white">Track a parcel</label>
            <div className="flex gap-2">
              <input id="track" name="code" placeholder="Tracking code" className="w-44 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 uppercase text-white placeholder:text-white/35" />
              <button className="rounded-xl bg-[#C8F25C] px-4 font-semibold text-[#0B1030]">Track</button>
            </div>
          </form>
          <div className="ml-auto flex flex-col gap-2">
            <span className="font-semibold text-white">Sign in</span>
            <Link href="/login" className="hover:text-white">Office and shops</Link>
            <Link href="/driver-app" className="hover:text-white">Driver app</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProofList() {
  const rows = [
    ['KS-20853', 'Liridona Berisha', 'Rruga Agim Ramadani 23', '0 m', 'from-[#C7C9FF] to-[#9DE9F7]'],
    ['KS-20859', 'Albina Bytyqi', 'Sunny Hill', '12 m', 'from-[#FBCFE8] to-[#C7C9FF]'],
    ['KS-20864', 'Ardit Selimi', 'Velania, hyrja 4', '31 m', 'from-[#E9FBB5] to-[#9DE9F7]']
  ];
  return (
    <div className="flex flex-col gap-2.5 bg-[#F4F6FF] p-4">
      {rows.map(([c, n, a, d, g]) => (
        <div key={c} className="flex items-center gap-3 rounded-xl bg-white p-3 text-[12.5px]">
          <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-gradient-to-br ${g} text-[18px]`}>📦</span>
          <span className="flex min-w-0 flex-1 flex-col"><span className="font-semibold">{n}</span><span className="truncate text-[#6B7489]">{c}, {a}, {d} from the door</span></span>
          <svg viewBox="0 0 80 30" className="hidden h-7 w-16 sm:block"><path d="M4 22 C12 4 18 26 26 14 S40 6 46 20 S60 24 76 8" fill="none" stroke="#0B1030" strokeWidth="2" strokeLinecap="round" /></svg>
          <span className="rounded-full bg-[#E3F6EC] px-2.5 py-1 text-[11.5px] font-semibold text-[#067647]">Verified</span>
        </div>
      ))}
    </div>
  );
}
