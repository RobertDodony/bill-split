import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { COLORS } from '@/constants/theme';
import { formatPrice } from '@/utils/price';
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

  return (
    <View testID="split-totals" style={styles.row}>
      <View style={styles.box}>
        <Text variant="headlineSmall" style={[styles.letter, styles.personR]}>
          R
        </Text>
        <Text variant="titleSmall">{formatPrice(r)}</Text>
      </View>
      <View style={styles.box}>
        <Text variant="headlineSmall" style={[styles.letter, styles.personK]}>
          K
        </Text>
        <Text variant="titleSmall">{formatPrice(k)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { textAlign: 'center', color: COLORS.onSurfaceVariant },
  row: { flexDirection: 'row', gap: 8 },
  box: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
  },
  letter: { fontWeight: 'bold' },
  personR: { color: COLORS.personR },
  personK: { color: COLORS.personK },
});
