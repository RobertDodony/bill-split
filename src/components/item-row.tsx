import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parsePrice } from '@/lib/parse-receipt';

type Props = {
  name: string;
  price: number;
  onChange: (fields: { name: string; price: number }) => void;
  onDelete: () => void;
};

export function ItemRow({ name, price, onChange, onDelete }: Props) {
  const theme = useTheme();
  const [nameText, setNameText] = useState(name);
  const [priceText, setPriceText] = useState(price ? String(price).replace('.', ',') : '');

  const commit = () => {
    const parsed = parsePrice(priceText.replace(/[^\d.,-]/g, '')) ?? 0;
    const trimmed = nameText.trim();
    if (trimmed !== name || parsed !== price) onChange({ name: trimmed, price: parsed });
  };

  const inputStyle = [styles.input, { color: theme.text }];

  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <TextInput
        style={[inputStyle, styles.name]}
        value={nameText}
        onChangeText={setNameText}
        onEndEditing={commit}
        placeholder="Item"
        placeholderTextColor={theme.textSecondary}
      />
      <TextInput
        style={[inputStyle, styles.price]}
        value={priceText}
        onChangeText={setPriceText}
        onEndEditing={commit}
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
        selectTextOnFocus
      />
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        accessibilityLabel="Delete item"
        style={({ pressed }) => [styles.delete, pressed && { opacity: 0.5 }]}>
        <ThemedText themeColor="textSecondary">✕</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  input: {
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  name: { flex: 1 },
  price: { width: 90, textAlign: 'right', fontVariant: ['tabular-nums'] },
  delete: { paddingHorizontal: Spacing.one },
});
