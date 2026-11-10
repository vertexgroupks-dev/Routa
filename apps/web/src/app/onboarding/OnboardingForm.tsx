'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const DEMO_ROLES = [
  { role: 'owner', label: 'Owner / admin', body: 'Every screen of the office dashboard.' },
  { role: 'dispatcher', label: 'Dispatcher', body: 'Orders, routes, fleet and live map.' },
  { role: 'front_desk', label: 'Front desk', body: 'Create walk-in orders and look up parcels.' },
  { role: 'finance', label: 'Finance', body: 'COD, cash check-in, payouts and invoices.' },
  { role: 'merchant', label: 'Merchant (TechNova)', body: 'The online-store portal: orders, stock, payouts.' }
];

export function OnboardingForm({ fullName }: { fullName: string }) {
  const router = useRouter();
  const [f, setF] = useState({ company: '', phone: '+383 ', hub: 'Main hub', address: '', lat: '42.6610', lng: '21.1655' });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy('create'); setError(null);
    const { error } = await createClient().rpc('create_organization', {
      p_name: f.company, p_full_name: fullName, p_phone: f.phone.replace(/\s/g, ''), p_hub_name: f.hub,
      p_hub_address: f.address, p_lat: Number(f.lat), p_lng: Number(f.lng)
    });
    if (error) { setError(error.message); setBusy(null); return; }
    router.replace('/overview'); router.refresh();
  }

  async function demo(role: string) {
    setBusy(role); setError(null);
    const { error } = await createClient().rpc('join_demo_org', { p_role: role });
    if (error) { setError(error.message); setBusy(null); return; }
    router.replace(role === 'merchant' ? '/merchant' : '/overview'); router.refresh();
  }

  return (
    <>
      <form onSubmit={create} className="card flex flex-[2_1_520px] flex-col gap-5 p-7">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-medium tracking-[.6px] text-brand">STEP 2 OF 2 · YOUR COMPANY</span>
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.8px]">Set up your courier company</h1>
          <p className="text-sm text-ink-2">Hi {fullName.split(' ')[0]} — this creates your workspace, your first hub and the default SMS templates. You can add zones, drivers and merchants next.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label sm:col-span-2">Company name<input className="input" required value={f.company} onChange={set('company')} placeholder="Prishtina Express" /></label>
          <label className="label">Your phone<input className="input" value={f.phone} onChange={set('phone')} /></label>
          <label className="label">Hub name<input className="input" required value={f.hub} onChange={set('hub')} /></label>
          <label className="label sm:col-span-2">Hub address<input className="input" required value={f.address} onChange={set('address')} placeholder="Rr. Bajram Kelmendi 120, Prishtinë" /></label>
          <label className="label">Hub latitude<input className="input font-mono" value={f.lat} onChange={set('lat')} /></label>
          <label className="label">Hub longitude<input className="input font-mono" value={f.lng} onChange={set('lng')} /></label>
        </div>
        <p className="text-xs text-ink-3">The map picker arrives with the Mapbox integration in Stage 3 — for now the default point is central Prishtinë.</p>
        {error && <p className="rounded-[10px] bg-danger-tint px-3 py-2 text-[13px] text-danger-ink">{error}</p>}
        <button disabled={!!busy} className="btn-primary self-start px-5 py-3">{busy === 'create' ? 'Creating…' : 'Create company'}</button>
      </form>

      <aside className="flex flex-[1_1_300px] flex-col gap-3 rounded-2xl bg-night p-6 text-white">
        <span className="font-mono text-xs font-medium tracking-[.6px] text-lime">OR EXPLORE THE DEMO</span>
        <h2 className="text-lg font-semibold">Join “Prishtina Express”</h2>
        <p className="text-[13px] text-muted">A demo courier with 170 orders, 5 live routes and 7 merchants. Pick the role you want to test.</p>
        {DEMO_ROLES.map((r) => (
          <button key={r.role} type="button" disabled={!!busy} onClick={() => demo(r.role)} className="flex flex-col items-start gap-0.5 rounded-xl border border-night-line bg-night-2 px-3.5 py-3 text-left transition-colors hover:border-brand disabled:opacity-60">
            <span className="text-sm font-medium">{busy === r.role ? 'Joining…' : r.label}</span>
            <span className="text-xs text-muted">{r.body}</span>
          </button>
        ))}
        <p className="text-xs text-muted">Testing the driver app? Sign in on the phone and choose “Demo driver”.</p>
      </aside>
    </>
  );
}
