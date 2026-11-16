'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AcceptButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <button disabled={busy} className="btn-primary py-3" onClick={async () => {
        setBusy(true); setError(null);
        const { error } = await createClient().rpc('accept_invitation', { p_token: token });
        setBusy(false);
        if (error) setError(error.message); else { router.replace('/onboarding'); router.refresh(); }
      }}>{busy ? 'Joining…' : 'Accept invitation'}</button>
      {error && <p className="rounded-[10px] bg-danger-tint px-3 py-2 text-[13px] text-danger-ink">{error}</p>}
    </div>
  );
}
