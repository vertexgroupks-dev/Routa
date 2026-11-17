// Which office roles may open which pages. One place to change permissions.
// The database enforces the same rules on the data itself (row-level security), this controls the screens.
export const PAGE_ROLES: Record<string, string[]> = {
  '/overview':      ['owner', 'admin', 'dispatcher'],
  '/orders':        ['owner', 'admin', 'dispatcher', 'front_desk', 'helpdesk', 'warehouse', 'finance'],
  '/orders/new':    ['owner', 'admin', 'dispatcher', 'front_desk', 'helpdesk'],
  '/dispatch':      ['owner', 'admin', 'dispatcher'],
  '/live-map':      ['owner', 'admin', 'dispatcher', 'helpdesk'],
  '/helpdesk':      ['owner', 'admin', 'dispatcher', 'helpdesk'],
  '/pod':           ['owner', 'admin', 'dispatcher', 'helpdesk'],
  '/inbound':       ['owner', 'admin', 'warehouse'],
  '/inventory':     ['owner', 'admin', 'warehouse'],
  '/pick-pack':     ['owner', 'admin', 'dispatcher', 'warehouse'],
  '/returns':       ['owner', 'admin', 'dispatcher', 'warehouse', 'helpdesk'],
  '/cash-check-in': ['owner', 'admin', 'finance'],
  '/finance':       ['owner', 'admin', 'finance'],
  '/merchants':     ['owner', 'admin', 'finance'],
  '/fleet':         ['owner', 'admin', 'dispatcher', 'hr'],
  '/hr':            ['owner', 'admin', 'hr', 'finance'],
  '/team':          ['owner', 'admin', 'hr'],
  '/analytics':     ['owner', 'admin', 'finance'],
  '/settings':      ['owner', 'admin'],
  '/notifications': ['owner', 'admin', 'dispatcher', 'front_desk', 'warehouse', 'helpdesk', 'finance', 'hr']
};

// Where each role lands after signing in (its most important page).
export const ROLE_HOME: Record<string, string> = {
  owner: '/overview', admin: '/overview', dispatcher: '/overview', front_desk: '/orders',
  warehouse: '/pick-pack', helpdesk: '/helpdesk', finance: '/finance', hr: '/hr'
};

/** Most specific matching rule wins (/orders/new before /orders). */
export function canSee(role: string | null | undefined, href: string): boolean {
  if (!role) return false;
  const key = Object.keys(PAGE_ROLES).filter((k) => href === k || href.startsWith(k + '/')).sort((a, b) => b.length - a.length)[0];
  return key ? PAGE_ROLES[key]!.includes(role) : false;
}

export const homeForRole = (role: string | null | undefined) => (role && ROLE_HOME[role]) || '/notifications';
