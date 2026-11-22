# Számla elosztó

An Expo (React Native) app for scanning receipts. Take a photo of a receipt and the app reads its
line items and prices on-device (ML Kit), then lets you correct them and keeps a history of
scanned receipts in a local SQLite database.

Receipt scanning needs the native modules in a [development build](https://docs.expo.dev/develop/development-builds/introduction/);
it does not work in Expo Go. The app targets Android only.

## Getting started

```bash
yarn install
yarn expo run:android   # builds and installs the development build
yarn expo start         # start the dev server for an installed development build
```

## Scripts

| Command              | What it does                     |
| -------------------- | -------------------------------- |
| `yarn start`         | Start the Expo dev server        |
| `yarn test`          | Run the unit tests               |
| `yarn test:watch`    | Re-run tests on file changes     |
| `yarn test:coverage` | Run tests with a coverage report |
| `yarn lint`          | Lint with oxlint (type-aware)    |
| `yarn lint:fix`      | Lint and auto-fix with oxlint    |
| `yarn fmt`           | Format with oxfmt                |
| `yarn fmt:check`     | Check formatting with oxfmt      |
| `yarn typecheck`     | Type-check with TypeScript       |

## Project structure

```
src/
  app/                 Routes only (Expo Router). Every file here is a screen or a layout.
  components/
    navigation/        App-level navigation (tab bar)
    receipts/          Receipt-specific UI (item row, history row, totals)
    ui/                Generic building blocks (Button, ThemedText, Image, SafeAreaView)
  constants/           Shared class names (e.g. tab bar padding)
  global.css           Tailwind entry point, imported once in src/app/_layout.tsx
  db/                  SQLite schema migrations and queries
  hooks/               React hooks: the data and logic behind each screen
  services/            Device integrations: OCR, image storage, the scan pipeline
  types/               Shared TypeScript types
  utils/               Pure functions: price/date formatting, receipt text parsing
  test-utils/          Test helpers (in-memory SQLite, fixtures, queries)
  __tests__/app/       Tests for routes (they can't live inside src/app)
fixtures/receipts/     Real receipt photos with their expected parse results (see its README)
jest/                  Jest setup: compiles the NativeWind styles for tests
```

Conventions (the full coding guidelines are in [AGENTS.md](AGENTS.md)):

- Always use curly braces for `if`/`else`/`for`/`while` bodies, even one-liners
  (`if (!uri) return;` is not allowed). oxlint enforces this with `curly: all`.
- Components are `PascalCase.tsx` with a named export; hooks are `useSomething.ts`; other
  modules are `camelCase.ts`.
- Code is layered: screens → hooks → services/db → utils. Screens stay thin. Data loading and
  side effects live in hooks (`useReceipt`, `useReceiptList`, `useReceiptScanner`), so they can
  be tested on their own.
- Styling uses [NativeWind](https://www.nativewind.dev/) v4 (Tailwind CSS 3) `className`s.
  `1rem` is 16px, so the Tailwind spacing scale matches Tailwind's defaults (`p-4` = 16px).
- The app is dark-only and uses Tailwind's default palette (`bg-zinc-900`, `text-red-500`, …),
  so there are no `dark:` variants. Props that need a raw color value (`placeholderTextColor`,
  the native tab bar) read it from `tailwindcss/colors`.
- Third-party components need `cssInterop` before they accept `className`; use the wrappers in
  `src/components/ui/` (`Image`, `SafeAreaView`) rather than importing them directly.
- Set text colors with `ThemedText`'s `themeColor` prop, not in `className`: two color classes on
  one element don't override each other predictably.

## Testing

Tests use [Jest](https://jestjs.io/) with the `jest-expo` preset and
[React Native Testing Library](https://callstack.github.io/react-native-testing-library/).

- Tests sit next to the code they test as `Name.test.ts(x)`. Route tests are the exception:
  they go in `src/__tests__/app/`, mirroring `src/app/`, because Expo Router treats every file
  in `src/app/` as a route.
- Database code runs against a real in-memory SQLite database (`src/test-utils/testDatabase.ts`,
  built on Node's `node:sqlite`, so Node 22.5+ is required).
- Route tests use `renderRouter` from `expo-router/testing-library`.
- Testing Library v14 is async: `await` every `render`, `renderHook`, `fireEvent` and `act`.
- `className`s resolve to real styles in tests: `jest/globalSetup.js` compiles `global.css` the
  same way Metro does. Assert colors with `rgba(colors.red[500])` (`rgba` is in `src/test-utils/styles.ts`).
- The receipt parser is also tested against the real receipts in `fixtures/receipts/`. To see
  what ML Kit reads from a photo, start the dev server with `EXPO_PUBLIC_LOG_OCR=1`.
