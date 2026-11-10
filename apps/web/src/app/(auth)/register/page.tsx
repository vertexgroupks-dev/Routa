'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';
import { AuthAside } from '../AuthAside';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` }
    });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    if (data.session) { router.replace('/onboarding'); router.refresh(); return; }
    setMsg({ ok: true, text: `We sent a confirmation link to ${form.email}. Open it to continue setting up your company.` });
  }

  return (
    <div className="flex min-h-screen flex-wrap bg-white">
      <main className="flex flex-[1_1_480px] flex-col px-6 py-8 sm:px-12">
        <Logo dark />
        <div className="flex flex-1 items-center justify-center py-12">
          <form onSubmit={submit} className="flex w-full max-w-[380px] flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs font-medium tracking-[.6px] text-brand">STEP 1 OF 2 · YOUR ACCOUNT</span>
              <h1 className="text-[32px] font-semibold leading-[38px] tracking-[-1px]">Create your company account</h1>
              <p className="text-sm text-ink-2">14-day free trial · no credit card. Next you’ll set up your company and first hub.</p>
            </div>
            <label className="label">Full name<input className="input" required value={form.fullName} onChange={set('fullName')} placeholder="Arben Krasniqi" /></label>
            <label className="label">Work email<input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="you@company.com" /></label>
            <label className="label">Password<input className="input" type="password" minLength={8} required value={form.password} onChange={set('password')} placeholder="At least 8 characters" /></label>
            {msg && <p className={`rounded-[10px] px-3 py-2 text-[13px] ${msg.ok ? 'bg-success-tint text-success-ink' : 'bg-danger-tint text-danger-ink'}`}>{msg.text}</p>}
            <button disabled={busy} className="btn-primary py-3">{busy ? 'Creating account…' : 'Continue'}</button>
            <p className="text-center text-[13px] text-ink-2">Already have an account? <Link href="/login" className="link">Sign in</Link></p>
            <p className="text-center text-xs text-ink-3">By continuing you agree to the Terms and the Data Processing Agreement.</p>
          </form>
        </div>
        <div className="flex justify-between text-xs text-ink-3"><span>© 2026 Routa</span><span>Shqip · English</span></div>
      </main>
      <AuthAside />
    </div>
  );
}
