import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { listReceipts, type ReceiptSummary } from '@/db/receipts';
import { formatDate, formatPrice } from '@/lib/format';

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const [receipts, setReceipts] = useState<ReceiptSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      listReceipts(db).then(setReceipts);
    }, [db])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ThemedText type="subtitle" style={styles.title}>
          History
        </ThemedText>
        <FlatList
          data={receipts}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary">No receipts yet. Scan one first.</ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/receipt/[id]', params: { id: String(item.id) } })
              }
              style={({ pressed }) => pressed && { opacity: 0.7 }}>
              <ThemedView type="backgroundElement" style={styles.row}>
                {item.image_uri ? (
                  <Image source={{ uri: item.image_uri }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <ThemedView type="backgroundSelected" style={styles.thumb} />
                )}
                <ThemedView type="backgroundElement" style={styles.rowText}>
                  <ThemedText type="smallBold">{formatDate(item.created_at)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.item_count} {item.item_count === 1 ? 'item' : 'items'}
                  </ThemedText>
                </ThemedView>
                <ThemedText type="smallBold">{formatPrice(item.items_total)}</ThemedText>
              </ThemedView>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  title: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  list: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  thumb: { width: 48, height: 48, borderRadius: Spacing.two },
  rowText: { flex: 1 },
});
