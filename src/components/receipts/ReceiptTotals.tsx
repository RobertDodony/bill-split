import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { COLORS } from '@/constants/theme';
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
      <View style={styles.row}>
        <Text variant="titleSmall">Total ({itemCount} items)</Text>
        <Text variant="titleSmall">{formatPrice(total)}</Text>
      </View>
      {detectedTotal != null && (
        <View style={styles.row}>
          <Text variant="bodyMedium" style={styles.muted}>
            Total printed on receipt
          </Text>
          <Text variant="bodyMedium" style={mismatch ? styles.danger : styles.muted}>
            {formatPrice(detectedTotal)}
          </Text>
        </View>
      )}
      {mismatch && (
        <Text variant="bodyMedium" style={styles.danger}>
          The totals differ. Check the items for missing or misread prices.
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  muted: { color: COLORS.onSurfaceVariant },
  danger: { color: COLORS.error },
});
