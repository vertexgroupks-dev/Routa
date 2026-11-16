'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Runs an async Supabase call, shows busy/error state and refreshes the page on success. */
export function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  async function run(fn: () => PromiseLike<{ error: { message: string } | null; data?: unknown }>, success?: string | ((data: any) => string)) {
    setBusy(true); setError(null); setOk(null);
    const { error, data } = await fn();
    setBusy(false);
    if (error) { setError(error.message); return null; }
    if (success) setOk(typeof success === 'function' ? success(data) : success);
    router.refresh();
    return data ?? true;
  }
  return { busy, error, ok, run, setError, setOk };
}

export function Msg({ error, ok }: { error: string | null; ok?: string | null }) {
  if (error) return <p className="rounded-[10px] bg-danger-tint px-3 py-2 text-[13px] text-danger-ink">{error}</p>;
  if (ok) return <p className="rounded-[10px] bg-success-tint px-3 py-2 text-[13px] text-success-ink">{ok}</p>;
  return null;
}
