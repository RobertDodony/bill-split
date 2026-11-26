import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { COLORS } from '@/constants/theme';
import { formatPrice } from '@/utils/price';

export type PersonTotalsProps = {
  r: number;
  k: number;
  testID?: string;
};

/** Two boxes side by side: what R pays and what K pays, each under its colored letter. */
export function PersonTotals({ r, k, testID }: PersonTotalsProps) {
  return (
    <View testID={testID} style={styles.row}>
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
