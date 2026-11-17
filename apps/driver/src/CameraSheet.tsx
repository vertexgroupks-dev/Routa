// Full-screen camera: takes one photo (proof of delivery) or keeps scanning barcodes (loading the van).
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, ui } from './theme';

type Props =
  | { visible: boolean; mode: 'photo'; onClose: () => void; onPhoto: (uri: string) => void; title?: string; footer?: React.ReactNode }
  | { visible: boolean; mode: 'scan'; onClose: () => void; onScan: (code: string) => void; title?: string; footer?: React.ReactNode };

export function CameraSheet(props: Props) {
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const last = useRef<{ code: string; at: number }>({ code: '', at: 0 });

  function scanned(r: BarcodeScanningResult) {
    if (props.mode !== 'scan') return;
    const code = r.data?.trim();
    const now = Date.now();
    if (!code || (code === last.current.code && now - last.current.at < 2500)) return; // same label held in view
    last.current = { code, at: now };
    props.onScan(code);
  }

  async function shoot() {
    if (props.mode !== 'photo' || !cam.current) return;
    setBusy(true);
    try {
      const pic = await cam.current.takePictureAsync({ quality: 0.45, skipProcessing: true });
      if (pic?.uri) props.onPhoto(pic.uri);
    } finally { setBusy(false); }
  }

  return (
    <Modal visible={props.visible} animationType="slide" onRequestClose={props.onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {!perm ? <ActivityIndicator style={{ flex: 1 }} color="#fff" /> : !perm.granted ? (
          <SafeAreaView style={{ flex: 1, padding: 24, gap: 16, justifyContent: 'center', backgroundColor: colors.night }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '600' }}>Camera needed</Text>
            <Text style={{ color: colors.muted, fontSize: 15 }}>Allow the camera to take delivery photos and scan parcel labels.</Text>
            <Pressable style={ui.btn} onPress={requestPerm}><Text style={ui.btnText}>Allow camera</Text></Pressable>
            <Pressable onPress={props.onClose}><Text style={{ color: colors.muted, textAlign: 'center' }}>Cancel</Text></Pressable>
          </SafeAreaView>
        ) : (
          <>
            <CameraView ref={cam} style={{ flex: 1 }} facing="back"
              barcodeScannerSettings={props.mode === 'scan' ? { barcodeTypes: ['code128', 'qr', 'code39', 'ean13'] } : undefined}
              onBarcodeScanned={props.mode === 'scan' ? scanned : undefined} />
            <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, color: '#fff', fontSize: 17, fontWeight: '600' }}>{props.title ?? (props.mode === 'scan' ? 'Scan parcel labels' : 'Photo of the parcel')}</Text>
              <Pressable onPress={props.onClose} style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}><Text style={{ color: '#fff', fontWeight: '600' }}>{props.mode === 'scan' ? 'Done' : 'Cancel'}</Text></Pressable>
            </SafeAreaView>
            {props.mode === 'scan' && <View pointerEvents="none" style={{ position: 'absolute', top: '35%', left: '12%', right: '12%', height: 150, borderWidth: 3, borderColor: colors.lime, borderRadius: 18 }} />}
            <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, gap: 12, alignItems: 'center' }}>
              {props.footer}
              {props.mode === 'photo' && (
                <Pressable onPress={shoot} disabled={busy} style={{ width: 78, height: 78, borderRadius: 39, borderWidth: 5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                  {busy ? <ActivityIndicator color="#fff" /> : <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' }} />}
                </Pressable>
              )}
            </SafeAreaView>
          </>
        )}
      </View>
    </Modal>
  );
}
