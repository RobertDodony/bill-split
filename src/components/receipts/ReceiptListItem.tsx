import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { List, Text } from 'react-native-paper';

import { COLORS } from '@/constants/theme';
import type { ReceiptSummary } from '@/types/receipt';
import { formatDate } from '@/utils/date';
import { formatPrice } from '@/utils/price';

export type ReceiptListItemProps = {
  receipt: ReceiptSummary;
  onPress: () => void;
};

/** A history row: thumbnail, date, item count, who paid and the total. */
export function ReceiptListItem({ receipt, onPress }: ReceiptListItemProps) {
  const itemCountLabel = `${receipt.item_count} ${receipt.item_count === 1 ? 'item' : 'items'}`;
  const payerLabel = receipt.paid_by ? `paid by ${receipt.paid_by}` : 'no payer yet';

  return (
    <List.Item
      title={formatDate(receipt.created_at)}
      description={`${itemCountLabel} · ${payerLabel}`}
      onPress={onPress}
      accessibilityRole="button"
      style={styles.card}
      left={() =>
        receipt.image_uri ? (
          <Image
            testID="receipt-thumbnail"
            source={{ uri: receipt.image_uri }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        ) : (
          <View
            testID="receipt-thumbnail-placeholder"
            style={[styles.thumbnail, styles.placeholder]}
          />
        )
      }
      right={() => (
        <Text variant="titleSmall" style={styles.total}>
          {formatPrice(receipt.items_total)}
        </Text>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    paddingLeft: 8,
    paddingRight: 16,
  },
  thumbnail: { width: 48, height: 48, borderRadius: 8 },
  placeholder: { backgroundColor: COLORS.surfaceVariant },
  total: { alignSelf: 'center' },
});
