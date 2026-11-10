'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Icon } from '@/components/Icon';

export function PublishButton({ orgId, date, drafts }: { orgId: string; date: string; drafts: number }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function publish() {
    setBusy(true); setMsg(null);
    const { data, error } = await createClient().rpc('publish_routes', { p_org: orgId, p_date: date });
    setBusy(false);
    setMsg(error ? error.message : `${data} route(s) published`);
    router.refresh();
  }
  return (
    <span className="flex items-center gap-2">
      {msg && <span className="text-[13px] text-ink-2">{msg}</span>}
      <button onClick={publish} disabled={busy || drafts === 0} className="btn-dark"><Icon name="bolt" size={16} color="#C8F25A" />{busy ? 'Publishing…' : `Publish ${drafts} draft route${drafts === 1 ? '' : 's'}`}</button>
    </span>
  );
}
