import { Text, type TextProps } from 'react-native';

import { cn } from '@/utils/cn';

const typeClassNames = {
  default: 'text-base font-medium',
  small: 'text-sm font-medium',
  smallBold: 'text-sm font-bold',
  subtitle: 'text-subtitle font-semibold',
} as const;

const colorClassNames = {
  foreground: 'text-white',
  mutedForeground: 'text-zinc-400',
  primaryForeground: 'text-white',
  danger: 'text-red-500',
} as const;

export type ThemedTextProps = TextProps & {
  /** Typography preset. Defaults to `default`. */
  type?: keyof typeof typeClassNames;
  /** Text color. Defaults to `foreground`. Set colors here, not in `className`. */
  themeColor?: keyof typeof colorClassNames;
};

/** Text in one of the app's typography presets and colors. */
export function ThemedText({
  type = 'default',
  themeColor = 'foreground',
  className,
  ...rest
}: ThemedTextProps) {
  return (
    <Text className={cn(typeClassNames[type], colorClassNames[themeColor], className)} {...rest} />
  );
}
