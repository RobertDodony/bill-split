import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import colors from 'tailwindcss/colors';

import { ThemedText } from '@/components/ui/ThemedText';
import type { ItemFields } from '@/types/receipt';
import { formatPriceInput, parsePriceInput } from '@/utils/price';

export type ItemRowProps = ItemFields & {
  /** Called when editing ends and the name or price actually changed. */
  onChange: (fields: ItemFields) => void;
  onDelete: () => void;
};

/** An editable receipt line: name, price and a delete button. */
export function ItemRow({ name, price, onChange, onDelete }: ItemRowProps) {
  const [nameText, setNameText] = useState(name);
  const [priceText, setPriceText] = useState(formatPriceInput(price));

  const commit = () => {
    const parsed = parsePriceInput(priceText);
    const trimmed = nameText.trim();
    if (trimmed !== name || parsed !== price) onChange({ name: trimmed, price: parsed });
  };

  return (
    <View className="flex-row items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2">
      <TextInput
        className="flex-1 py-2 text-[16px] text-white"
        value={nameText}
        onChangeText={setNameText}
        onEndEditing={commit}
        placeholder="Item"
        placeholderTextColor={colors.zinc[400]}
        accessibilityLabel="Item name"
      />
      <TextInput
        className="w-[90px] py-2 text-right text-[16px] tabular-nums text-white"
        value={priceText}
        onChangeText={setPriceText}
        onEndEditing={commit}
        placeholder="0"
        placeholderTextColor={colors.zinc[400]}
        keyboardType="decimal-pad"
        selectTextOnFocus
        accessibilityLabel="Item price"
      />
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Delete item"
        className="px-1 active:opacity-50"
      >
        <ThemedText themeColor="mutedForeground">✕</ThemedText>
      </Pressable>
    </View>
  );
}
