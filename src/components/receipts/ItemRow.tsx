import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { IconButton } from 'react-native-paper';

import { COLORS } from '@/constants/theme';
import type { ItemFields } from '@/types/receipt';
import { formatPriceInput, parsePriceInput } from '@/utils/price';

export type ItemRowProps = ItemFields & {
  /** Called when editing ends and the name or price actually changed. */
  onChange: (fields: ItemFields) => void;
  onDelete: () => void;
  /** Highlights the row, e.g. while its split is being edited. */
  active?: boolean;
  /** Shown under the name and price, e.g. the item's split. */
  children?: ReactNode;
};

/** An editable receipt line: name, price and a delete button, with optional content below. */
export function ItemRow({ name, price, onChange, onDelete, active, children }: ItemRowProps) {
  const [nameText, setNameText] = useState(name);
  const [priceText, setPriceText] = useState(formatPriceInput(price));

  const commit = () => {
    const parsed = parsePriceInput(priceText);
    const trimmed = nameText.trim();
    if (trimmed !== name || parsed !== price) {
      onChange({ name: trimmed, price: parsed });
    }
  };

  return (
    <View testID="item-row" style={[styles.card, active && styles.active]}>
      <View style={styles.fields}>
        <TextInput
          style={[styles.input, styles.name]}
          value={nameText}
          onChangeText={setNameText}
          onEndEditing={commit}
          placeholder="Item"
          placeholderTextColor={COLORS.onSurfaceVariant}
          accessibilityLabel="Item name"
        />
        <TextInput
          style={[styles.input, styles.price]}
          value={priceText}
          onChangeText={setPriceText}
          onEndEditing={commit}
          placeholder="0"
          placeholderTextColor={COLORS.onSurfaceVariant}
          keyboardType="decimal-pad"
          selectTextOnFocus
          accessibilityLabel="Item price"
        />
        <IconButton
          icon="close"
          size={20}
          onPress={onDelete}
          accessibilityLabel="Delete item"
          style={styles.delete}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  active: { borderColor: COLORS.personRStrong },
  fields: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { paddingVertical: 8, fontSize: 16, color: COLORS.onSurface },
  name: { flex: 1 },
  price: { width: 90, textAlign: 'right', fontVariant: ['tabular-nums'] },
  // IconButton has a 6dp margin for standalone use; the row's gap spaces it here.
  delete: { margin: 0 },
});
