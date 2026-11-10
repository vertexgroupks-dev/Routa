import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Icon, type IconName } from '@/components/Icon';

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'route', title: 'Smart dispatch & route optimisation', body: 'Orders auto-grouped by zone (Dardania, Ulpiana, Bregu i Diellit…) and solved as a vehicle-routing problem with capacity, time windows and driver shifts.' },
  { icon: 'navigation', title: 'Driver app with turn-by-turn', body: 'Drivers see stops in optimal order, open navigation in one tap, call the customer and keep working offline when signal drops.' },
  { icon: 'camera', title: 'Proof of delivery', body: 'Photo, signature and GPS + timestamp on every drop. Failed attempts require a reason and a photo of the door.' },
  { icon: 'warehouse', title: 'Warehouse & inventory', body: 'Receive merchant stock, assign bins, barcode pick & pack, print labels and restock returns automatically.' },
  { icon: 'wallet', title: 'COD & finance', body: 'Track every euro collected per driver, reconcile at end of shift, auto-generate merchant payouts and invoices.' },
  { icon: 'headset', title: 'Helpdesk & exceptions', body: 'A live queue of no-answers, wrong addresses and refusals — reschedule, call back or return to sender in seconds.' }
];
const STEPS: { n: string; icon: IconName; title: string; body: string }[] = [
  { n: '01', icon: 'upload', title: 'Import orders', body: 'CSV, Shopify, WooCommerce, API or manual entry at the front desk.' },
  { n: '02', icon: 'bolt', title: 'Plan routes', body: 'One click clusters orders and optimises routes for every driver.' },
  { n: '03', icon: 'truck', title: 'Deliver with proof', body: 'Drivers follow the route and capture photo, signature and COD.' },
  { n: '04', icon: 'banknote', title: 'Reconcile & bill', body: 'Cash checked in, merchants paid, invoices sent automatically.' }
];
const PLANS = [
  { name: 'Starter', price: '€49', unit: '/ month', note: 'Up to 5 drivers · 1 warehouse', cta: 'Start free trial', items: ['Route optimisation', 'Driver app + proof of delivery', 'COD tracking', 'Email support'] },
  { name: 'Growth', price: '€149', unit: '/ month', note: 'Up to 20 drivers · 3 warehouses', cta: 'Start free trial', popular: true, items: ['Everything in Starter', 'Warehouse & pick-pack', 'Helpdesk & SMS notifications', 'Finance, invoices & payouts', 'HR, shifts & payroll'] },
  { name: 'Enterprise', price: 'Custom', unit: '', note: 'Unlimited drivers & hubs', cta: 'Talk to sales', items: ['Dedicated success manager', 'SSO & audit logs', 'Custom integrations & API SLAs', 'Multi-country fleets'] }
];
const PREVIEW = [
  { color: '#5B5CF6', name: 'PR-01 · Driton H.', meta: '14 stops · 22.4 km', done: '11/14', pct: 79 },
  { color: '#0F9F5F', name: 'PR-02 · Blerim K.', meta: '18 stops · 31.0 km', done: '9/18', pct: 50 },
  { color: '#D9740B', name: 'PR-03 · Fatlind M.', meta: '12 stops · 26.7 km', done: '12/12', pct: 100 },
  { color: '#1D72D8', name: 'PR-04 · Arta S.', meta: '16 stops · 29.3 km', done: '6/16', pct: 38 }
];

