import { View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { formatPrice, totalsDiffer } from '@/utils/price';

export type ReceiptTotalsProps = {
  itemCount: number;
  /** Sum of the item prices. */
  total: number;
  /** Total read from the receipt photo, if one was found. */
  detectedTotal: number | null;
};

/** The item total, plus the printed total and a warning when the two disagree. */
export function ReceiptTotals({ itemCount, total, detectedTotal }: ReceiptTotalsProps) {
  const mismatch = totalsDiffer(detectedTotal, total);

  return (
    <>
      <View className="flex-row justify-between">
        <ThemedText type="smallBold">Total ({itemCount} items)</ThemedText>
        <ThemedText type="smallBold">{formatPrice(total)}</ThemedText>
      </View>
      {detectedTotal != null && (
        <View className="flex-row justify-between">
          <ThemedText type="small" themeColor="mutedForeground">
            Total printed on receipt
          </ThemedText>
          <ThemedText type="small" themeColor={mismatch ? 'danger' : 'mutedForeground'}>
            {formatPrice(detectedTotal)}
          </ThemedText>
        </View>
      )}
      {mismatch && (
        <ThemedText type="small" themeColor="danger">
          The totals differ. Check the items for missing or misread prices.
        </ThemedText>
      )}
    </>
  );
}
