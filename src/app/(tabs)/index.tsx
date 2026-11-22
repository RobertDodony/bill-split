import { ActivityIndicator, Platform, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SafeAreaView } from '@/components/ui/SafeAreaView';
import { ThemedText } from '@/components/ui/ThemedText';
import { TAB_BAR_PADDING } from '@/constants/layout';
import { useReceiptScanner } from '@/hooks/useReceiptScanner';
import { cn } from '@/utils/cn';

export default function ScanScreen() {
  const { busy, takePhoto, pickPhoto } = useReceiptScanner();

  return (
    <View className="flex-1 flex-row justify-center bg-black">
      <SafeAreaView
        testID="scan-content"
        className={cn('max-w-content flex-1 gap-6 px-6', TAB_BAR_PADDING)}
      >
        <View className="flex-1 justify-center gap-4">
          <ThemedText type="subtitle" className="text-center">
            Scan a receipt
          </ThemedText>
          <ThemedText themeColor="mutedForeground" className="text-center">
            Take a photo of a receipt to get a list of its items and prices. For best results, lay
            it flat in good light and fill the frame.
          </ThemedText>
        </View>

        {Platform.OS === 'web' ? (
          <ThemedText themeColor="mutedForeground" className="text-center">
            Receipt scanning works on the iOS and Android app only.
          </ThemedText>
        ) : busy ? (
          <View className="items-center gap-4 py-6">
            <ActivityIndicator size="large" />
            <ThemedText themeColor="mutedForeground">Reading receipt…</ThemedText>
          </View>
        ) : (
          <View className="gap-4">
            <Button title="Take photo" onPress={takePhoto} />
            <Button title="Choose from gallery" variant="secondary" onPress={pickPhoto} />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
