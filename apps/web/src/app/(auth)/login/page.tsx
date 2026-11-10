'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';
import { AuthAside } from '../AuthAside';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(params.get('error') ? 'That sign-in link has expired. Try again.' : null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setBusy(false); return; }
    router.replace(params.get('next') || '/onboarding');
    router.refresh();
  }

  async function google() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-[380px] flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] font-semibold leading-[38px] tracking-[-1px]">Welcome back</h1>
        <p className="text-sm text-ink-2">Sign in to your company workspace.</p>
      </div>
      <button type="button" onClick={google} className="btn-ghost py-[11px]">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8.1z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.6-2.8z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z" /></svg>
        Continue with Google
      </button>
      <div className="flex items-center gap-3 text-xs text-ink-3"><span className="h-px flex-1 bg-line" />or with email<span className="h-px flex-1 bg-line" /></div>
      <label className="label">Work email
        <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
      </label>
      <label className="label">
        <span className="flex justify-between">Password <Link href="/register?reset=1" className="link">Forgot password?</Link></span>
        <input className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="rounded-[10px] bg-danger-tint px-3 py-2 text-[13px] text-danger-ink">{error}</p>}
      <button disabled={busy} className="btn-primary py-3">{busy ? 'Signing in…' : 'Sign in'}</button>
      <p className="text-center text-[13px] text-ink-2">New to Routa? <Link href="/register" className="link">Create a company account</Link></p>
      <p className="text-center text-[13px] text-ink-2">Sending parcels with a courier? Merchants sign in here too and land in their merchant portal.</p>
      <DemoAccounts onPick={(e) => { setEmail(e); setPassword('Routa2026!'); }} />
      <div className="flex items-center gap-2.5 rounded-[10px] bg-canvas p-3 text-xs leading-4 text-ink-2">
        <Icon name="truck" color="#5B6378" className="flex-none" />
        Are you a driver? Open the Routa Driver app on your phone and sign in with your phone number.
      </div>
    </form>
  );
}

// Demo shortcuts — remove before a real customer uses Routa.
const DEMO = [['owner', 'Owner'], ['dispatcher', 'Dispatcher'], ['frontdesk', 'Front desk'], ['finance', 'Finance'], ['helpdesk', 'Helpdesk'], ['warehouse', 'Warehouse'], ['merchant', 'Merchant']];
function DemoAccounts({ onPick }: { onPick: (email: string) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-dashed border-brand bg-brand-tint p-3">
      <span className="text-xs font-medium text-brand-deep">Demo accounts · password Routa2026!</span>
      <div className="flex flex-wrap gap-1.5">
        {DEMO.map(([u, l]) => (
          <button key={u} type="button" onClick={() => onPick(`${u}@routa.demo`)} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brand-deep hover:bg-brand-soft">{l}</button>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-wrap bg-white">
      <main className="flex flex-[1_1_480px] flex-col px-6 py-8 sm:px-12">
        <Logo dark />
        <div className="flex flex-1 items-center justify-center py-12"><Suspense><LoginForm /></Suspense></div>
        <div className="flex justify-between text-xs text-ink-3"><span>© 2026 Routa</span><span>Shqip · English</span></div>
      </main>
      <AuthAside />
    </div>
  );
}
