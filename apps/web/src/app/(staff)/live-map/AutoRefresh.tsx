'use client';
// Live map refreshes every 20 seconds while the tab is visible (driver positions arrive every ~30 s).
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') router.refresh(); }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
