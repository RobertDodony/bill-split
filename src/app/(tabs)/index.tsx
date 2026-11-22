import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createReceipt } from '@/db/receipts';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { recognizeReceipt } from '@/lib/ocr';
import { parseReceipt } from '@/lib/parse-receipt';
import { persistReceiptImage } from '@/lib/storage';

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 1,
};

export default function ScanScreen() {
  const db = useSQLiteContext();
  const [busy, setBusy] = useState(false);

  const process = async (tempUri: string) => {
    setBusy(true);
    try {
      const imageUri = await persistReceiptImage(tempUri);
      const lines = await recognizeReceipt(imageUri);
      const { items, detectedTotal } = parseReceipt(lines);
      const id = await createReceipt(db, { imageUri, detectedTotal, items });
      if (items.length === 0) {
        Alert.alert(
          'No items found',
          'Could not read any items from this photo. You can add them by hand.'
        );
      }
      router.push({ pathname: '/receipt/[id]', params: { id: String(id) } });
    } catch (e) {
      Alert.alert('Something went wrong', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access in Settings to scan receipts.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(pickerOptions);
    if (!result.canceled) await process(result.assets[0].uri);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    if (!result.canceled) await process(result.assets[0].uri);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          <ThemedText type="subtitle" style={styles.center}>
            Scan a receipt
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Take a photo of a receipt to get a list of its items and prices. For best results,
            lay it flat in good light and fill the frame.
          </ThemedText>
        </ThemedView>

        {Platform.OS === 'web' ? (
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Receipt scanning works on the iOS and Android app only.
          </ThemedText>
        ) : busy ? (
          <ThemedView style={styles.busy}>
            <ActivityIndicator size="large" />
            <ThemedText themeColor="textSecondary">Reading receipt…</ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.actions}>
            <Button title="Take photo" onPress={takePhoto} />
            <Button title="Choose from gallery" variant="secondary" onPress={pickPhoto} />
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  hero: { flex: 1, justifyContent: 'center', gap: Spacing.three },
  center: { textAlign: 'center' },
  actions: { gap: Spacing.three },
  busy: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.four },
});
