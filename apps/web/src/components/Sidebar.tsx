'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLE_LABEL } from '@routa/shared';
import { Icon } from './Icon';
import { LogoMark } from './Logo';
import { Avatar } from './ui';
import { NAV, type NavItem } from './nav';

type Props = { orgName: string; hubLabel: string; userName: string; role: string; counts: Record<string, number>; isDemo: boolean };

export function Sidebar({ orgName, hubLabel, userName, role, counts, isDemo }: Props) {
  const path = usePathname();
  const isActive = (it: NavItem) => path === it.href || path.startsWith(it.href + '/');
  const activeGroup = NAV.find((g) => g.items.some(isActive))?.key ?? 'today';
  const [open, setOpen] = useState<Record<string, boolean>>({ today: true });
  useEffect(() => {
    let saved: Record<string, boolean> = {};
    try { saved = JSON.parse(localStorage.getItem('routa.nav') ?? '{}'); } catch {}
    setOpen({ today: true, ...saved, [activeGroup]: true });
  }, [activeGroup]);
  const toggle = (k: string) => setOpen((o) => { const n = { ...o, [k]: !o[k] }; try { localStorage.setItem('routa.nav', JSON.stringify(n)); } catch {} return n; });

  return (
    <aside className="glass sticky top-3 m-3 mr-0 hidden h-[calc(100vh-24px)] w-[248px] flex-none flex-col rounded-[22px] lg:flex">
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <LogoMark dark size={30} />
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[13.5px] font-semibold">{orgName}</span>
          <span className="truncate text-[11.5px] text-ink-3">{hubLabel}{isDemo ? ' · demo' : ''}</span>
        </span>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 pb-2">
        {NAV.map((g) => {
          const isOpen = !!open[g.key];
          const groupCount = g.items.reduce((s, it) => s + (it.countKey ? counts[it.countKey] ?? 0 : 0), 0);
          return (
            <div key={g.key} className="flex flex-col">
              <button type="button" onClick={() => toggle(g.key)} aria-expanded={isOpen}
                className="group flex items-center gap-2 rounded-lg px-2.5 pb-1.5 pt-3 text-left">
                <span className="eyebrow flex-1 group-hover:text-ink-2">{g.label}</span>
                {!isOpen && groupCount > 0 && <span className="rounded-full bg-brand/10 px-1.5 text-[10.5px] font-semibold text-brand-deep">{groupCount}</span>}
                <Icon name="chevronDown" size={14} color="#9AA3BC" className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
              </button>
              {isOpen && g.items.map((it) => {
                const on = isActive(it);
                const count = it.countKey ? counts[it.countKey] ?? 0 : 0;
                return (
                  <Link key={it.href} href={it.href} prefetch
                    className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-[13.5px] transition-colors ${on ? 'bg-white/90 font-medium text-ink shadow-[0_4px_14px_-8px_rgb(14_19_37/0.35)]' : 'text-ink-2 hover:bg-white/50 hover:text-ink'}`}>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${on ? 'bg-ink text-lime' : 'bg-white/60 text-ink-3 group-hover:text-ink'}`}>
                      <Icon name={it.icon} size={15} color="currentColor" />
                    </span>
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.stage && <span className="text-[10px] text-muted">soon</span>}
                    {count > 0 && <span className={`rounded-full px-1.5 text-[11px] font-semibold ${on ? 'bg-ink text-white' : 'bg-ink/[.06] text-ink-2'}`}>{count}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="m-2.5 flex items-center gap-2.5 rounded-2xl bg-white/50 p-2.5">
        <Avatar name={userName} size={30} />
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[13px] font-medium">{userName}</span>
          <span className="text-[11.5px] text-ink-3">{ROLE_LABEL[role] ?? role}</span>
        </span>
        <form action="/auth/signout" method="post"><button aria-label="Sign out" title="Sign out" className="flex rounded-lg p-1.5 hover:bg-white"><Icon name="logout" size={15} color="#6B7389" /></button></form>
      </div>
    </aside>
  );
}
