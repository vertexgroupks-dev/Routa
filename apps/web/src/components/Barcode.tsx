import { barcodeSvg } from '@/lib/code128';

export function Barcode({ value, height = 56, className }: { value: string; height?: number; className?: string }) {
  const b = barcodeSvg(value, height);
  return (
    <svg viewBox={`0 0 ${b.width} ${height}`} preserveAspectRatio="none" className={className} role="img" aria-label={`Barcode ${value}`}>
      <rect width={b.width} height={height} fill="#fff" />
      {b.rects.map((r, i) => <rect key={i} x={r.x} y={0} width={r.w} height={height} fill="#000" />)}
    </svg>
  );
}
