import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { PersonTotals } from '@/components/receipts/PersonTotals';
import { COLORS } from '@/constants/theme';
import type { SplitSummary } from '@/utils/split';

export type SplitTotalsProps = { split: SplitSummary };

/** What R and K each pay in total once every item is split; until then, the progress. */
export function SplitTotals({ split }: SplitTotalsProps) {
  const { itemCount, splitCount, r, k } = split;

  if (itemCount === 0) {
    return null;
  }

  if (splitCount < itemCount) {
    return (
      <Text variant="bodyMedium" style={styles.progress}>
        {splitCount} of {itemCount} items split
      </Text>
    );
  }

  return <PersonTotals testID="split-totals" r={r} k={k} />;
}

const styles = StyleSheet.create({
  progress: { textAlign: 'center', color: COLORS.onSurfaceVariant },
});
