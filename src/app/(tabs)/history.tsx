import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReceiptListItem } from '@/components/receipts/ReceiptListItem';
import { SCREEN_STYLES, TAB_BAR_PADDING } from '@/constants/layout';
import { COLORS } from '@/constants/theme';
import { useReceiptList } from '@/hooks/useReceiptList';

export default function HistoryScreen() {
  const receipts = useReceiptList();

  return (
    <View style={SCREEN_STYLES.screen}>
      <SafeAreaView style={SCREEN_STYLES.content} edges={['top', 'left', 'right']}>
        <Text variant="headlineLarge" style={styles.title}>
          History
        </Text>
        <FlatList
          testID="receipt-list"
          data={receipts}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text variant="bodyLarge" style={styles.muted}>
              No receipts yet. Scan one first.
            </Text>
          }
          renderItem={({ item }) => (
            <ReceiptListItem
              receipt={item}
              onPress={() =>
                router.push({ pathname: '/receipt/[id]', params: { id: String(item.id) } })
              }
            />
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: 24, paddingVertical: 16 },
  list: { gap: 8, paddingHorizontal: 24, paddingBottom: TAB_BAR_PADDING },
  muted: { color: COLORS.onSurfaceVariant },
});
