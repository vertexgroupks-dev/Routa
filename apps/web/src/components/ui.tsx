import { ORDER_STATUS, initials, type OrderStatus } from '@routa/shared';
import { Icon, type IconName } from './Icon';

export function StatusPill({ status, sq = false }: { status: OrderStatus; sq?: boolean }) {
  const s = ORDER_STATUS[status] ?? ORDER_STATUS.confirmed;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-[3px] pl-2 pr-2.5 text-xs font-medium" style={{ background: s.bg, color: s.ink }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {sq ? s.labelSq : s.label}
    </span>
  );
}

export function Pill({ children, bg, ink }: { children: React.ReactNode; bg: string; ink: string }) {
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: bg, color: ink }}>{children}</span>;
}

export function Avatar({ name, bg = '#DFE2FF', ink = '#3B38BF', size = 32 }: { name?: string | null; bg?: string; ink?: string; size?: number }) {
  return (
    <span className="flex flex-none items-center justify-center rounded-full text-xs font-medium" style={{ width: size, height: size, background: bg, color: ink }}>
      {initials(name)}
    </span>
  );
}

export function StatCard({ label, value, note, icon, tint, ink, delta }: { label: string; value: string; note?: string; icon: IconName; tint: string; ink: string; delta?: { text: string; bg: string; ink: string } }) {
  return (
    <div className="card flex flex-col gap-2.5 p-[18px]">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: tint }}><Icon name={icon} size={16} color={ink} /></span>
        <span className="flex-1 text-[13px] font-medium text-ink-2">{label}</span>
      </div>
      <div className="flex items-baseline gap-2.5">
        <span className="text-[28px] font-semibold leading-8 tracking-[-1px]">{value}</span>
        {delta && <span className="rounded-full px-[7px] py-0.5 text-xs font-medium" style={{ background: delta.bg, color: delta.ink }}>{delta.text}</span>}
      </div>
      {note && <span className="text-xs font-medium text-ink-3">{note}</span>}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex min-w-[280px] flex-1 flex-col gap-1">
        <h1 className="text-2xl font-semibold leading-[30px] tracking-[-0.6px]">{title}</h1>
        {subtitle && <p className="text-sm text-ink-2">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-12 text-center">
      <span className="text-sm font-medium">{title}</span>
      {body && <span className="max-w-sm text-[13px] text-ink-3">{body}</span>}
    </div>
  );
}
