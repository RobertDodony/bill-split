import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary';
};

export function Button({ title, variant = 'primary', style, disabled, ...rest }: Props) {
  const theme = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.button,
        { backgroundColor: primary ? '#208AEF' : theme.backgroundElement },
        (state.pressed || disabled) && { opacity: 0.6 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <ThemedText type="smallBold" style={primary ? { color: '#ffffff' } : undefined}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
});
