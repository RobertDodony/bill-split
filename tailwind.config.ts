import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  // NativeWind's preset is CommonJS without ES module typings, so it can't be imported.
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontSize: {
        subtitle: ['2rem', { lineHeight: '2.75rem' }],
      },
      maxWidth: {
        content: '800px',
      },
    },
  },
} satisfies Config;
