'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from './Icon';
import { findNav } from './nav';

export function Topbar({ liveDrivers, unread = 0 }: { liveDrivers: number; unread?: number }) {
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState('');
  const nav = findNav(path);
  const page = path.startsWith('/dispatch/') ? 'Route' : nav?.item.label ?? '';
  return (
    <header className="glass sticky top-3 z-20 mx-3 flex h-14 items-center gap-3 rounded-[18px] px-4">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-2 text-[13px]">
        <span className="text-ink-3">{nav?.section ?? 'Routa'}</span>
        <Icon name="chevronRight" size={13} color="#9AA3BC" />
        <span className="truncate font-medium">{page}</span>
      </nav>
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/orders?q=${encodeURIComponent(q.trim())}`); }}
        className="hidden w-[300px] items-center gap-2 rounded-xl border border-white/80 bg-white/60 px-3 py-[7px] md:flex">
        <Icon name="search" size={15} color="#6B7389" />
        <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search orders, customers, phones" aria-label="Search" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted" />
      </form>
      {liveDrivers > 0 && (
        <span className="hidden items-center gap-1.5 rounded-full bg-success-tint/80 px-2.5 py-1 text-xs font-medium text-success-ink sm:inline-flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />{liveDrivers} live
        </span>
      )}
      <Link href="/notifications" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/60 hover:bg-white">
        <Icon name="bell" size={16} color="#4B5468" />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">{unread > 9 ? '9+' : unread}</span>}
      </Link>
      <Link href="/orders/new" className="btn-primary"><Icon name="plus" size={15} color="#fff" strokeWidth={2.2} />New order</Link>
    </header>
  );
}
