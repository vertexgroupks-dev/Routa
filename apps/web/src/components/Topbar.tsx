'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from './Icon';
import { findNav } from './nav';

export function Topbar({ liveDrivers }: { liveDrivers: number }) {
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState('');
  const nav = findNav(path);
  const page = path === '/orders/new' ? 'New order' : nav?.item.label ?? '';
  return (
    <header className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center gap-3 border-b border-line bg-white px-7 py-3">
      <nav aria-label="Breadcrumb" className="flex min-w-[200px] flex-1 items-center gap-2 text-sm">
        <span className="text-ink-3">{nav?.section ?? 'Routa'}</span>
        <Icon name="chevronRight" size={14} color="#6B7389" />
        <span className="font-medium">{page}</span>
      </nav>
      <form
        onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/orders?q=${encodeURIComponent(q.trim())}`); }}
        className="flex min-w-[200px] max-w-[340px] flex-1 items-center gap-2 rounded-[10px] bg-field px-3 py-2"
      >
        <Icon name="search" size={16} color="#6B7389" />
        <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search orders, customers, phones…" aria-label="Search" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" />
        <span className="rounded-[5px] border border-line bg-white px-1.5 py-px text-xs font-medium text-ink-3">⏎</span>
      </form>
      {liveDrivers > 0 && (
        <Link href="/live-map" className="inline-flex items-center gap-1.5 rounded-full bg-success-tint px-2.5 py-1.5 text-xs font-medium text-success-ink">
          <span className="h-[7px] w-[7px] rounded-full bg-success" />{liveDrivers} drivers live
        </Link>
      )}
      <Link href="/helpdesk" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-white">
        <Icon name="bell" color="#5B6378" />
      </Link>
      <Link href="/orders/new" className="btn-primary"><Icon name="plus" size={16} color="#fff" strokeWidth={2} />New order</Link>
    </header>
  );
}