export default function Landing() {
  return (
    <div className="bg-white">
      <section className="bg-night text-white">
        <nav className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-6 px-6 py-5">
          <Logo light />
          <span className="hidden flex-1 gap-6 text-sm text-muted md:flex">
            <a href="#product" className="hover:text-white">Product</a><a href="#how" className="hover:text-white">How it works</a><a href="#pricing" className="hover:text-white">Pricing</a>
          </span>
          <span className="ml-auto flex items-center gap-3 md:ml-0">
            <Link href="/login" className="text-sm font-medium text-white">Sign in</Link>
            <Link href="/register" className="rounded-[10px] bg-lime px-4 py-2.5 text-sm font-semibold text-night">Start free trial →</Link>
          </span>
        </nav>
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-6 pb-20 pt-12">
          <div className="flex flex-[1_1_480px] flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-night-line bg-night-2 py-1 pl-1 pr-3 text-[13px] text-muted">
              <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-semibold text-night">NEW</span>AI route optimisation for Kosovo streets &amp; addresses
            </span>
            <h1 className="text-[44px] font-semibold leading-[50px] tracking-[-1.6px] sm:text-[56px] sm:leading-[60px]">Every parcel, every route, one control room.</h1>
            <p className="max-w-[560px] text-lg leading-7 text-muted">Routa plans optimised routes for your drivers, guides them door-to-door with proof of delivery, and reconciles every euro of cash-on-delivery — built for couriers and e-commerce warehouses across Kosovo.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="rounded-[10px] bg-brand px-5 py-3 text-[15px] font-medium hover:bg-brand-hover">Start 14-day free trial</Link>
              <a href="#how" className="rounded-[10px] border border-night-line px-5 py-3 text-[15px] font-medium">See how it works</a>
            </div>
            <span className="text-[13px] text-muted">No credit card · Albanian &amp; English · Hosted in the EU</span>
          </div>
          <div className="flex flex-[1_1_420px] flex-col gap-3 rounded-[20px] border border-night-line bg-night-2 p-5">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold">Today · 4 routes</span><span className="rounded-full bg-[#1F2A1A] px-2.5 py-1 text-xs font-medium text-lime">Optimised</span></div>
            {PREVIEW.map((r) => (
              <div key={r.name} className="flex flex-col gap-2 rounded-xl bg-night p-3">
                <div className="flex items-center gap-2.5 text-[13px]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} /><span className="flex-1 font-medium">{r.name}</span><span className="text-xs text-muted">{r.meta}</span><span className="font-mono text-xs">{r.done}</span></div>
                <span className="h-1.5 overflow-hidden rounded bg-night-line"><span className="block h-full rounded" style={{ width: `${r.pct}%`, background: r.color }} /></span>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Delivered', '182 / 248'], ['Km saved', '−27%'], ['COD', '€9,840']].map(([k, v]) => <span key={k} className="rounded-xl bg-night p-2.5"><span className="block text-[11px] text-muted">{k}</span><span className="text-sm font-semibold">{v}</span></span>)}
            </div>
            <span className="text-center text-[11px] text-muted">Example data from the demo workspace</span>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <p className="mx-auto max-w-[1200px] px-6 py-7 text-center text-sm text-ink-3">Built for couriers and online stores in Prishtinë, Prizren, Pejë, Gjakovë and Ferizaj</p>
      </section>

      <section id="product" className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-20">
        <div className="flex max-w-[640px] flex-col gap-3">
          <span className="font-mono text-xs font-medium tracking-[.6px] text-brand">PLATFORM</span>
          <h2 className="text-4xl font-semibold tracking-[-1.2px]">Everything a delivery company runs on.</h2>
          <p className="text-base text-ink-2">Replace WhatsApp groups, Excel sheets and paper receipts with one connected system for the office, the warehouse and the road.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card flex flex-col gap-3 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-tint"><Icon name={f.icon} color="#4A49E3" /></span>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="text-sm leading-6 text-ink-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="bg-canvas">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-20">
          <div className="flex flex-col gap-3"><span className="font-mono text-xs font-medium tracking-[.6px] text-brand">HOW IT WORKS</span><h2 className="text-4xl font-semibold tracking-[-1.2px]">From order to cash in four steps.</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="card flex flex-col gap-3 p-6">
                <span className="flex items-center justify-between"><span className="font-mono text-sm text-ink-3">{s.n}</span><Icon name={s.icon} color="#5B5CF6" /></span>
                <h3 className="text-base font-semibold">{s.title}</h3><p className="text-sm text-ink-2">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-20">
        <div className="flex flex-col items-center gap-3 text-center"><span className="font-mono text-xs font-medium tracking-[.6px] text-brand">PRICING</span><h2 className="text-4xl font-semibold tracking-[-1.2px]">Simple pricing that scales with your fleet.</h2><p className="text-ink-2">All plans include the driver app, unlimited orders and Albanian/English support.</p></div>
        <div className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`flex flex-col gap-5 rounded-2xl p-7 ${p.popular ? 'bg-night text-white' : 'card'}`}>
              <span className="flex items-center justify-between"><span className="text-base font-semibold">{p.name}</span>{p.popular && <span className="rounded-full bg-lime px-2.5 py-0.5 text-xs font-semibold text-night">Most popular</span>}</span>
              <span><span className="text-4xl font-semibold tracking-[-1px]">{p.price}</span> <span className={p.popular ? 'text-muted' : 'text-ink-3'}>{p.unit}</span></span>
              <span className={`text-sm ${p.popular ? 'text-muted' : 'text-ink-2'}`}>{p.note}</span>
              <Link href="/register" className={`rounded-[10px] py-3 text-center text-sm font-medium ${p.popular ? 'bg-lime text-night' : 'bg-brand text-white'}`}>{p.cta}</Link>
              <ul className="flex flex-col gap-2 text-sm">{p.items.map((i) => <li key={i} className="flex gap-2"><Icon name="check" size={16} color={p.popular ? '#C8F25A' : '#0F9F5F'} />{i}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-night text-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-6 py-16">
          <div className="flex flex-col gap-2"><h2 className="text-3xl font-semibold tracking-[-1px]">Get your fleet on Routa this week.</h2><p className="text-muted">We import your orders, drivers and zones for free during onboarding.</p></div>
          <div className="flex gap-3"><Link href="/register" className="rounded-[10px] bg-lime px-5 py-3 font-semibold text-night">Start free trial</Link><Link href="/login" className="rounded-[10px] border border-night-line px-5 py-3 font-medium">Sign in</Link></div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-10 text-[13px] text-ink-3">
        <span className="flex items-center gap-3"><Logo dark /><span>Logistics operating system for couriers and e-commerce warehouses. Made in Prishtinë.</span></span>
        <span>© 2026 Routa · Shqip · English</span>
      </footer>
    </div>
  );
}
