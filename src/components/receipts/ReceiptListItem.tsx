import { Pressable, View } from 'react-native';

import { Image } from '@/components/ui/Image';
import { ThemedText } from '@/components/ui/ThemedText';
import type { ReceiptSummary } from '@/types/receipt';
import { formatDate } from '@/utils/date';
import { formatPrice } from '@/utils/price';

export type ReceiptListItemProps = {
  receipt: ReceiptSummary;
  onPress: () => void;
};

/** A history row: thumbnail, date, item count and total. */
export function ReceiptListItem({ receipt, onPress }: ReceiptListItemProps) {
  const itemCountLabel = `${receipt.item_count} ${receipt.item_count === 1 ? 'item' : 'items'}`;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="active:opacity-70">
      <View className="flex-row items-center gap-4 rounded-2xl bg-zinc-900 p-2">
        {receipt.image_uri ? (
          <Image
            testID="receipt-thumbnail"
            source={{ uri: receipt.image_uri }}
            className="size-12 rounded-lg"
            contentFit="cover"
          />
        ) : (
          <View testID="receipt-thumbnail-placeholder" className="size-12 rounded-lg bg-zinc-800" />
        )}
        <View className="flex-1">
          <ThemedText type="smallBold">{formatDate(receipt.created_at)}</ThemedText>
          <ThemedText type="small" themeColor="mutedForeground">
            {itemCountLabel}
          </ThemedText>
        </View>
        <ThemedText type="smallBold">{formatPrice(receipt.items_total)}</ThemedText>
      </View>
    </Pressable>
  );
}
