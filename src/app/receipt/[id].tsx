import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, FlatList, Pressable, View } from 'react-native';

import { ItemRow } from '@/components/receipts/ItemRow';
import { ReceiptTotals } from '@/components/receipts/ReceiptTotals';
import { Button } from '@/components/ui/Button';
import { Image } from '@/components/ui/Image';
import { SafeAreaView } from '@/components/ui/SafeAreaView';
import { ThemedText } from '@/components/ui/ThemedText';
import { useReceipt } from '@/hooks/useReceipt';
import { formatDate } from '@/utils/date';

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { receipt, items, total, updateItem, deleteItem, addItem, deleteReceipt } = useReceipt(
    Number(id)
  );

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
    <View className="flex-1 flex-row justify-center bg-black">
      <Stack.Screen
        options={{
          title: receipt ? formatDate(receipt.created_at) : 'Receipt',
          headerRight: () => (
            <Pressable onPress={confirmDeleteReceipt} hitSlop={8} accessibilityRole="button">
              <ThemedText type="smallBold" themeColor="danger">
                Delete
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <View className="max-w-content flex-1">
        <SafeAreaView className="flex-1" edges={['bottom', 'left', 'right']}>
          <FlatList
            data={items}
            keyExtractor={(i) => String(i.id)}
            contentContainerClassName="gap-2 p-4"
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              receipt?.image_uri ? (
                <Image
                  testID="receipt-image"
                  source={{ uri: receipt.image_uri }}
                  className="mb-2 h-40 w-full rounded-2xl"
                  contentFit="cover"
                />
              ) : undefined
            }
            ListEmptyComponent={
              <ThemedText themeColor="mutedForeground">No items. Add one below.</ThemedText>
            }
            renderItem={({ item }) => (
              <ItemRow
                name={item.name}
                price={item.price}
                onChange={(fields) => updateItem(item.id, fields)}
                onDelete={() => deleteItem(item.id)}
              />
            )}
            ListFooterComponent={
              <View className="mt-2 gap-4">
                <Button title="+ Add item" variant="secondary" onPress={addItem} />
                <ReceiptTotals
                  itemCount={items.length}
                  total={total}
                  detectedTotal={receipt?.detected_total ?? null}
                />
              </View>
            }
          />
        </SafeAreaView>
      </View>
    </View>
  );
}
