import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TouchableRipple } from 'react-native-paper';

import { SplitSlider } from '@/components/receipts/SplitSlider';
import { COLORS } from '@/constants/theme';
import { formatPrice } from '@/utils/price';
import { formatShare, splitPrice } from '@/utils/split';

export type ItemSplitProps = {
  price: number;
  /** The accepted split (R's share in percent), or `null` if the item isn't split yet. */
  share: number | null;
  /** Whether this item's split is being edited. */
  active: boolean;
  /** Where the slider starts when editing begins. */
  initialShare: number;
  onAccept: (share: number) => void;
  /** Called when the user taps an item that isn't being edited, to edit its split. */
  onEdit: () => void;
};

/** What R and K each pay, under the R and K ends of the slider. */
function SplitAmounts({ price, share }: { price: number; share: number }) {
  const { r, k } = splitPrice(price, share);
  return (
    <View style={styles.amounts}>
      <Text variant="bodyMedium" style={styles.personR}>
        R {formatShare(share)} · {formatPrice(r)}
      </Text>
      <Text variant="bodyMedium" style={styles.personK}>
        K {formatShare(100 - share)} · {formatPrice(k)}
      </Text>
    </View>
  );
}

function SplitEditor({ price, initialShare, onAccept }: ItemSplitProps) {
  const [share, setShare] = useState(initialShare);
  return (
    <View style={styles.editor}>
      <SplitSlider value={share} onChange={setShare} />
      <SplitAmounts price={price} share={share} />
      <Button mode="contained" onPress={() => onAccept(share)} style={styles.accept}>
        Accept
      </Button>
    </View>
  );
}

/**
 * An item's split between R and K: a slider with an Accept button while it's being edited,
 * otherwise a summary that can be tapped to edit it.
 */
export function ItemSplit(props: ItemSplitProps) {
  const { price, share, active, onEdit } = props;

  if (active) {
    return <SplitEditor {...props} />;
  }

  return (
    <TouchableRipple
      onPress={onEdit}
      accessibilityRole="button"
      accessibilityLabel={share == null ? 'Split item' : 'Change split'}
      style={styles.summary}
    >
      {share == null ? (
        <Text variant="bodyMedium" style={styles.muted}>
          Not split yet
        </Text>
      ) : (
        <SplitAmounts price={price} share={share} />
      )}
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  amounts: { flexDirection: 'row', justifyContent: 'space-between' },
  personR: { color: COLORS.personR },
  personK: { color: COLORS.personK },
  muted: { color: COLORS.onSurfaceVariant },
  editor: { gap: 8 },
  accept: { marginTop: 4 },
  summary: { paddingVertical: 4 },
});
