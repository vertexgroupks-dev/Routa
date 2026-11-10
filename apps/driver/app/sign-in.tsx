import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/supabase';
import { colors, mono, ui } from '../src/theme';

export default function SignIn() {
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('+383 ');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clean = phone.replace(/\s/g, '');

  async function sendCode() {
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithOtp({ phone: clean });
    setBusy(false);
    if (error) setError(`${error.message}. (SMS login goes live once an SMS provider is connected — use email for testing.)`); else setSent(true);
  }
  async function verify() {
    setBusy(true); setError(null);
    const { error } = await supabase.auth.verifyOtp({ phone: clean, token: code, type: 'sms' });
    setBusy(false);
    if (error) setError(error.message);
  }
  async function emailSignIn() {
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(error.message);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.night }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 20, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 12 }}>
            <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '800', color: colors.night }}>R</Text></View>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '600' }}>Routa Driver</Text>
          </View>
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.lime, fontSize: 12, letterSpacing: 0.6, fontFamily: mono }}>MIRË SE VJEN · WELCOME</Text>
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: '600', letterSpacing: -0.8 }}>Sign in to start your route</Text>
            <Text style={{ color: colors.muted, fontSize: 15 }}>Use the phone number your dispatcher registered for you.</Text>
          </View>

          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 14 }}>
            {mode === 'phone' ? (
              <>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }}>Phone number</Text>
                <TextInput style={ui.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} editable={!sent} />
                {sent && (
                  <>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }}>6-digit code from SMS</Text>
                    <TextInput style={[ui.input, { letterSpacing: 8, fontSize: 22, textAlign: 'center' }]} keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
                  </>
                )}
                <Pressable style={[ui.btn, busy && { opacity: 0.6 }]} disabled={busy} onPress={sent ? verify : sendCode}>
                  <Text style={ui.btnText}>{busy ? 'Please wait…' : sent ? 'Verify and sign in' : 'Send me a code'}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }}>Email</Text>
                <TextInput style={ui.input} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }}>Password</Text>
                <TextInput style={ui.input} secureTextEntry value={password} onChangeText={setPassword} />
                <Pressable style={[ui.btn, busy && { opacity: 0.6 }]} disabled={busy} onPress={emailSignIn}><Text style={ui.btnText}>{busy ? 'Signing in…' : 'Sign in'}</Text></Pressable>
              </>
            )}
            {error && <Text style={ui.error}>{error}</Text>}
            <Pressable onPress={() => { setMode(mode === 'phone' ? 'email' : 'phone'); setError(null); }}>
              <Text style={{ textAlign: 'center', color: colors.brandHover, fontWeight: '500', fontSize: 14 }}>{mode === 'phone' ? 'Use email instead (testing)' : 'Use phone number'}</Text>
            </Pressable>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>Shqip · English · Your location is shared only while you are on a route.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
