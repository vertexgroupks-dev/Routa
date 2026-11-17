import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Icon, type IconName } from '@/components/Icon';

const FEATURES: { icon: IconName; title: string; body: string; wide?: boolean }[] = [
  { icon: 'route', title: 'Dispatch that plans itself', body: 'Orders are grouped by zone and sequenced per driver with van capacity, time windows and shifts in mind. Drag, adjust, publish.', wide: true },
  { icon: 'navigation', title: 'A driver app built for the road', body: 'Stops in order, one-tap navigation and calling, cash checks and offline-safe saves.' },
  { icon: 'camera', title: 'Proof on every drop', body: 'Recipient, GPS and time on each delivery. Deliveries far from the address are flagged for review.' },
  { icon: 'wallet', title: 'Every euro reconciled', body: 'Cash on delivery tracked per driver, checked in with a 6-digit code, paid out to merchants weekly with invoices.', wide: true },
  { icon: 'warehouse', title: 'Warehouse & fulfilment', body: 'Receive merchant stock, reserve it per order, pick and pack by route, restock returns.' },
  { icon: 'store', title: 'A portal for every shop', body: 'Merchants create orders, import CSVs, connect by API, and follow balances and payouts.' }
];
const STEPS = [
  ['01', 'Orders come in', 'From the merchant portal, CSV, API or the front desk. Zone, price and date are set instantly.'],
  ['02', 'Routes go out', 'Dispatch builds and publishes routes. Warehouse gets pick lists, drivers get their day.'],
  ['03', 'Parcels get delivered', 'Drivers follow the route, customers follow a live tracking page.'],
  ['04', 'Money closes itself', 'Cash is checked in, merchants are paid, invoices are issued — automatically.']
];
const PLANS = [
  { name: 'Starter', price: '€49', note: 'Up to 5 drivers · 1 warehouse', items: ['Dispatch & driver app', 'Proof of delivery', 'Cash on delivery tracking', 'Merchant portal'] },
  { name: 'Growth', price: '€149', note: 'Up to 20 drivers · 3 warehouses', popular: true, items: ['Everything in Starter', 'Warehouse & fulfilment', 'Payouts, invoices & payroll', 'API & webhooks for shops', 'Customer SMS'] },
  { name: 'Enterprise', price: 'Custom', note: 'Unlimited drivers & hubs', items: ['Dedicated onboarding', 'Custom integrations', 'Priority support', 'Multi-country fleets'] }
];
const FAQ = [
  ['Do my drivers need new phones?', 'No. The driver app runs on any recent Android or iPhone.'],
  ['Can my merchants send orders automatically?', 'Yes — by CSV import, by API with their own key, or from the merchant portal. Webhooks tell their shop when a parcel is delivered.'],
  ['How does cash on delivery work?', 'Drivers record the cash at every drop. At the end of the shift the office types their 6-digit code, counts the cash and confirms. Merchant balances update by themselves.'],
  ['Is it available in Albanian?', 'Yes. Customer messages and the driver app are in Shqip, the office can work in Shqip or English.']
];

