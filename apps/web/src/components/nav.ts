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
    { label: 'Inventory', href: '/inventory', icon: 'warehouse', stage: 'Stage 7 · Warehouse' },
    { label: 'Inbound', href: '/inbound', icon: 'download', countKey: 'inbound', stage: 'Stage 7 · Warehouse' },
    { label: 'Pick & Pack', href: '/pick-pack', icon: 'scan', stage: 'Stage 7 · Warehouse' },
    { label: 'Returns', href: '/returns', icon: 'undo', countKey: 'returns', stage: 'Stage 7 · Warehouse' }
  ] },
  { label: 'SUPPORT', items: [
    { label: 'Helpdesk', href: '/helpdesk', icon: 'headset', countKey: 'tickets' },
    { label: 'Proof of Delivery', href: '/pod', icon: 'camera', stage: 'Stage 6 · Live ops' }
  ] },
  { label: 'BUSINESS', items: [
    { label: 'Finance & COD', href: '/finance', icon: 'wallet' },
    { label: 'Cash Check-in', href: '/cash-check-in', icon: 'banknote', countKey: 'cash', stage: 'Stage 7 · Money' },
    { label: 'Merchants', href: '/merchants', icon: 'store' },
    { label: 'HR & Payroll', href: '/hr', icon: 'users', stage: 'Stage 8 · People' },
    { label: 'Analytics', href: '/analytics', icon: 'chart', stage: 'Stage 8 · Reports' }
  ] }
];
export const NAV_FOOTER: NavItem[] = [
  { label: 'Team & roles', href: '/team', icon: 'team', stage: 'Stage 2 · Team' },
  { label: 'Settings', href: '/settings', icon: 'settings', stage: 'Stage 8 · Settings' }
];

export function findNav(path: string): { section: string; item: NavItem } | null {
  for (const g of NAV) for (const it of g.items) if (path === it.href || path.startsWith(it.href + '/')) return { section: g.label[0] + g.label.slice(1).toLowerCase(), item: it };
  for (const it of NAV_FOOTER) if (path.startsWith(it.href)) return { section: 'Workspace', item: it };
  return null;
}
