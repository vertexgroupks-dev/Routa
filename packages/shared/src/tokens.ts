// Routa design tokens — single source of truth for the web app (Tailwind) and the driver app (React Native).
export const colors = {
  brand: '#5B5CF6',
  brandHover: '#4A49E3',
  brandDeep: '#3B38BF',
  brandTint: '#EEF0FF',
  brandSoft: '#DFE2FF',
  night: '#0B0F1E',
  night2: '#141A2E',
  night3: '#1C2340',
  nightLine: '#232A42',
  lime: '#C8F25A',
  ink: '#0E1325',
  ink2: '#5B6378',
  ink3: '#6B7389',
  muted: '#9AA3BC',
  line: '#E4E7EF',
  surface: '#FFFFFF',
  canvas: '#F5F6FA',
  field: '#F0F2F7',
  success: '#0F9F5F',
  successInk: '#067647',
  successTint: '#E8F8EF',
  warning: '#D9740B',
  warningInk: '#B54708',
  warningTint: '#FFF4E5',
  danger: '#D92D2D',
  dangerInk: '#B42318',
  dangerTint: '#FDECEC',
  info: '#1D72D8',
  infoInk: '#175CD3',
  infoTint: '#E9F3FF'
} as const;

export const radius = { sm: 6, md: 8, lg: 10, xl: 14, xxl: 16, pill: 999 } as const;
export const fonts = { sans: 'Geist', mono: 'Geist Mono' } as const;
export type ColorToken = keyof typeof colors;
