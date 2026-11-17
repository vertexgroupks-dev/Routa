import { ORDER_STATUS, initials, type OrderStatus } from '@routa/shared';
import { Icon, type IconName } from './Icon';
export { PageHeader } from './PageHeader';

export function StatusPill({ status, sq = false }: { status: OrderStatus; sq?: boolean }) {
  const s = ORDER_STATUS[status] ?? ORDER_STATUS.confirmed;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-[3px] pl-2 pr-2.5 text-[11.5px] font-medium" style={{ background: s.bg, color: s.ink }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {sq ? s.labelSq : s.label}
    </span>
  );
}

export function Pill({ children, bg, ink }: { children: React.ReactNode; bg: string; ink: string }) {
  return <span className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium" style={{ background: bg, color: ink }}>{children}</span>;
}

export function Avatar({ name, bg = '#E7E8FF', ink = '#3B38BF', size = 32 }: { name?: string | null; bg?: string; ink?: string; size?: number }) {
  return (
    <span className="flex flex-none items-center justify-center rounded-full text-[11px] font-semibold" style={{ width: size, height: size, background: bg, color: ink }}>
      {initials(name)}
    </span>
  );
}

/** One KPI. Use inside <StatStrip> for a single glass panel with dividers. */
export function StatCard({ label, value, note, icon, tint, ink, delta }: { label: string; value: string; note?: string; icon: IconName; tint: string; ink: string; delta?: { text: string; bg: string; ink: string } }) {
  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: tint }}><Icon name={icon} size={15} color={ink} /></span>
        <span className="flex-1 text-[12.5px] font-medium text-ink-3">{label}</span>
        {delta && <span className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: delta.bg, color: delta.ink }}>{delta.text}</span>}
      </div>
      <span className="text-[26px] font-semibold leading-8 tracking-[-0.8px]">{value}</span>
      {note && <span className="text-[12px] text-ink-3">{note}</span>}
    </div>
  );
}

export function StatStrip({ items }: { items: { label: string; value: string; note?: string; tone?: 'brand' | 'success' | 'warning' | 'info' }[] }) {
  const tone = { brand: '#5B5CF6', success: '#0F9F5F', warning: '#D9740B', info: '#1D72D8' };
  return (
    <section className="card grid grid-cols-2 divide-line overflow-hidden md:grid-cols-4 md:divide-x">
      {items.map((s) => (
        <div key={s.label} className="flex flex-col gap-1 px-5 py-4">
          <span className="flex items-center gap-2 text-[12px] font-medium text-ink-3"><span className="h-1.5 w-1.5 rounded-full" style={{ background: tone[s.tone ?? 'brand'] }} />{s.label}</span>
          <span className="text-[28px] font-semibold leading-9 tracking-[-1px]">{s.value}</span>
          {s.note && <span className="text-[12px] text-ink-3">{s.note}</span>}
        </div>
      ))}
    </section>
  );
}

/** Collapsible panel for secondary content (no JavaScript needed). */
export function Accordion({ title, meta, icon, defaultOpen = false, children }: { title: string; meta?: React.ReactNode; icon?: IconName; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details open={defaultOpen} className="card group overflow-hidden [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 select-none hover:bg-white/30">
        {icon && <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/70"><Icon name={icon} size={15} color="#4B5468" /></span>}
        <span className="flex-1 text-[14px] font-semibold">{title}</span>
        {meta && <span className="text-[12.5px] text-ink-3">{meta}</span>}
        <Icon name="chevronDown" size={16} color="#6B7389" className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-line">{children}</div>
    </details>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="flex items-center gap-3"><h2 className="flex-1 text-[15px] font-semibold tracking-[-0.2px]">{title}</h2>{action}</div>;
}

export function Empty({ title, body, icon = 'package', action }: { title: string; body?: string; icon?: IconName; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70"><Icon name={icon} size={20} color="#9AA3BC" /></span>
      <span className="text-[14px] font-medium">{title}</span>
      {body && <span className="max-w-sm text-[13px] text-ink-3">{body}</span>}
      {action}
    </div>
  );
}
