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
  { label: 'Payouts', href: '/merchant/payouts', icon: 'wallet' },
  { label: 'API & webhooks', href: '/merchant/developers', icon: 'settings' }
];

export function MerchantNav({ merchantName, code, userName }: { merchantName: string; code: string; userName: string }) {
  const path = usePathname();
  return (
    <aside className="glass sticky top-3 m-3 mr-0 hidden h-[calc(100vh-24px)] w-[236px] flex-none flex-col rounded-[22px] lg:flex">
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <LogoMark dark size={30} />
        <span className="flex min-w-0 flex-1 flex-col leading-tight"><span className="truncate text-[13.5px] font-semibold">{merchantName}</span><span className="text-[11.5px] text-ink-3">Merchant portal · {code}</span></span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-2.5 pt-2">
        {ITEMS.map((it) => {
          const on = it.href === '/merchant' ? path === '/merchant' : path.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href} prefetch className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-[13.5px] ${on ? 'bg-white/90 font-medium shadow-[0_4px_14px_-8px_rgb(14_19_37/0.35)]' : 'text-ink-2 hover:bg-white/50 hover:text-ink'}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${on ? 'bg-ink text-lime' : 'bg-white/60 text-ink-3'}`}><Icon name={it.icon} size={15} color="currentColor" /></span>{it.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-2.5 flex items-center gap-2.5 rounded-2xl bg-white/50 p-2.5">
        <Avatar name={userName} size={30} />
        <span className="flex-1 truncate text-[13px] font-medium">{userName}</span>
        <form action="/auth/signout" method="post"><button aria-label="Sign out" className="flex rounded-lg p-1.5 hover:bg-white"><Icon name="logout" size={15} color="#6B7389" /></button></form>
      </div>
    </aside>
  );
}
