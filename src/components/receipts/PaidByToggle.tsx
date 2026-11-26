import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';

import { COLORS } from '@/constants/theme';
import type { Person } from '@/types/receipt';

/** Stands for "nobody picked yet", since `SegmentedButtons` needs a string value. */
const NO_PAYER = '';

export type PaidByToggleProps = {
  value: Person | null;
  onChange: (person: Person) => void;
};

/** Picks who paid a receipt, R or K. Neither is selected until one is picked. */
export function PaidByToggle({ value, onChange }: PaidByToggleProps) {
  const handleChange = (next: Person | typeof NO_PAYER) => {
    if (next !== NO_PAYER) {
      onChange(next);
    }
  };

  return (
    <View style={styles.row}>
      <Text variant="titleSmall">Paid by</Text>
      <SegmentedButtons
        style={styles.buttons}
        value={value ?? NO_PAYER}
        onValueChange={handleChange}
        buttons={[
          { value: 'R', label: 'R', accessibilityLabel: 'Paid by R', checkedColor: COLORS.personR },
          { value: 'K', label: 'K', accessibilityLabel: 'Paid by K', checkedColor: COLORS.personK },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  buttons: { flex: 1 },
});
