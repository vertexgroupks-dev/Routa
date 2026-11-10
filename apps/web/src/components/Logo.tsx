import Link from 'next/link';

export function LogoMark({ dark = false, size = 28 }: { dark?: boolean; size?: number }) {
  return (
    <span className="flex items-center justify-center rounded-lg" style={{ width: size, height: size, background: dark ? '#0B0F1E' : '#C8F25A' }}>
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" stroke={dark ? '#C8F25A' : '#0B0F1E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" />
      </svg>
    </span>
  );
}

export function Logo({ href = '/', dark = false, light = false }: { href?: string; dark?: boolean; light?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 ${light ? 'text-white' : 'text-ink'}`}>
      <LogoMark dark={dark} size={30} />
      <span className="text-lg font-semibold tracking-[-0.3px]">Routa</span>
    </Link>
  );
}
