import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SCREEN_STYLES, TAB_BAR_PADDING } from '@/constants/layout';
import { COLORS } from '@/constants/theme';
import { useReceiptScanner } from '@/hooks/useReceiptScanner';

export default function ScanScreen() {
  const { busy, takePhoto, pickPhoto } = useReceiptScanner();

  return (
    <View style={SCREEN_STYLES.screen}>
      <SafeAreaView testID="scan-content" style={[SCREEN_STYLES.content, styles.content]}>
        <View style={styles.intro}>
          <Text variant="headlineLarge" style={styles.center}>
            Scan a receipt
          </Text>
          <Text variant="bodyLarge" style={[styles.center, styles.muted]}>
            Take a photo of a receipt to get a list of its items and prices. For best results, lay
            it flat in good light and fill the frame.
          </Text>
        </View>

        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator size="large" />
            <Text variant="bodyLarge" style={styles.muted}>
              Reading receipt…
            </Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <Button mode="contained" onPress={takePhoto}>
              Take photo
            </Button>
            <Button mode="contained-tonal" onPress={pickPhoto}>
              Choose from gallery
            </Button>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24, paddingHorizontal: 24, paddingBottom: TAB_BAR_PADDING },
  intro: { flex: 1, justifyContent: 'center', gap: 16 },
  center: { textAlign: 'center' },
  muted: { color: COLORS.onSurfaceVariant },
  busy: { alignItems: 'center', gap: 16, paddingVertical: 24 },
  actions: { gap: 16 },
});
