import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAILURE_REASONS, STOP_STATUS, euro, phonePretty, time, type FailureReason } from '@routa/shared';
import { supabase } from '../../src/supabase';
import { useTodayRoute } from '../../src/useRoute';
import { colors, ui } from '../../src/theme';

const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); });

async function here(): Promise<{ lat: number | null; lng: number | null }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return { lat: null, lng: null };
  const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: p.coords.latitude, lng: p.coords.longitude };
}

export default function StopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { route, reload } = useTodayRoute();
  const stop = useMemo(() => route?.stops.find((s) => s.id === id), [route, id]);
  const [mode, setMode] = useState<'view' | 'deliver' | 'fail'>('view');
  const [recipient, setRecipient] = useState<'customer' | 'family' | 'neighbour' | 'reception'>('customer');
  const [recipientName, setRecipientName] = useState('');
  const [cash, setCash] = useState('');
  const [reason, setReason] = useState<FailureReason>('no_answer');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  // One client id per attempt so a retry after bad signal never creates a duplicate.
  const [clientId] = useState(uuid);

  if (!route || !stop) return <SafeAreaView style={[ui.screen, { padding: 24 }]}><Text style={ui.body}>Loading stop…</Text></SafeAreaView>;
  const o = stop.order;
  const d = (o.address_details ?? {}) as Record<string, unknown>;
  const cod = Number(o.cod_amount || 0);
  const open = ['loaded', 'arrived'].includes(stop.status);

  function navigate() {
    const dest = o.lat != null ? `${o.lat},${o.lng}` : encodeURIComponent(`${o.address_line}, ${o.city ?? 'Prishtinë'}`);
    const url = Platform.OS === 'ios' ? `maps://?daddr=${dest}` : `google.navigation:q=${dest}`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}`));
    if (stop!.status === 'loaded') here().then((p) => supabase.rpc('driver_arrive', { p_stop_id: stop!.id, p_lat: p.lat, p_lng: p.lng }));
  }

  async function load() {
    setBusy(true);
    const { error } = await supabase.rpc('driver_load_parcel', { p_route_id: route!.id, p_code: o.code });
    setBusy(false);
    if (error) Alert.alert('Not loaded', error.message); else reload();
  }

  async function deliver() {
    if (cod > 0 && Math.abs(Number(cash.replace(',', '.')) - cod) > 0.009) {
      return Alert.alert('Check the cash', `This parcel is ${euro(cod)} cash on delivery. Enter the exact amount you collected.`);
    }
    setBusy(true);
    const p = await here();
    const { data, error } = await supabase.rpc('complete_delivery', {
      p_stop_id: stop!.id, p_client_id: clientId, p_recipient_type: recipient, p_recipient_name: recipientName || o.customer_name.split(' ')[0],
      p_signature_path: null, p_photo_paths: [], p_lat: p.lat, p_lng: p.lng, p_cod_amount: cod > 0 ? Number(cash.replace(',', '.')) : 0,
      p_cod_method: 'cash', p_delivered_at: new Date().toISOString()
    });
    setBusy(false);
    if (error) return Alert.alert('Not saved', error.message);
    const r = data as { flagged?: boolean };
    if (r?.flagged) Alert.alert('Saved for review', 'Delivery saved. The office will review it (no photo yet, or far from the address).');
    await reload();
    router.back();
  }

  async function fail() {
    setBusy(true);
    const p = await here();
    const { error } = await supabase.rpc('record_failed_attempt', {
      p_stop_id: stop!.id, p_client_id: clientId, p_reason: reason, p_note: note || null, p_photo_path: null,
      p_lat: p.lat, p_lng: p.lng, p_calls: null, p_attempted_at: new Date().toISOString()
    });
    setBusy(false);
    if (error) return Alert.alert('Not saved', error.message);
    await reload();
    router.back();
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: colors.brandHover, fontWeight: '500', fontSize: 15 }}>‹ Route {route.code}</Text></Pressable>
        <View style={{ gap: 4 }}>
          <Text style={ui.small}>STOP {stop.sequence} · {o.code} · <Text style={{ color: STOP_STATUS[stop.status].color }}>{STOP_STATUS[stop.status].label}</Text></Text>
          <Text style={ui.h1}>{o.customer_name}</Text>
          <Text style={ui.body}>{o.address_line}{o.city ? `, ${o.city}` : ''}</Text>
          <Text style={ui.small}>{[d.floor != null && `Floor ${d.floor}`, d.apartment != null && `Ap. ${d.apartment}`, o.landmark].filter(Boolean).join(' · ')}{o.window_start ? ` · window ${o.window_start.slice(0, 5)}–${o.window_end?.slice(0, 5)}` : ` · ETA ${time(stop.eta)}`}</Text>
        </View>

        {o.notes_driver && <Text style={{ backgroundColor: colors.warningTint, color: colors.warningInk, padding: 12, borderRadius: 12, overflow: 'hidden' }}>Note: {o.notes_driver}</Text>}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable style={[ui.btn, { flex: 1 }]} onPress={navigate}><Text style={ui.btnText}>Navigate</Text></Pressable>
          <Pressable style={[ui.btnGhost, { flex: 1 }]} onPress={() => Linking.openURL(`tel:${o.customer_phone}`)}><Text style={ui.btnGhostText}>Call {phonePretty(o.customer_phone).slice(-7)}</Text></Pressable>
        </View>

        <View style={[ui.card, { flexDirection: 'row' }]}>
          <View style={{ flex: 1 }}><Text style={ui.small}>Cash to collect</Text><Text style={{ fontSize: 22, fontWeight: '700', color: cod > 0 ? colors.ink : colors.successInk }}>{cod > 0 ? euro(cod) : 'Prepaid'}</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={ui.small}>Parcels</Text><Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>{o.parcels ?? 1}</Text></View>
        </View>

        {stop.status === 'pending' && (
          <Pressable style={ui.btn} disabled={busy} onPress={load}><Text style={ui.btnText}>{busy ? '…' : 'Mark as loaded in van'}</Text></Pressable>
        )}

        {open && mode === 'view' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable style={[ui.btn, { flex: 1, backgroundColor: colors.success }]} onPress={() => { setMode('deliver'); setCash(cod > 0 ? cod.toFixed(2) : ''); }}><Text style={ui.btnText}>Delivered</Text></Pressable>
            <Pressable style={[ui.btn, { flex: 1, backgroundColor: colors.warning }]} onPress={() => setMode('fail')}><Text style={ui.btnText}>Can’t deliver</Text></Pressable>
          </View>
        )}

        {mode === 'deliver' && (
          <View style={[ui.card, { gap: 12 }]}>
            <Text style={ui.h2}>Proof of delivery</Text>
            <Text style={ui.small}>Who received the parcel?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['customer', 'family', 'neighbour', 'reception'] as const).map((r) => (
                <Pressable key={r} onPress={() => setRecipient(r)} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: recipient === r ? colors.brand : colors.line, backgroundColor: recipient === r ? colors.brandTint : '#fff' }}>
                  <Text style={{ color: recipient === r ? colors.brandDeep : colors.ink2, textTransform: 'capitalize' }}>{r}</Text>
                </Pressable>
              ))}
            </View>
            {recipient !== 'customer' && <TextInput style={ui.input} placeholder="Name of the person" value={recipientName} onChangeText={setRecipientName} />}
            {cod > 0 && (<><Text style={ui.small}>Cash collected (€)</Text><TextInput style={[ui.input, { fontSize: 22, fontWeight: '600' }]} keyboardType="decimal-pad" value={cash} onChangeText={setCash} /></>)}
            <Text style={ui.small}>Photo and signature capture are added in Stage 5. GPS and time are saved now.</Text>
            <Pressable style={[ui.btn, { backgroundColor: colors.success }]} disabled={busy} onPress={deliver}><Text style={ui.btnText}>{busy ? 'Saving…' : 'Confirm delivery'}</Text></Pressable>
            <Pressable onPress={() => setMode('view')}><Text style={{ textAlign: 'center', color: colors.ink3 }}>Cancel</Text></Pressable>
          </View>
        )}

        {mode === 'fail' && (
          <View style={[ui.card, { gap: 10 }]}>
            <Text style={ui.h2}>Why couldn’t you deliver?</Text>
            {FAILURE_REASONS.map((r) => (
              <Pressable key={r.value} onPress={() => setReason(r.value)} style={{ padding: 13, borderRadius: 12, borderWidth: 1, borderColor: reason === r.value ? colors.warning : colors.line, backgroundColor: reason === r.value ? colors.warningTint : '#fff' }}>
                <Text style={{ color: colors.ink, fontWeight: reason === r.value ? '600' : '400' }}>{r.labelSq} · {r.label}</Text>
              </Pressable>
            ))}
            <TextInput style={[ui.input, { minHeight: 70 }]} multiline placeholder="What happened? (called twice, gate closed…)" value={note} onChangeText={setNote} />
            <Pressable style={[ui.btn, { backgroundColor: colors.warning }]} disabled={busy} onPress={fail}><Text style={ui.btnText}>{busy ? 'Saving…' : 'Save failed attempt'}</Text></Pressable>
            <Pressable onPress={() => setMode('view')}><Text style={{ textAlign: 'center', color: colors.ink3 }}>Cancel</Text></Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
