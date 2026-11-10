'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ResolveButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} className="btn-primary" onClick={async () => {
      setBusy(true);
      const { error } = await createClient().from('tickets').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id);
      setBusy(false);
      if (error) alert(error.message); else router.refresh();
    }}>{busy ? '…' : 'Resolve'}</button>
  );
}
