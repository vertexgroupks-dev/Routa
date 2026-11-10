'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROLE_LABEL } from '@routa/shared';
import { Icon } from './Icon';
import { LogoMark } from './Logo';
import { Avatar } from './ui';
import { NAV, NAV_FOOTER, type NavItem } from './nav';

type Props = { orgName: string; hubLabel: string; userName: string; role: string; counts: Record<string, number>; isDemo: boolean };

export function Sidebar({ orgName, hubLabel, userName, role, counts, isDemo }: Props) {
  const path = usePathname();
  const isActive = (it: NavItem) => path === it.href || path.startsWith(it.href + '/');
  const item = (it: NavItem) => {
    const on = isActive(it);
    const count = it.countKey ? counts[it.countKey] : 0;
    return (
      <Link key={it.href} href={it.href} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm leading-5 transition-colors ${on ? 'bg-night-3 font-medium text-white' : 'text-muted hover:bg-night-2 hover:text-white'}`}>
        <Icon name={it.icon} color={on ? '#C8F25A' : '#9AA3BC'} />
        <span className="flex-1">{it.label}</span>
        {!!count && <span className="rounded-full bg-night-line px-[7px] py-px text-xs font-medium text-[#C9CFDF]">{count}</span>}
      </Link>
    );
  };
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col gap-1 overflow-y-auto bg-night px-3.5 pb-4 pt-5 text-white lg:flex">
      <Link href="/overview" className="flex items-center gap-2.5 px-2 pb-3"><LogoMark /><span className="text-lg font-semibold tracking-[-0.3px]">Routa</span></Link>
      <div className="flex items-center gap-2.5 rounded-[10px] border border-night-line bg-night-2 p-2.5">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-brand text-xs font-medium">{orgName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-medium leading-[18px]">{orgName}</span>
          <span className="truncate text-xs font-medium leading-4 text-muted">{hubLabel}{isDemo ? ' · demo' : ''}</span>
        </span>
        <Icon name="chevronDown" size={16} color="#9AA3BC" />
      </div>
      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {NAV.map((g) => (
          <div key={g.label} className="flex flex-col gap-0.5">
            <span className="px-2.5 pb-1.5 pt-4 font-mono text-[11px] font-medium tracking-[.6px] text-muted">{g.label}</span>
            {g.items.map(item)}
          </div>
        ))}
      </nav>
      <div className="min-h-6 flex-1" />
      {NAV_FOOTER.map(item)}
      <div className="mt-2 flex items-center gap-2.5 rounded-[10px] border border-night-line p-2.5">
        <Avatar name={userName} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-medium leading-[18px]">{userName}</span>
          <span className="text-xs font-medium leading-4 text-muted">{ROLE_LABEL[role] ?? role}</span>
        </span>
        <form action="/auth/signout" method="post"><button aria-label="Sign out" className="flex p-1"><Icon name="logout" size={16} color="#9AA3BC" /></button></form>
      </div>
    </aside>
  );
}