function ProductShot() {
  const routes = [['#5B5CF6', 'PR-01', 'Driton H.', 11, 14], ['#0F9F5F', 'PR-02', 'Blerim K.', 9, 18], ['#D9740B', 'PR-03', 'Fatlind M.', 12, 12], ['#1D72D8', 'PR-04', 'Arta S.', 6, 16]] as const;
  return (
    <div className="relative">
      <div className="absolute -inset-8 rounded-[40px] bg-[radial-gradient(closest-side,rgb(91_92_246/0.45),transparent)] blur-2xl" />
      <div className="relative rounded-[26px] border border-white/15 bg-white/[.07] p-3 shadow-2xl backdrop-blur-xl">
        <div className="rounded-[18px] border border-white/10 bg-[#0F1428]/90 p-5">
          <div className="mb-4 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-white/20" /><span className="h-2.5 w-2.5 rounded-full bg-white/20" /><span className="h-2.5 w-2.5 rounded-full bg-white/20" /><span className="ml-3 text-[12px] text-white/50">Today · Prishtinë hub</span></div>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[['Delivered', '182'], ['On the road', '41'], ['Cash in', '€9.8k']].map(([k, v]) => <div key={k} className="rounded-xl bg-white/[.06] p-3"><p className="text-[11px] text-white/50">{k}</p><p className="text-lg font-semibold text-white">{v}</p></div>)}
          </div>
          <div className="flex flex-col gap-2">
            {routes.map(([c, code, name, d, t]) => (
              <div key={code} className="flex items-center gap-3 rounded-xl bg-white/[.04] px-3 py-2.5">
                <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                <span className="w-14 font-mono text-[12px] text-white/60">{code}</span>
                <span className="flex-1 text-[13px] text-white">{name}</span>
                <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full" style={{ width: `${(d / t) * 100}%`, background: c }} /></span>
                <span className="w-10 text-right font-mono text-[12px] text-white/70">{d}/{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-white/20 bg-white/80 p-3.5 shadow-xl backdrop-blur-xl md:block">
        <p className="text-[11px] font-medium text-ink-3">Delivered · KS-20412</p>
        <p className="text-[13px] font-semibold text-ink">Signed by Liridona · 12 m from address</p>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="bg-white text-ink">
      <section className="relative overflow-hidden bg-night text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_500px_at_15%_0%,rgb(91_92_246/0.35),transparent_60%),radial-gradient(700px_500px_at_100%_20%,rgb(200_242_90/0.14),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_50%_20%,black,transparent_75%)]" />
        <nav className="relative mx-auto flex max-w-[1200px] items-center gap-8 px-6 py-5">
          <Logo light />
          <span className="hidden flex-1 gap-7 text-[14px] text-white/60 md:flex">
            <a href="#product" className="hover:text-white">Product</a><a href="#how" className="hover:text-white">How it works</a><a href="#pricing" className="hover:text-white">Pricing</a><a href="#faq" className="hover:text-white">FAQ</a>
          </span>
          <span className="ml-auto flex items-center gap-2 md:ml-0">
            <Link href="/login" className="rounded-xl px-3.5 py-2 text-[14px] font-medium text-white/80 hover:text-white">Sign in</Link>
            <Link href="/register" className="rounded-xl bg-white px-4 py-2 text-[14px] font-semibold text-night hover:bg-lime">Start free</Link>
          </span>
        </nav>
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-6 pb-28 pt-14 lg:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col gap-7">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[.06] py-1 pl-1 pr-3.5 text-[13px] text-white/70 backdrop-blur">
              <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold text-night">NEW</span>Built for couriers in Kosovo
            </span>
            <h1 className="text-[46px] font-semibold leading-[1.04] tracking-[-2px] sm:text-[64px]">The operating system for <span className="bg-gradient-to-r from-lime to-[#9EE6FF] bg-clip-text text-transparent">last-mile delivery.</span></h1>
            <p className="max-w-[520px] text-[18px] leading-8 text-white/65">Orders, routes, drivers, warehouse and cash on delivery — in one calm control room for the office, and one simple app for the road.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/register" className="rounded-2xl bg-lime px-6 py-3.5 text-[15px] font-semibold text-night shadow-[0_10px_30px_-10px_rgb(200_242_90/0.6)] hover:brightness-105">Start 14-day free trial</Link>
              <a href="#how" className="rounded-2xl border border-white/15 bg-white/[.06] px-6 py-3.5 text-[15px] font-medium backdrop-blur hover:bg-white/10">See how it works</a>
            </div>
            <span className="text-[13px] text-white/45">No credit card · Shqip & English · Data hosted in the EU</span>
          </div>
          <ProductShot />
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-7 text-[14px] text-ink-3">
          <span className="font-medium text-ink">Made for</span><span>Courier companies</span><span className="text-line">•</span><span>E-commerce warehouses</span><span className="text-line">•</span><span>Online shops</span><span className="text-line">•</span><span>Prishtinë · Prizren · Pejë · Gjakovë · Ferizaj</span>
        </div>
      </section>

      <section id="product" className="relative overflow-hidden bg-[#F4F5FA]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_400px_at_90%_10%,rgb(200_242_90/0.25),transparent_60%),radial-gradient(700px_500px_at_0%_80%,rgb(91_92_246/0.15),transparent_60%)]" />
        <div className="relative mx-auto flex max-w-[1200px] flex-col gap-12 px-6 py-24">
          <div className="flex max-w-[640px] flex-col gap-4">
            <span className="eyebrow text-brand">Platform</span>
            <h2 className="text-[40px] font-semibold leading-[1.1] tracking-[-1.4px]">Everything a delivery company runs on.</h2>
            <p className="text-[17px] leading-7 text-ink-2">Replace WhatsApp groups, spreadsheets and paper receipts with one connected system — the office, the warehouse and every driver on the same page.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className={`card flex flex-col gap-4 p-7 ${f.wide ? 'md:col-span-2' : ''}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-lime"><Icon name={f.icon} size={20} color="currentColor" /></span>
                <h3 className="text-[18px] font-semibold tracking-[-0.3px]">{f.title}</h3>
                <p className="max-w-[520px] text-[15px] leading-7 text-ink-2">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 py-24">
          <div className="flex flex-col gap-4"><span className="eyebrow text-brand">How it works</span><h2 className="text-[40px] font-semibold tracking-[-1.4px]">From order to cash, without the chaos.</h2></div>
          <ol className="grid gap-8 md:grid-cols-4">
            {STEPS.map(([n, t, b]) => (
              <li key={n} className="relative flex flex-col gap-3 border-t-2 border-ink pt-5">
                <span className="font-mono text-[13px] text-ink-3">{n}</span>
                <h3 className="text-[18px] font-semibold">{t}</h3>
                <p className="text-[15px] leading-7 text-ink-2">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" className="bg-[#F4F5FA]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 py-24">
          <div className="flex flex-col items-center gap-4 text-center"><span className="eyebrow text-brand">Pricing</span><h2 className="text-[40px] font-semibold tracking-[-1.4px]">Simple pricing that grows with your fleet.</h2><p className="text-[16px] text-ink-2">Unlimited orders on every plan. Cancel anytime.</p></div>
          <div className="grid gap-4 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.name} className={`flex flex-col gap-6 rounded-3xl p-8 ${p.popular ? 'bg-night text-white shadow-2xl' : 'card'}`}>
                <div className="flex items-center justify-between"><span className="text-[16px] font-semibold">{p.name}</span>{p.popular && <span className="rounded-full bg-lime px-2.5 py-0.5 text-[12px] font-bold text-night">Most popular</span>}</div>
                <div><span className="text-[44px] font-semibold tracking-[-1.5px]">{p.price}</span>{p.price.startsWith('€') && <span className={p.popular ? 'text-white/50' : 'text-ink-3'}> / month</span>}<p className={`mt-1 text-[14px] ${p.popular ? 'text-white/60' : 'text-ink-3'}`}>{p.note}</p></div>
                <Link href="/register" className={`rounded-2xl py-3.5 text-center text-[15px] font-semibold ${p.popular ? 'bg-lime text-night' : 'bg-ink text-white'}`}>{p.price === 'Custom' ? 'Talk to us' : 'Start free trial'}</Link>
                <ul className="flex flex-col gap-3 text-[14px]">{p.items.map((i) => <li key={i} className="flex gap-2.5"><Icon name="check" size={17} color={p.popular ? '#C8F25A' : '#0F9F5F'} strokeWidth={2.2} />{i}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-24 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-4"><span className="eyebrow text-brand">FAQ</span><h2 className="text-[40px] font-semibold tracking-[-1.4px]">Questions couriers ask us.</h2></div>
          <div className="flex flex-col divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium">{q}<Icon name="plus" size={18} color="#6B7389" className="transition-transform group-open:rotate-45" /></summary>
                <p className="mt-3 text-[15px] leading-7 text-ink-2">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-start gap-6 overflow-hidden rounded-[32px] bg-night px-10 py-16 text-white md:flex-row md:items-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_90%_50%,rgb(200_242_90/0.2),transparent_60%)]" />
          <div className="relative flex flex-1 flex-col gap-3"><h2 className="text-[34px] font-semibold tracking-[-1px]">Run tomorrow’s routes on Routa.</h2><p className="text-[16px] text-white/60">We set up your zones, drivers and merchants with you during onboarding.</p></div>
          <div className="relative flex gap-3"><Link href="/register" className="rounded-2xl bg-lime px-6 py-3.5 font-semibold text-night">Start free trial</Link><Link href="/login" className="rounded-2xl border border-white/15 px-6 py-3.5 font-medium">Sign in</Link></div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-10 text-[13px] text-ink-3">
          <span className="flex items-center gap-3"><Logo dark /><span>The operating system for last-mile delivery. Made in Prishtinë.</span></span>
          <span>© 2026 Routa · Shqip · English</span>
        </div>
      </footer>
    </div>
  );
}
