import { Platform, StyleSheet } from 'react-native';
import { colors } from '@routa/shared';

export { colors };
export const mono = Platform.select({ ios: 'Menlo', default: 'monospace' });
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16 },
  h1: { fontSize: 26, fontWeight: '600', letterSpacing: -0.6, color: colors.ink },
  h2: { fontSize: 17, fontWeight: '600', color: colors.ink },
  body: { fontSize: 15, color: colors.ink2 },
  small: { fontSize: 13, color: colors.ink3 },
  mono: { fontFamily: mono },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: colors.ink, backgroundColor: colors.surface },
  btn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnGhost: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  btnGhostText: { color: colors.ink, fontSize: 16, fontWeight: '500' },
  error: { backgroundColor: colors.dangerTint, color: colors.dangerInk, padding: 12, borderRadius: 12, fontSize: 14, overflow: 'hidden' }
});
