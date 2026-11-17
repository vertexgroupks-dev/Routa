'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

const TABLES = ['orders', 'routes', 'tickets', 'cash_handovers', 'notifications'];

/** Re-renders the page when relevant rows change (Supabase Realtime). Debounced so bursts cause one refresh. */
export function LiveRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const supabase = createClient();
    const bump = () => {
      if (document.visibilityState !== 'visible') return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 1500);
    };
    let ch = supabase.channel(`live-${Math.random().toString(36).slice(2)}`);
    TABLES.forEach((t) => { ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, bump); });
    ch.subscribe();
    return () => { if (timer.current) clearTimeout(timer.current); supabase.removeChannel(ch); };
  }, [router]);
  return null;
}
