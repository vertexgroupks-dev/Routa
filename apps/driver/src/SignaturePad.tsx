// Customer signs with a finger. The drawing is kept as SVG paths (small, sharp at any size).
import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from './theme';

export function SignaturePad({ onChange }: { onChange: (svg: string | null) => void }) {
  const [paths, setPaths] = useState<string[]>([]);
  const current = useRef('');
  const [live, setLive] = useState('');
  const size = useRef({ w: 320, h: 160 });

  const toSvg = (all: string[]) => all.length
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(size.current.w)} ${Math.round(size.current.h)}"><g fill="none" stroke="#0E1325" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${all.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`
    : null;

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false, // don't let the page scroll steal the stroke
    onPanResponderGrant: (e) => {
      const { locationX: x, locationY: y } = e.nativeEvent;
      current.current = `M${x.toFixed(1)} ${y.toFixed(1)}`;
      setLive(current.current);
    },
    onPanResponderMove: (e) => {
      const { locationX: x, locationY: y } = e.nativeEvent;
      current.current += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      setLive(current.current);
    },
    onPanResponderRelease: () => {
      const d = current.current;
      current.current = ''; setLive('');
      if (!d.includes('L')) return;
      setPaths((p) => { const next = [...p, d]; onChange(toSvg(next)); return next; });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  return (
    <View style={{ gap: 6 }}>
      <View onLayout={(e: LayoutChangeEvent) => { size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }; }}
        {...responder.panHandlers}
        style={{ height: 160, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', overflow: 'hidden' }}>
        <Svg width="100%" height="100%">
          {paths.map((d, i) => <Path key={i} d={d} stroke="#0E1325" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
          {live ? <Path d={live} stroke="#0E1325" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
        </Svg>
        {!paths.length && !live && <Text pointerEvents="none" style={{ position: 'absolute', alignSelf: 'center', top: 68, color: colors.ink3 }}>Customer signs here</Text>}
      </View>
      {paths.length > 0 && <Pressable onPress={() => { setPaths([]); onChange(null); }}><Text style={{ color: colors.brandHover, fontWeight: '500' }}>Clear signature</Text></Pressable>}
    </View>
  );
}
