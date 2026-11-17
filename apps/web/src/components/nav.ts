import type { IconName } from './Icon';

export type NavItem = { label: string; href: string; icon: IconName; countKey?: string; stage?: string; hint?: string };
export type NavGroup = { key: string; label: string; icon: IconName; items: NavItem[] };

// Ordered by how a day runs: plan & deliver → warehouse → money → partners → company.
export const NAV: NavGroup[] = [
  { key: 'today', label: 'Operations', icon: 'bolt', items: [
    { label: 'Overview', href: '/overview', icon: 'dashboard', hint: 'Today at a glance' },
    { label: 'Orders', href: '/orders', icon: 'package', countKey: 'orders', hint: 'Every parcel' },
    { label: 'Dispatch', href: '/dispatch', icon: 'route', hint: 'Plan and publish routes' },
    { label: 'Live map', href: '/live-map', icon: 'map', hint: 'Drivers on the road' },
    { label: 'Helpdesk', href: '/helpdesk', icon: 'headset', countKey: 'tickets', hint: 'Problems to solve' },
    { label: 'Proof of delivery', href: '/pod', icon: 'camera', countKey: 'pod', hint: 'Review flagged drops' }
  ] },
  { key: 'warehouse', label: 'Warehouse', icon: 'warehouse', items: [
    { label: 'Inbound', href: '/inbound', icon: 'download', countKey: 'inbound', hint: 'Stock arriving' },
    { label: 'Inventory', href: '/inventory', icon: 'warehouse', hint: 'Stock by product' },
    { label: 'Pick & pack', href: '/pick-pack', icon: 'scan', hint: 'Prepare parcels' },
    { label: 'Returns', href: '/returns', icon: 'undo', countKey: 'returns', hint: 'Parcels coming back' }
  ] },
  { key: 'money', label: 'Money', icon: 'wallet', items: [
    { label: 'Cash check-in', href: '/cash-check-in', icon: 'banknote', countKey: 'cash', hint: 'End-of-shift cash' },
    { label: 'Finance & COD', href: '/finance', icon: 'wallet', hint: 'Balances, payouts, invoices' }
  ] },
  { key: 'network', label: 'Network', icon: 'store', items: [
    { label: 'Merchants', href: '/merchants', icon: 'store', hint: 'Shops you deliver for' },
    { label: 'Fleet & drivers', href: '/fleet', icon: 'truck', hint: 'Drivers and vehicles' }
  ] },
  { key: 'company', label: 'Company', icon: 'users', items: [
    { label: 'People & payroll', href: '/hr', icon: 'users', hint: 'Staff, shifts, pay' },
    { label: 'Team & roles', href: '/team', icon: 'team', hint: 'Logins and permissions' },
    { label: 'Analytics', href: '/analytics', icon: 'chart', hint: 'Last 30 days' },
    { label: 'Settings', href: '/settings', icon: 'settings', hint: 'Zones and prices' }
  ] }
];
export const NAV_FOOTER: NavItem[] = [];
export const EXTRA: NavItem[] = [
  { label: 'Notifications', href: '/notifications', icon: 'bell' },
  { label: 'New order', href: '/orders/new', icon: 'plus' }
];

export function findNav(path: string): { section: string; item: NavItem } | null {
  for (const it of EXTRA) if (path === it.href) return { section: 'Operations', item: it };
  for (const g of NAV) for (const it of g.items) if (path === it.href || path.startsWith(it.href + '/')) return { section: g.label, item: it };
  return null;
}
