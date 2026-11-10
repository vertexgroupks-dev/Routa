import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../src/supabase';
import { colors } from '../src/theme';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    const onSignIn = segments[0] === 'sign-in';
    if (!session && !onSignIn) router.replace('/sign-in');
    if (session && onSignIn) router.replace('/');
  }, [session, segments, router]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }} />
    </SafeAreaProvider>
  );
}
