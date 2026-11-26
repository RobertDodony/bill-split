import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemRow } from '@/components/receipts/ItemRow';
import { ItemSplit } from '@/components/receipts/ItemSplit';
import { ReceiptTotals } from '@/components/receipts/ReceiptTotals';
import { SplitTotals } from '@/components/receipts/SplitTotals';
import { SCREEN_STYLES } from '@/constants/layout';
import { COLORS } from '@/constants/theme';
import { useReceipt } from '@/hooks/useReceipt';
import { formatDate } from '@/utils/date';

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    receipt,
    items,
    total,
    split,
    activeItemId,
    initialShare,
    acceptSplit,
    selectItem,
    updateItem,
    deleteItem,
    addItem,
    deleteReceipt,
  } = useReceipt(Number(id));

  const confirmDeleteReceipt = () => {
    Alert.alert('Delete receipt?', 'This removes the receipt and all its items.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteReceipt();
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={SCREEN_STYLES.screen}>
      <Stack.Screen
        options={{
          title: receipt ? formatDate(receipt.created_at) : 'Receipt',
          headerRight: () => (
            <Button mode="text" compact textColor={COLORS.error} onPress={confirmDeleteReceipt}>
              Delete
            </Button>
          ),
        }}
      />
      <SafeAreaView style={SCREEN_STYLES.content} edges={['bottom', 'left', 'right']}>
        <FlatList
          data={items}
          extraData={activeItemId}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            receipt?.image_uri ? (
              <Image
                testID="receipt-image"
                source={{ uri: receipt.image_uri }}
                style={styles.image}
                contentFit="cover"
              />
            ) : undefined
          }
          ListEmptyComponent={
            <Text variant="bodyLarge" style={styles.muted}>
              No items. Add one below.
            </Text>
          }
          renderItem={({ item }) => (
            <ItemRow
              name={item.name}
              price={item.price}
              active={item.id === activeItemId}
              onChange={(fields) => updateItem(item.id, fields)}
              onDelete={() => deleteItem(item.id)}
            >
              <ItemSplit
                price={item.price}
                share={item.r_share}
                active={item.id === activeItemId}
                initialShare={initialShare(item)}
                onAccept={(share) => acceptSplit(item.id, share)}
                onEdit={() => selectItem(item.id)}
              />
            </ItemRow>
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              {/* Labelled explicitly so the "+" icon glyph isn't part of the button's name. */}
              <Button
                mode="contained-tonal"
                icon="plus"
                onPress={addItem}
                accessibilityLabel="Add item"
              >
                Add item
              </Button>
              <ReceiptTotals
                itemCount={items.length}
                total={total}
                detectedTotal={receipt?.detected_total ?? null}
              />
              <SplitTotals split={split} />
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8, padding: 16 },
  image: { marginBottom: 8, height: 160, width: '100%', borderRadius: 16 },
  muted: { color: COLORS.onSurfaceVariant },
  footer: { marginTop: 8, gap: 16 },
});
