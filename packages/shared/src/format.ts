export const euro = (n: number | string | null | undefined, digits = 2) =>
  '€' + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const initials = (name?: string | null) =>
  (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '··';

export const time = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Belgrade' }) : '—';

export const dateLong = (d: Date = new Date()) =>
  d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Belgrade' });

/** Today's date in Kosovo (YYYY-MM-DD). */
export const todayKs = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Belgrade' });

export const phonePretty = (p?: string | null) => {
  if (!p) return '';
  const m = p.replace(/\s/g, '').match(/^\+?383(\d{2})(\d{3})(\d{3})$/);
  return m ? `+383 ${m[1]} ${m[2]} ${m[3]}` : p;
};
