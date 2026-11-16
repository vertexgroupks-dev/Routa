'use client';
import { createClient } from '@/lib/supabase/client';
import { useAction } from '@/components/useAction';

export function MarkAllRead({ userId }: { userId: string }) {
  const a = useAction();
  return <button disabled={a.busy} className="btn-ghost" onClick={() => a.run(() => createClient().from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null))}>Mark all as read</button>;
}
