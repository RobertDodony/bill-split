import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ItemRow } from '@/components/item-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  addItem,
  deleteItem,
  deleteReceipt,
  getItems,
  getReceipt,
  updateItem,
  type Item,
  type Receipt,
} from '@/db/receipts';
import { formatDate, formatPrice } from '@/lib/format';
import { deleteReceiptImage } from '@/lib/storage';

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const receiptId = Number(id);
  const db = useSQLiteContext();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    getReceipt(db, receiptId).then(setReceipt);
    getItems(db, receiptId).then(setItems);
  }, [db, receiptId]);

  const total = items.reduce((sum, i) => sum + i.price, 0);
  const mismatch =
    receipt?.detected_total != null && Math.abs(receipt.detected_total - total) > 0.009;

  const onChange = async (itemId: number, fields: { name: string; price: number }) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...fields } : i)));
    await updateItem(db, itemId, fields);
  };

  const onDelete = async (itemId: number) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await deleteItem(db, itemId);
  };

  const onAdd = async () => {
    const item = await addItem(db, receiptId);
    setItems((prev) => [...prev, item]);
  };

  const onDeleteReceipt = () => {
    Alert.alert('Delete receipt?', 'This removes the receipt and all its items.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteReceipt(db, receiptId);
          deleteReceiptImage(receipt?.image_uri ?? null);
          router.back();
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: receipt ? formatDate(receipt.created_at) : 'Receipt',
          headerRight: () => (
            <Pressable onPress={onDeleteReceipt} hitSlop={8}>
              <ThemedText type="smallBold" style={styles.danger}>
                Delete
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}>
        <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
          <FlatList
            data={items}
            keyExtractor={(i) => String(i.id)}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              receipt?.image_uri ? (
                <Image
                  source={{ uri: receipt.image_uri }}
                  style={styles.image}
                  contentFit="cover"
                />
              ) : undefined
            }
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary">No items. Add one below.</ThemedText>
            }
            renderItem={({ item }) => (
              <ItemRow
                name={item.name}
                price={item.price}
                onChange={(fields) => onChange(item.id, fields)}
                onDelete={() => onDelete(item.id)}
              />
            )}
            ListFooterComponent={
              <ThemedView style={styles.footer}>
                <Button title="+ Add item" variant="secondary" onPress={onAdd} />
                <ThemedView style={styles.totalRow}>
                  <ThemedText type="smallBold">Total ({items.length} items)</ThemedText>
                  <ThemedText type="smallBold">{formatPrice(total)}</ThemedText>
                </ThemedView>
                {receipt?.detected_total != null && (
                  <ThemedView style={styles.totalRow}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Total printed on receipt
                    </ThemedText>
                    <ThemedText
                      type="small"
                      themeColor={mismatch ? undefined : 'textSecondary'}
                      style={mismatch ? styles.danger : undefined}>
                      {formatPrice(receipt.detected_total)}
                    </ThemedText>
                  </ThemedView>
                )}
                {mismatch && (
                  <ThemedText type="small" style={styles.danger}>
                    The totals differ. Check the items for missing or misread prices.
                  </ThemedText>
                )}
              </ThemedView>
            }
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  flex: { flex: 1, maxWidth: MaxContentWidth },
  safeArea: { flex: 1 },
  list: { padding: Spacing.three, gap: Spacing.two },
  image: {
    width: '100%',
    height: 160,
    borderRadius: Spacing.three,
    marginBottom: Spacing.two,
  },
  footer: { gap: Spacing.three, marginTop: Spacing.two },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  danger: { color: '#E5484D' },
});
