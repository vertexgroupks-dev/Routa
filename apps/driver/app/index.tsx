import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STOP_STATUS, euro, time, dateLong, todayKs } from '@routa/shared';
import { supabase } from '../src/supabase';
import { useTodayRoute } from '../src/useRoute';
import { colors, mono, ui } from '../src/theme';
import { CameraSheet } from '../src/CameraSheet';
import { useTracking } from '../src/useTracking';

export default function Today() {
  const router = useRouter();
  const { route, loading, error, reload } = useTodayRoute();
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanLog, setScanLog] = useState<{ code: string; ok: boolean; text: string }[]>([]);
  const sharing = useTracking(!!route && ['loading', 'in_progress'].includes(route.status));

  async function onScan(code: string) {
    if (!route) return;
    const { data, error } = await supabase.rpc('driver_load_parcel', { p_route_id: route.id, p_code: code });
    const r = data as { ok?: boolean; error?: string; code?: string } | null;
    const ok = !error && r?.ok !== false;
    const text = ok ? 'Loaded ✓' : error ? error.message : r?.error === 'not_on_this_route' ? 'Not on your route — put it aside' : 'Unknown parcel';
    setScanLog((l) => [{ code: r?.code ?? code, ok, text }, ...l].slice(0, 6));
    if (ok) reload();
  }

  if (loading) return <View style={[ui.screen, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={colors.brand} /></View>;

  if (!route) {
    return (
      <SafeAreaView style={[ui.screen, { padding: 24, gap: 16, justifyContent: 'center' }]}>
        <Text style={ui.h1}>No route yet</Text>
        <Text style={ui.body}>When your dispatcher publishes today’s routes you’ll get a notification and your stops will appear here.</Text>
        {error && <Text style={ui.error}>{error}</Text>}
        <Pressable style={ui.btnGhost} onPress={reload}><Text style={ui.btnGhostText}>Refresh</Text></Pressable>
        <Pressable style={ui.btn} disabled={busy} onPress={async () => {
          setBusy(true);
          const { error } = await supabase.rpc('join_demo_org', { p_role: 'driver' });
          setBusy(false);
          if (error) Alert.alert('Could not join demo', error.message); else reload();
        }}><Text style={ui.btnText}>{busy ? 'Joining…' : 'Join the demo as a driver'}</Text></Pressable>
        <Pressable onPress={() => supabase.auth.signOut()}><Text style={{ textAlign: 'center', color: colors.ink3 }}>Sign out</Text></Pressable>
      </SafeAreaView>
    );
  }

  const done = route.stops.filter((s) => ['delivered', 'failed', 'skipped'].includes(s.status)).length;
  const toLoad = route.stops.filter((s) => s.status === 'pending').length;
  const cash = route.stops.filter((s) => s.status === 'delivered').reduce((sum, s) => sum + Number(s.order.cod_amount || 0), 0);
  const next = route.stops.find((s) => ['loaded', 'arrived'].includes(s.status));

  async function startRoute() {
    setBusy(true);
    const { error } = await supabase.rpc('driver_start_route', { p_route_id: route!.id });
    setBusy(false);
    if (error) Alert.alert('Could not start route', error.message); else reload();
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <FlatList
        data={route.stops}
        keyExtractor={(s) => s.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[ui.small, { flex: 1 }]}>{route.date === todayKs() ? dateLong() : `Route for ${route.date}`}</Text>
              <Pressable onPress={() => supabase.auth.signOut()}><Text style={ui.small}>Sign out</Text></Pressable>
            </View>
            <View style={{ backgroundColor: colors.night, borderRadius: 20, padding: 18, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: route.color ?? colors.brand }} />
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600', flex: 1 }}>Route {route.code}</Text>
                <Text style={{ color: colors.lime, fontFamily: mono }}>{done}/{route.stops.length}</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 13 }}>{route.vehicle ? `${route.vehicle.plate} · ${route.vehicle.model}` : ''}{route.dock ? ` · ${route.dock}` : ''}{route.planned_km ? ` · ${route.planned_km} km` : ''}</Text>
              <View style={{ height: 6, backgroundColor: colors.nightLine, borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: `${route.stops.length ? (done / route.stops.length) * 100 : 0}%` as `${number}%`, height: 6, backgroundColor: colors.lime }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Stat label="Cash on you" value={euro(cash)} />
                <Stat label="Left" value={String(route.stops.length - done)} />
                <Stat label="To load" value={String(toLoad)} />
              </View>
              {sharing && <Text style={{ color: colors.lime, fontSize: 12 }}>● Sharing your location with the office</Text>}
              {['published', 'loading'].includes(route.status) && toLoad > 0 && (
                <Pressable style={[ui.btn, { backgroundColor: '#fff' }]} onPress={() => { setScanLog([]); setScanning(true); }}><Text style={[ui.btnText, { color: colors.night }]}>Scan parcels to load ({toLoad} left)</Text></Pressable>
              )}
              {['published', 'loading'].includes(route.status) && (
                <Pressable style={[ui.btn, { backgroundColor: colors.lime }]} disabled={busy} onPress={startRoute}><Text style={[ui.btnText, { color: colors.night }]}>{busy ? 'Starting…' : 'Start route'}</Text></Pressable>
              )}
              {route.status === 'in_progress' && next && (
                <Pressable style={[ui.btn, { backgroundColor: colors.lime }]} onPress={() => router.push(`/stop/${next.id}`)}><Text style={[ui.btnText, { color: colors.night }]}>Next stop · {next.order.customer_name}</Text></Pressable>
              )}
              {route.status === 'in_progress' && !next && (
                <Pressable style={[ui.btn, { backgroundColor: colors.lime }]} onPress={() => router.push('/end-of-day')}><Text style={[ui.btnText, { color: colors.night }]}>End shift · hand in cash</Text></Pressable>
              )}
            </View>
            {route.date !== todayKs() && <Text style={{ backgroundColor: colors.warningTint, color: colors.warningInk, padding: 12, borderRadius: 12, overflow: 'hidden' }}>This route is planned for {route.date}. You can look at it now; normally you start it on that day.</Text>}
            <Text style={ui.h2}>Stops</Text>
          </View>
        }
        renderItem={({ item: s }) => {
          const st = STOP_STATUS[s.status];
          const closed = ['delivered', 'failed', 'skipped'].includes(s.status);
          return (
            <Pressable onPress={() => router.push(`/stop/${s.id}`)} style={[ui.card, { flexDirection: 'row', gap: 12, alignItems: 'center', opacity: closed ? 0.6 : 1 }]}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: closed ? colors.field : colors.brandTint, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '600', color: closed ? colors.ink3 : colors.brandDeep }}>{s.sequence}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }} numberOfLines={1}>{s.order.customer_name}</Text>
                <Text style={ui.small} numberOfLines={1}>{s.order.address_line}</Text>
                <Text style={{ fontSize: 12, color: st.color, fontWeight: '500' }}>{st.label}{!closed ? ` · ETA ${time(s.eta)}` : ''}</Text>
              </View>
              {Number(s.order.cod_amount) > 0 && <Text style={{ fontFamily: mono, color: colors.ink, fontWeight: '600' }}>{euro(s.order.cod_amount)}</Text>}
            </Pressable>
          );
        }}
      />
      <CameraSheet visible={scanning} mode="scan" onClose={() => setScanning(false)} onScan={onScan}
        title={`Load parcels · ${toLoad} left`}
        footer={
          <View style={{ alignSelf: 'stretch', gap: 6 }}>
            {scanLog.map((l, i) => (
              <Text key={i} style={{ backgroundColor: l.ok ? 'rgba(15,159,95,0.9)' : 'rgba(217,45,32,0.9)', color: '#fff', padding: 10, borderRadius: 10, overflow: 'hidden', fontWeight: '600' }}>{l.code} · {l.text}</Text>
            ))}
            {!scanLog.length && <Text style={{ color: '#fff', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10, overflow: 'hidden' }}>Point the camera at the barcode on each parcel label</Text>}
          </View>
        } />
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.night2, borderRadius: 12, padding: 10 }}>
      <Text style={{ color: colors.muted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}
