import type { IconName } from './Icon';

export type NavItem = { label: string; href: string; icon: IconName; countKey?: string; stage?: string };
export const NAV: { label: string; items: NavItem[] }[] = [
  { label: 'OPERATIONS', items: [
    { label: 'Overview', href: '/overview', icon: 'dashboard' },
    { label: 'Orders', href: '/orders', icon: 'package', countKey: 'orders' },
    { label: 'Dispatch & Routes', href: '/dispatch', icon: 'route' },
    { label: 'Live Map', href: '/live-map', icon: 'map', stage: 'Stage 6 · Live ops' },
    { label: 'Fleet & Drivers', href: '/fleet', icon: 'truck' }
  ] },
  { label: 'WAREHOUSE', items: [
    { label: 'Inventory', href: '/inventory', icon: 'warehouse' },
    { label: 'Inbound', href: '/inbound', icon: 'download', countKey: 'inbound' },
    { label: 'Pick & Pack', href: '/pick-pack', icon: 'scan' },
    { label: 'Returns', href: '/returns', icon: 'undo', countKey: 'returns' }
  ] },
  { label: 'SUPPORT', items: [
    { label: 'Helpdesk', href: '/helpdesk', icon: 'headset', countKey: 'tickets' },
    { label: 'Proof of Delivery', href: '/pod', icon: 'camera' }
  ] },
  { label: 'BUSINESS', items: [
    { label: 'Finance & COD', href: '/finance', icon: 'wallet' },
    { label: 'Cash Check-in', href: '/cash-check-in', icon: 'banknote', countKey: 'cash' },
    { label: 'Merchants', href: '/merchants', icon: 'store' },
    { label: 'HR & Payroll', href: '/hr', icon: 'users' },
    { label: 'Analytics', href: '/analytics', icon: 'chart' }
  ] }
];
export const NAV_FOOTER: NavItem[] = [
  { label: 'Team & roles', href: '/team', icon: 'team' },
  { label: 'Settings', href: '/settings', icon: 'settings' }
];

export function findNav(path: string): { section: string; item: NavItem } | null {
  for (const g of NAV) for (const it of g.items) if (path === it.href || path.startsWith(it.href + '/')) return { section: g.label[0] + g.label.slice(1).toLowerCase(), item: it };
  for (const it of NAV_FOOTER) if (path.startsWith(it.href)) return { section: 'Workspace', item: it };
  return null;
}
