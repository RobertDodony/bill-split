import { Pressable, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { cn } from '@/utils/cn';

const variants = {
  primary: { button: 'bg-blue-500', label: 'primaryForeground' },
  secondary: { button: 'bg-zinc-900', label: 'foreground' },
} as const;

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: keyof typeof variants;
};

export function Button({ title, variant = 'primary', className, ...rest }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'items-center justify-center rounded-2xl px-6 py-4 active:opacity-60 disabled:opacity-60',
        variants[variant].button,
        className
      )}
      {...rest}
    >
      <ThemedText type="smallBold" themeColor={variants[variant].label}>
        {title}
      </ThemedText>
    </Pressable>
  );
}
