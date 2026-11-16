'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

export default function Reset() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas p-6">
      <Logo dark />
      <form className="card flex w-full max-w-[400px] flex-col gap-4 p-7" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setError(null);
        const { error } = await createClient().auth.updateUser({ password: pw });
        setBusy(false);
        if (error) setError(error.message); else { router.replace('/onboarding'); router.refresh(); }
      }}>
        <h1 className="text-xl font-semibold">Choose a new password</h1>
        <label className="label">New password<input className="input" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        {error && <p className="rounded-[10px] bg-danger-tint px-3 py-2 text-[13px] text-danger-ink">{error}</p>}
        <button disabled={busy} className="btn-primary py-3">{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </main>
  );
}
