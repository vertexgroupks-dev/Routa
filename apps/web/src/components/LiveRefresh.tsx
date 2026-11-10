'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

const TABLES = ['orders', 'routes', 'route_stops', 'tickets', 'pods', 'cash_handovers', 'notifications'];

/** Re-renders the current page whenever relevant rows change (Supabase Realtime), plus a 30 s safety refresh. */
export function LiveRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const supabase = createClient();
    const bump = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => router.refresh(), 600); };
    let ch = supabase.channel(`live-${Math.random().toString(36).slice(2)}`);
    TABLES.forEach((t) => { ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, bump); });
    ch.subscribe();
    const iv = setInterval(() => router.refresh(), 30_000);
    return () => { supabase.removeChannel(ch); clearInterval(iv); };
  }, [router]);
  return null;
}
