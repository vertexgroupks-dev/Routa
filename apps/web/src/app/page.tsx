import Link from 'next/link';
import type { Metadata } from 'next';
import { Schibsted_Grotesk } from 'next/font/google';
import { Logo, LogoMark, Wordmark } from '@/components/Logo';

const grotesk = Schibsted_Grotesk({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700', '800'], variable: '--font-landing' });

export const metadata: Metadata = {
  title: 'Routa — delivery software for couriers in Kosovo',
  description: 'Plan routes in one click, give drivers their stops on the phone, prove every delivery and count every euro of cash on delivery. Built in Prishtina.'
};

// Where "Book a demo" goes. Replace with your sales email / WhatsApp / booking link.
const DEMO_HREF = 'https://vertex-growth.co';

/* ───────────────────────── Hero map ─────────────────────────
   A drawing of Prishtina: streets, real neighbourhood names, the hub, and three planned routes.
   Points come from the same neighbourhood centres the address lookup uses. */
const HUB = { x: 304, y: 250 };
const ROUTES = [
  { color: '#4A49E3', driver: 'Arben', stops: [[262, 175], [285, 112], [309, 56]] },
  { color: '#0F9F5F', driver: 'Blerta', stops: [[380, 238], [420, 305], [426, 398]] },
  { color: '#0E1325', driver: 'Driton', stops: [[186, 302], [176, 350], [263, 362], [137, 432]] }
] as const;
const PLACES: [string, number, number][] = [
  ['Kodra e Trimave', 322, 40], ['Tophanë', 228, 168], ['Taslixhe', 430, 168], ['Arbëria', 132, 236], ['Velania', 392, 228],
  ['Lakrishtë', 120, 300], ['Sunny Hill', 434, 300], ['Dardania', 108, 356], ['Ulpiana', 276, 386], ['Mati 1', 440, 404], ['Kalabria', 70, 452]
];
const STREETS = [
  'M20 250 C140 246 230 254 304 250 S470 240 600 236', 'M304 0 C300 90 306 170 304 250 S296 410 300 520',
  'M40 70 C160 120 230 170 304 250 S470 400 580 470', 'M560 60 C470 120 390 180 304 250 S150 380 60 500',
  'M0 360 C120 350 220 372 340 366 S520 350 600 352', 'M0 150 C110 160 220 150 330 140 S520 120 600 118',
  'M130 0 C140 120 150 230 160 360 S170 470 175 520', 'M440 0 C430 110 425 220 430 330 S440 460 445 520',
  'M220 0 C230 70 250 130 262 175 S280 300 270 520', 'M520 520 C480 430 430 330 380 238 S330 120 360 0'
];
const MINOR = Array.from({ length: 22 }, (_, i) => {
  const y = 20 + i * 24;
  return `M0 ${y + (i % 3) * 6} C150 ${y - 8} 300 ${y + 10} 600 ${y - 4}`;
});

function HeroMap() {
  const path = (stops: readonly (readonly [number, number])[]) => `M${HUB.x} ${HUB.y} ` + stops.map(([x, y]) => `L${x} ${y}`).join(' ');
  return (
    <svg viewBox="0 0 600 520" className="h-auto w-full" role="img" aria-label="Map of Prishtina with three delivery routes leaving the hub">
      <rect width="600" height="520" fill="#E9EDF4" />
      {MINOR.map((d) => <path key={d} d={d} stroke="#DCE1EB" strokeWidth="2" fill="none" />)}
      {STREETS.map((d) => <path key={d} d={d} stroke="#fff" strokeWidth="11" strokeLinecap="round" fill="none" />)}
      {STREETS.map((d) => <path key={`e${d}`} d={d} stroke="#D3D9E5" strokeWidth="1" fill="none" />)}
      {PLACES.map(([n, x, y]) => <text key={n} x={x} y={y} fontSize="11.5" fontWeight="500" fill="#7A8399" letterSpacing="0.2">{n}</text>)}
      {ROUTES.map((r, i) => (
        <path key={r.driver} d={path(r.stops)} className="route-draw" style={{ animationDelay: `${0.35 + i * 0.35}s` }}
          stroke={r.color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} />
      ))}
      {ROUTES.map((r, i) => r.stops.map(([x, y], k) => (
        <g key={`${r.driver}${k}`} className="stop-pop" style={{ animationDelay: `${0.75 + i * 0.35 + k * 0.12}s` }}>
          <circle cx={x} cy={y} r="11" fill="#fff" stroke={r.color} strokeWidth="3" />
          <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={r.color}>{k + 1}</text>
        </g>
      )))}
      <g>
        <rect x={HUB.x - 15} y={HUB.y - 15} width="30" height="30" rx="8" fill="#0E1325" />
        <path d={`M${HUB.x - 5} ${HUB.y + 6} V${HUB.y - 1} C${HUB.x - 5} ${HUB.y - 5} ${HUB.x - 2} ${HUB.y - 7} ${HUB.x + 2} ${HUB.y - 7}`} stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx={HUB.x + 6} cy={HUB.y - 7} r="2.4" fill="#C8F25C" />
      </g>
      <text x={HUB.x + 20} y={HUB.y + 4} fontSize="12" fontWeight="700" fill="#0E1325">Hub</text>
    </svg>
  );
}

/* ───────────────────────── Small product views ───────────────────────── */
function PlanView() {
  const rows = [['#4A49E3', 'PR-01', 'Arben', '4 stops', '9.8 km'], ['#0F9F5F', 'PR-02', 'Blerta', '4 stops', '11.2 km'], ['#0E1325', 'PR-03', 'Driton', '5 stops', '12.4 km']];
  return (
    <div className="rounded-2xl border border-[#DCE1EB] bg-white p-5 shadow-[0_1px_0_#DCE1EB,0_24px_48px_-28px_rgb(14_19_37/0.35)]">
      <div className="flex items-center gap-3">
        <span className="flex-1 font-semibold">Plan for Wednesday</span>
        <span className="rounded-lg bg-[#F4F6FA] px-2.5 py-1 text-[12.5px] text-[#4B5468]">Use all drivers</span>
      </div>
      <div className="mt-4 divide-y divide-[#EDF0F5]">
        {rows.map(([c, code, d, s, km]) => (
          <div key={code} className="flex items-center gap-3 py-2.5 text-[14px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
            <span className="w-14 font-semibold tabular-nums">{code}</span>
            <span className="flex-1">{d}</span><span className="text-[#6B7489]">{s}</span><span className="w-16 text-right tabular-nums">{km}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-[#ECF8F1] px-3.5 py-2.5 text-[13.5px] text-[#0B6B42]">13 of 14 orders planned. One address needs a pin: “asdf 999”.</div>
      <div className="mt-4 flex justify-end"><span className="rounded-xl bg-[#0E1325] px-4 py-2 text-[14px] font-semibold text-white">Publish 3 routes</span></div>
    </div>
  );
}

function PhoneView() {
  return (
    <div className="mx-auto w-[260px] rounded-[38px] border-[10px] border-[#0E1325] bg-[#F4F6FA] shadow-[0_30px_60px_-30px_rgb(14_19_37/0.5)]">
      <div className="flex flex-col gap-3 p-4 pt-6 text-[13px]">
        <span className="flex justify-between text-[12px] text-[#6B7489]"><span>Stop 3 of 4</span><span className="tabular-nums">KS-20864</span></span>
        <span className="text-[19px] font-bold leading-tight">Ardit Selimi</span>
        <span className="text-[#4B5468]">Velania, hyrja 4, Prishtinë</span>
        <div className="grid grid-cols-2 gap-2">
          <span className="rounded-xl bg-[#4A49E3] py-2.5 text-center font-semibold text-white">Navigate</span>
          <span className="rounded-xl border border-[#DCE1EB] bg-white py-2.5 text-center font-semibold">Call</span>
        </div>
        <div className="flex items-baseline justify-between rounded-xl bg-white p-3"><span className="text-[#6B7489]">Cash to collect</span><span className="text-[18px] font-bold">€27.50</span></div>
        <div className="flex gap-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#DCE1EB] text-[11px] text-[#4B5468]">Photo ✓</span>
          <span className="flex h-16 flex-1 items-center justify-center rounded-xl bg-white">
            <svg viewBox="0 0 120 40" className="h-9 w-28"><path d="M6 28 C16 6 22 34 32 18 S48 8 54 26 S70 30 78 14 S98 24 114 12" fill="none" stroke="#0E1325" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </span>
        </div>
        <span className="rounded-xl bg-[#0F9F5F] py-3 text-center text-[14px] font-semibold text-white">Confirm delivery</span>
      </div>
    </div>
  );
}

function CashView() {
  const rows = [['KS-20853', 'Liridona Berisha', '24.90'], ['KS-20857', 'Vjosa Kelmendi', '15.50'], ['KS-20859', 'Albina Bytyqi', '32.00'], ['KS-20864', 'Ardit Selimi', '27.50']];
  return (
    <div className="rounded-2xl border border-[#DCE1EB] bg-white p-5 shadow-[0_1px_0_#DCE1EB,0_24px_48px_-28px_rgb(14_19_37/0.35)]">
      <div className="font-semibold">Arben Krasniqi, end of shift</div>
      <div className="mt-3 divide-y divide-[#EDF0F5] text-[14px]">
        {rows.map(([c, n, a]) => <div key={c} className="flex gap-3 py-2"><span className="w-20 tabular-nums text-[#6B7489]">{c}</span><span className="flex-1">{n}</span><span className="tabular-nums">€{a}</span></div>)}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="flex flex-col"><span className="text-[12.5px] text-[#6B7489]">Should hand in</span><span className="text-[22px] font-bold tabular-nums">€99.90</span></div>
        <div className="flex flex-col"><span className="text-[12.5px] text-[#6B7489]">Counted</span><span className="text-[22px] font-bold tabular-nums">€99.90</span></div>
        <span className="mb-1 text-[13.5px] font-semibold text-[#0B6B42]">Matches</span>
        <span className="rounded-xl bg-[#4A49E3] px-4 py-2 text-[14px] font-semibold text-white sm:ml-auto">Cash received</span>
      </div>
    </div>
  );
}

/* ───────────────────────── Content ───────────────────────── */
const BEFORE_AFTER: [string, string][] = [
  ['Addresses are neighbourhoods and landmarks, not street numbers.', 'Routa knows Prishtina’s neighbourhoods, finds streets on the map, and remembers every pin you correct — the next order to that customer is placed instantly.'],
  ['Routes are planned from memory every morning.', 'One button splits the day’s orders between your drivers by weight, parcel count and working hours, and puts each van’s stops in the shortest order on real roads.'],
  ['Cash on delivery goes missing between the driver and the office.', 'Every euro is tied to the order it came from. At the end of the shift the cash desk counts it against that list, and differences open a ticket.'],
  ['Shops keep calling to ask where their parcel is.', 'Every customer gets a tracking page, and every shop has its own portal with orders, balances and payouts.'],
  ['Nobody can prove a parcel was delivered.', 'Each delivery saves a photo, the customer’s signature, the time and the GPS point. Anything unusual is flagged for review.']
];
const DAY: [string, string, string][] = [
  ['Day before', 'Orders are in', 'Until the 12:00 cut-off, shops send orders from their portal, a CSV file or the API, and the front desk adds walk-ins. Zone, price and delivery day are set automatically.'],
  ['07:30', 'Routes are planned', 'The dispatcher presses Plan routes, checks the map and publishes. Each driver gets their route on the phone.'],
  ['08:00', 'Vans are loaded', 'The warehouse picks by route. Drivers scan every parcel label into the van, so nothing is left on the shelf.'],
  ['08:30', 'Parcels go out', 'Drivers navigate stop by stop, call customers from the app, and finish each delivery with a photo, a signature and the cash. The office follows on the live map.'],
  ['17:30', 'Cash comes back', 'The driver shows a QR code at the cash desk. Finance counts, confirms, and every shop’s balance updates.'],
  ['Friday', 'Shops get paid', 'Payouts and monthly invoices for every shop are prepared in one go.']
];
const TEAMS: [string, string[]][] = [
  ['Dispatch', ['Automatic route planning on real road distances', 'Manual changes: move stops, swap drivers, re-plan', 'Live map of drivers and stops']],
  ['Warehouse', ['Receive shops’ stock into bins', 'Pick and pack by route', 'Returns check-in with the reason from the driver']],
  ['Helpdesk', ['A ticket for every failed delivery', 'Move orders to another day', 'Proof of delivery review']],
  ['Finance', ['Cash on delivery per driver and per shop', 'Payouts and invoices', 'Cash differences flagged automatically']],
  ['People', ['Payroll by salary, per stop or hourly', 'Drivers, vehicles, licence and service dates']],
  ['Shops', ['Their own portal for orders, stock and payouts', 'CSV import, API keys and delivery webhooks']]
];
const PLANS = [
  { name: 'Starter', price: '€49', per: 'per month', note: 'Up to 5 drivers and 1 warehouse', items: ['Route planning and driver app', 'Proof of delivery', 'Cash on delivery and cash desk', 'Shop portal'] },
  { name: 'Growth', price: '€149', per: 'per month', note: 'Up to 20 drivers and 3 warehouses', items: ['Everything in Starter', 'Warehouse and fulfilment', 'Payouts, invoices and payroll', 'API and webhooks for shops'] },
  { name: 'Enterprise', price: 'Custom', per: '', note: 'More drivers, more hubs', items: ['Everything in Growth', 'Help moving your data in', 'Custom integrations', 'Priority support'] }
];
const FAQ: [string, string][] = [
  ['Do drivers need special phones?', 'No. The driver app runs on any recent Android phone or iPhone.'],
  ['Our customers don’t give exact addresses. Will it work?', 'Yes. Routa understands neighbourhood names and landmarks. When an address can’t be found, the dispatcher drops a pin once — Routa remembers it for that customer.'],
  ['Can the shops we deliver for send orders automatically?', 'Yes: from their own portal, by uploading a CSV file, or straight from their online store through the API. They get notified when a parcel is delivered.'],
  ['Can each employee see only their own part?', 'Yes. The dispatcher, warehouse, helpdesk, finance and HR each see only the screens for their job, and the database enforces the same rules.'],
  ['What happens to cash on delivery?', 'The driver records the amount at each stop. At the end of the shift the cash desk counts it against those orders. The shop’s balance updates, and its payout is ready on Friday.']
];

export default function Landing() {
  return (
    <div className={`${grotesk.variable} landing min-h-screen overflow-x-clip bg-[#F4F6FA] text-[#0E1325]`} style={{ fontFamily: 'var(--font-landing), system-ui, sans-serif' }}>
      <style>{`
        .landing ::selection { background: #C8F25C; }
        .landing a:focus-visible, .landing button:focus-visible, .landing input:focus-visible, .landing summary:focus-visible { outline: 2px solid #4A49E3; outline-offset: 3px; border-radius: 8px; }
        .route-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.2s cubic-bezier(.6,.1,.3,1) forwards; }
        .stop-pop { opacity: 0; transform-box: fill-box; transform-origin: center; animation: pop .35s ease-out forwards; }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @keyframes pop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { .route-draw { animation: none; stroke-dashoffset: 0; } .stop-pop { animation: none; opacity: 1; } }
      `}</style>

      {/* Header */}
      <header className="mx-auto flex max-w-[1180px] items-center gap-6 px-5 py-5 sm:px-8">
        <Logo />
        <nav className="ml-6 hidden gap-6 text-[15px] text-[#4B5468] lg:flex">
          <a href="#how" className="hover:text-[#0E1325]">How it works</a>
          <a href="#product" className="hover:text-[#0E1325]">Product</a>
          <a href="#pricing" className="hover:text-[#0E1325]">Pricing</a>
          <a href="#faq" className="hover:text-[#0E1325]">Questions</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="rounded-xl px-3.5 py-2 text-[15px] font-medium hover:bg-white">Sign in</Link>
          <a href={DEMO_HREF} className="rounded-xl bg-[#0E1325] px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#232A42]">Book a demo</a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.02fr_1fr] lg:pt-16">
        <div>
          <h1 className="text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[64px]">Tomorrow’s deliveries, planned in one click.</h1>
          <p className="mt-6 max-w-[34em] text-[18px] leading-[1.6] text-[#3E4659]">
            Routa is delivery software for courier companies in Kosovo. It finds every address — even “Dardania, hyrja 4” — splits the orders between your drivers, and puts each van’s stops in the shortest order. Drivers get the route on their phone. The office sees every delivery, photo and euro of cash.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={DEMO_HREF} className="rounded-xl bg-[#4A49E3] px-5 py-3.5 text-[16px] font-semibold text-white hover:bg-[#3B38BF]">Book a demo</a>
            <Link href="/login" className="rounded-xl border border-[#CDD3DF] bg-white px-5 py-3.5 text-[16px] font-semibold hover:border-[#0E1325]">Try it with demo data</Link>
          </div>
          <p className="mt-6 text-[14px] text-[#6B7489]">Made in Prishtina for couriers, fulfilment warehouses and the shops they deliver for.</p>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-[28px] border border-[#DCE1EB] shadow-[0_40px_80px_-40px_rgb(14_19_37/0.45)]"><HeroMap /></div>
          <div className="absolute -bottom-6 left-4 right-4 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-2xl border border-[#DCE1EB] bg-white px-5 py-3.5 text-[14px] shadow-[0_18px_40px_-24px_rgb(14_19_37/0.4)] sm:left-8 sm:right-auto">
            {ROUTES.map((r) => <span key={r.driver} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />{r.driver}, {r.stops.length} stops</span>)}
            <span className="text-[#6B7489]">Last van back 10:12</span>
          </div>
        </div>
      </section>

      {/* Before / after */}
      <section className="border-y border-[#DCE1EB] bg-white">
        <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8">
          <h2 className="max-w-[18em] text-[34px] font-bold leading-[1.1] tracking-[-0.025em] sm:text-[42px]">Paper lists and WhatsApp groups stop working after ten drivers.</h2>
          <dl className="mt-12 grid gap-x-12 gap-y-9 lg:grid-cols-2">
            {BEFORE_AFTER.map(([before, after]) => (
              <div key={before} className="grid gap-2 border-l-[3px] border-[#DCE1EB] pl-5">
                <dt className="text-[15px] text-[#6B7489] line-through decoration-[#B8BFCC]">{before}</dt>
                <dd className="text-[17px] leading-[1.55]">{after}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* A day with Routa */}
      <section id="how" className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
        <h2 className="text-[34px] font-bold tracking-[-0.025em] sm:text-[42px]">A day with Routa</h2>
        <p className="mt-3 max-w-[38em] text-[17px] text-[#4B5468]">From the cut-off to the cash desk, each team works in the same system, so nothing has to be copied from one list to another.</p>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-[#DCE1EB] bg-[#DCE1EB] sm:grid-cols-2 lg:grid-cols-3">
          {DAY.map(([time, title, body]) => (
            <li key={time} className="flex flex-col gap-2 bg-[#F4F6FA] p-7">
              <span className="text-[28px] font-extrabold tabular-nums tracking-[-0.02em] text-[#4A49E3]">{time}</span>
              <span className="text-[18px] font-semibold">{title}</span>
              <span className="text-[15.5px] leading-[1.6] text-[#3E4659]">{body}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Product */}
      <section id="product" className="bg-white">
        <div className="mx-auto grid max-w-[1180px] gap-20 px-5 py-24 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 [&>*]:min-w-0">
            <div>
              <h2 className="text-[30px] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[36px]">The dispatcher checks the plan instead of making it.</h2>
              <p className="mt-4 text-[17px] leading-[1.6] text-[#3E4659]">Routa looks at every order for the day, every free driver and the size of every van. Choose <b>Use all drivers</b> to finish sooner, or <b>Fewest drivers</b> to spend less on fuel. Orders it can’t plan are listed with the reason, so you fix them before the vans leave.</p>
            </div>
            <PlanView />
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-2 [&>*]:min-w-0">
            <div className="lg:order-2">
              <h2 className="text-[30px] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[36px]">Drivers see one stop at a time.</h2>
              <p className="mt-4 text-[17px] leading-[1.6] text-[#3E4659]">The app shows the next customer, the address notes and the cash to collect. One tap opens navigation or calls the customer. A delivery is finished with a photo and a signature; a failed one with the reason, so the helpdesk can call the customer back the same day.</p>
            </div>
            <div className="lg:order-1"><PhoneView /></div>
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-2 [&>*]:min-w-0">
            <div>
              <h2 className="text-[30px] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[36px]">Every euro is counted against an order.</h2>
              <p className="mt-4 text-[17px] leading-[1.6] text-[#3E4659]">At the end of the shift the driver shows a code. The cash desk sees exactly which orders the money belongs to, counts it and confirms. Shops’ balances update straight away, and a missing amount becomes a ticket instead of an argument.</p>
            </div>
            <CashView />
          </div>
        </div>
      </section>

      {/* Teams */}
      <section className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
        <h2 className="text-[34px] font-bold tracking-[-0.025em] sm:text-[42px]">One system for the whole company</h2>
        <p className="mt-3 max-w-[38em] text-[17px] text-[#4B5468]">Each person signs in and sees only the screens for their job.</p>
        <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {TEAMS.map(([team, items]) => (
            <div key={team}>
              <h3 className="border-b-2 border-[#0E1325] pb-2 text-[19px] font-bold">{team}</h3>
              <ul className="mt-3 grid gap-2 text-[15.5px] leading-[1.5] text-[#3E4659]">
                {items.map((it) => <li key={it} className="flex gap-2.5"><span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-[#4A49E3]" />{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-[#DCE1EB] bg-white">
        <div className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
          <h2 className="text-[34px] font-bold tracking-[-0.025em] sm:text-[42px]">Pricing</h2>
          <p className="mt-3 max-w-[38em] text-[17px] text-[#4B5468]">One monthly price for the company. The driver app and the shop portal are included; there is no charge per parcel.</p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANS.map((p, i) => (
              <div key={p.name} className={`flex flex-col rounded-3xl p-7 ${i === 1 ? 'bg-[#0E1325] text-white' : 'border border-[#DCE1EB] bg-[#F4F6FA]'}`}>
                <span className="text-[19px] font-bold">{p.name}</span>
                <span className={`mt-1 text-[14.5px] ${i === 1 ? 'text-white/70' : 'text-[#6B7489]'}`}>{p.note}</span>
                <span className="mt-6 flex items-baseline gap-2"><span className="text-[44px] font-extrabold tracking-[-0.03em]">{p.price}</span><span className={i === 1 ? 'text-white/70' : 'text-[#6B7489]'}>{p.per}</span></span>
                <ul className={`mt-6 grid gap-2.5 text-[15.5px] ${i === 1 ? 'text-white/90' : 'text-[#3E4659]'}`}>
                  {p.items.map((it) => <li key={it} className="flex gap-2.5"><svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 flex-none"><path d="M3 8.5l3 3 7-7" fill="none" stroke={i === 1 ? '#C8F25C' : '#0F9F5F'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>{it}</li>)}
                </ul>
                <a href={DEMO_HREF} className={`mt-8 rounded-xl px-4 py-3 text-center text-[15.5px] font-semibold ${i === 1 ? 'bg-[#C8F25C] text-[#0E1325] hover:bg-[#D6F77F]' : 'border border-[#CDD3DF] bg-white hover:border-[#0E1325]'}`}>{p.price === 'Custom' ? 'Talk to us' : 'Book a demo'}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto grid max-w-[1180px] gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <h2 className="text-[34px] font-bold tracking-[-0.025em] sm:text-[42px]">Questions couriers ask us</h2>
        <div className="divide-y divide-[#DCE1EB] border-y border-[#DCE1EB]">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17.5px] font-semibold">
                {q}<span className="text-[22px] font-normal text-[#6B7489] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-[40em] text-[16px] leading-[1.6] text-[#3E4659]">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="bg-[#0E1325] text-white">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-[34px] font-bold leading-[1.1] tracking-[-0.025em] sm:text-[46px]">Send us one day of your orders. We’ll show you the routes.</h2>
            <p className="mt-4 max-w-[34em] text-[17px] text-white/75">In a 20-minute call we plan your real orders with your drivers, and you see the map, the kilometres and the time each van gets back.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a href={DEMO_HREF} className="rounded-xl bg-[#C8F25C] px-6 py-4 text-[16.5px] font-semibold text-[#0E1325] hover:bg-[#D6F77F]">Book a demo</a>
            <Link href="/login" className="rounded-xl border border-white/25 px-6 py-4 text-[16.5px] font-semibold hover:border-white">Sign in</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-[1180px] flex-wrap items-start gap-10 px-5 py-12 text-[14.5px] text-[#4B5468] sm:px-8">
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2.5"><LogoMark size={28} /><Wordmark height={22} /></span>
          <span className="max-w-[22em]">Delivery software for couriers in Kosovo. Made in Prishtina by <a href="https://vertex-growth.co" className="underline underline-offset-2 hover:text-[#0E1325]">Vertex Growth</a>.</span>
        </div>
        <form action="/t" className="flex flex-col gap-2">
          <label htmlFor="track" className="font-semibold text-[#0E1325]">Track a parcel</label>
          <div className="flex gap-2">
            <input id="track" name="code" placeholder="Tracking code" className="w-44 rounded-xl border border-[#CDD3DF] bg-white px-3 py-2.5 uppercase" />
            <button className="rounded-xl bg-[#0E1325] px-4 font-semibold text-white">Track</button>
          </div>
        </form>
        <div className="ml-auto flex flex-col gap-2">
          <span className="font-semibold text-[#0E1325]">Sign in</span>
          <Link href="/login" className="hover:text-[#0E1325]">Office and shops</Link>
          <Link href="/driver-app" className="hover:text-[#0E1325]">Driver app</Link>
        </div>
      </footer>
    </div>
  );
}
