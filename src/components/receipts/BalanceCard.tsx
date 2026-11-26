import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { PersonTotals } from '@/components/receipts/PersonTotals';
import { COLORS } from '@/constants/theme';
import { canSettle, describeNet, type BalanceSummary } from '@/utils/balance';
import { formatDay } from '@/utils/date';

export type BalanceCardProps = {
  balance: BalanceSummary;
  /** When the oldest open receipt was scanned, or `null` when nothing is open. */
  openSince: number | null;
  onSettle: () => void;
};

const receiptsLabel = (count: number) => `${count} ${count === 1 ? 'receipt' : 'receipts'}`;

/**
 * The running balance of the receipts not settled yet: what R and K each owe, who owes whom, and
 * a Settle up button that's enabled once every open receipt is complete.
 */
export function BalanceCard({ balance, openSince, onSettle }: BalanceCardProps) {
  const { receiptCount, completeCount, r, k, net } = balance;

  if (receiptCount === 0 || openSince == null) {
    return (
      <View testID="balance-card" style={styles.card}>
        <Text variant="titleMedium">Nothing open</Text>
        <Text variant="bodyMedium" style={styles.muted}>
          Receipts you scan add up here until you settle up.
        </Text>
      </View>
    );
  }

  const unfinished = receiptCount - completeCount;

  return (
    <View testID="balance-card" style={styles.card}>
      <View style={styles.heading}>
        <Text variant="titleMedium">Open since {formatDay(openSince)}</Text>
        <Text variant="bodyMedium" style={styles.muted}>
          {receiptsLabel(receiptCount)}
        </Text>
      </View>
      <PersonTotals r={r} k={k} />
      <Text variant="titleMedium" style={styles.center}>
        {describeNet(net)}
      </Text>
      {unfinished > 0 ? (
        <Text variant="bodyMedium" style={[styles.center, styles.muted]}>
          {receiptsLabel(unfinished)} not finished
        </Text>
      ) : null}
      <Button mode="contained-tonal" onPress={onSettle} disabled={!canSettle(balance)}>
        Settle up
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  center: { textAlign: 'center' },
  muted: { color: COLORS.onSurfaceVariant },
});
