'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/Icon';
import { LogoMark } from '@/components/Logo';
import { Avatar } from '@/components/ui';

const ITEMS: { label: string; href: string; icon: IconName }[] = [
  { label: 'Dashboard', href: '/merchant', icon: 'dashboard' },
  { label: 'Orders', href: '/merchant/orders', icon: 'package' },
  { label: 'Import CSV', href: '/merchant/import', icon: 'upload' },
  { label: 'Stock', href: '/merchant/stock', icon: 'warehouse' },
  { label: 'Payouts', href: '/merchant/payouts', icon: 'wallet' }
];

export function MerchantNav({ merchantName, code, userName }: { merchantName: string; code: string; userName: string }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-[232px] flex-none flex-col gap-1 bg-night px-3.5 pb-4 pt-5 text-white lg:flex">
      <span className="flex items-center gap-2.5 px-2 pb-3"><LogoMark /><span className="text-lg font-semibold">Routa</span><span className="rounded-md bg-night-line px-1.5 py-0.5 text-[11px] text-muted">Merchant</span></span>
      <div className="mb-3 flex items-center gap-2.5 rounded-[10px] border border-night-line bg-night-2 p-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-info text-xs font-medium">{code}</span>
        <span className="truncate text-[13px] font-medium">{merchantName}</span>
      </div>
      {ITEMS.map((it) => {
        const on = it.href === '/merchant' ? path === '/merchant' : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${on ? 'bg-night-3 font-medium' : 'text-muted hover:text-white'}`}>
            <Icon name={it.icon} color={on ? '#C8F25A' : '#9AA3BC'} />{it.label}
          </Link>
        );
      })}
      <div className="flex-1" />
      <div className="flex items-center gap-2.5 rounded-[10px] border border-night-line p-2.5">
        <Avatar name={userName} />
        <span className="flex-1 truncate text-[13px] font-medium">{userName}</span>
        <form action="/auth/signout" method="post"><button aria-label="Sign out" className="flex p-1"><Icon name="logout" size={16} color="#9AA3BC" /></button></form>
      </div>
    </aside>
  );
}
