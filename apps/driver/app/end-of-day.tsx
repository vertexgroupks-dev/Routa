import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { euro } from '@routa/shared';
import { supabase } from '../src/supabase';
import { useTodayRoute } from '../src/useRoute';
import { colors, mono, ui } from '../src/theme';

type Result = { ok: boolean; short_code: string; token: string; expected_cash: number; delivered: number; total: number; returns: number };

export default function EndOfDay() {
  const router = useRouter();
  const { route } = useTodayRoute();
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function end() {
    if (!route) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('driver_end_shift', { p_route_id: route.id });
    setBusy(false);
    if (error) Alert.alert('Could not end shift', error.message); else setRes(data as Result);
  }

  return (
    <SafeAreaView style={[ui.screen, { backgroundColor: colors.night }]}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: colors.lime, fontSize: 15 }}>‹ Back</Text></Pressable>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '600' }}>End of day</Text>
        {!res ? (
          <>
            <Text style={{ color: colors.muted, fontSize: 15 }}>Ending the shift closes route {route?.code}, sends undelivered parcels back to the hub and gives you a code for the cash check-in at the office.</Text>
            <Pressable style={[ui.btn, { backgroundColor: colors.lime }]} disabled={busy} onPress={end}><Text style={[ui.btnText, { color: colors.night }]}>{busy ? 'Closing…' : 'End shift'}</Text></Pressable>
          </>
        ) : (
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 22, gap: 14, alignItems: 'center' }}>
            <Text style={ui.small}>Show this code at the cash desk</Text>
            <Text style={{ fontSize: 44, fontWeight: '700', letterSpacing: 8, color: colors.ink, fontFamily: mono }}>{res.short_code}</Text>
            <Text style={{ fontSize: 15, color: colors.ink2 }}>Cash to hand in</Text>
            <Text style={{ fontSize: 34, fontWeight: '700', color: colors.ink }}>{euro(res.expected_cash)}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={ui.small}>{res.delivered}/{res.total} delivered</Text>
              <Text style={ui.small}>· {res.returns} parcels back to hub</Text>
            </View>
            <Text style={[ui.small, { textAlign: 'center' }]}>The QR version of this code arrives in Stage 5. The office can type the 6 digits today.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
