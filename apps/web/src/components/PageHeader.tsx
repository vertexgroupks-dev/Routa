'use client';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './Icon';
import { findNav } from './nav';

/** Page title with the page's icon (taken from the navigation, so every page gets one automatically). */
export function PageHeader({ title, subtitle, children, icon }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode; icon?: IconName }) {
  const path = usePathname();
  const i = icon ?? findNav(path)?.item.icon ?? 'dashboard';
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-ink text-lime shadow-[0_8px_20px_-10px_rgb(14_19_37/0.7)]"><Icon name={i} size={20} color="currentColor" /></span>
      <div className="flex min-w-[240px] flex-1 flex-col gap-0.5">
        <h1 className="text-[22px] font-semibold leading-7 tracking-[-0.5px]">{title}</h1>
        {subtitle && <p className="text-[13.5px] text-ink-3">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
