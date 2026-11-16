'use client';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas p-6">
      <Logo dark />
      <form className="card flex w-full max-w-[400px] flex-col gap-4 p-7" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset` });
        setBusy(false);
        setMsg(error ? { ok: false, text: error.message } : { ok: true, text: `If ${email} has an account, a reset link is on its way.` });
      }}>
        <h1 className="text-xl font-semibold">Reset your password</h1>
        <label className="label">Email<input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {msg && <p className={`rounded-[10px] px-3 py-2 text-[13px] ${msg.ok ? 'bg-success-tint text-success-ink' : 'bg-danger-tint text-danger-ink'}`}>{msg.text}</p>}
        <button disabled={busy} className="btn-primary py-3">{busy ? 'Sending…' : 'Send reset link'}</button>
        <Link href="/login" className="link text-center text-[13px]">Back to sign in</Link>
      </form>
    </main>
  );
}
