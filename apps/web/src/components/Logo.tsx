import Link from 'next/link';

// Routa logo: the "r" is a route — hub ring at the bottom of the stem, delivery stop at the end of the arm.
const INK = '#0E1325', ROUTE = '#4A49E3', LIME = '#C8F25C';

export function LogoMark({ dark = false, size = 28 }: { dark?: boolean; size?: number }) {
  const bg = dark ? ROUTE : INK;
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" aria-hidden="true" className="flex-none">
      <rect width="1024" height="1024" rx="232" fill={bg} />
      <g transform="translate(312 214) scale(5.2)">
        <path d="M9 100 V54 C9 26 28 9 52 9" fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" />
        <circle cx="9" cy="100" r="15" fill={bg} stroke="#fff" strokeWidth="7" />
        <circle cx="78" cy="9" r="13" fill={LIME} />
      </g>
    </svg>
  );
}

/** The drawn "routa" letters (no font needed). */
export function Wordmark({ color = INK, dot = ROUTE, height = 22 }: { color?: string; dot?: string; height?: number }) {
  const letters: { d: string[]; extra?: boolean; adv: number }[] = [
    { d: ['M9 100 V54 C9 26 28 9 52 9'], extra: true, adv: 86 },
    { d: ['M50 9 A41 41 0 1 1 49.99 9 Z'], adv: 100 },
    { d: ['M9 9 V50 A41 41 0 0 0 91 50 V9', 'M91 50 V91'], adv: 100 },
    { d: ['M30 -36 V66 C30 82 38 91 56 91', 'M9 9 H60'], adv: 70 },
    { d: ['M50 9 A41 41 0 1 1 49.99 9 Z', 'M91 9 V91'], adv: 100 }
  ];
  let x = 0;
  const groups = letters.map((l, i) => {
    const g = (
      <g key={i} transform={`translate(${x} 0)`}>
        <g fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">{l.d.map((d) => <path key={d} d={d} />)}</g>
        {l.extra && <circle cx="74" cy="9" r="11.5" fill={dot} />}
      </g>
    );
    x += l.adv + 17;
    return g;
  });
  const w = x - 17;
  return (
    <svg height={height} viewBox={`-2 -47 ${w + 4} 149`} aria-label="Routa" role="img" style={{ width: 'auto' }}>
      {groups}
    </svg>
  );
}

export function Logo({ href = '/', dark = false, light = false, size = 30 }: { href?: string; dark?: boolean; light?: boolean; size?: number }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="Routa home">
      <LogoMark dark={dark} size={size} />
      <Wordmark color={light ? '#fff' : INK} dot={light ? LIME : ROUTE} height={size * 0.78} />
    </Link>
  );
}
