This is an Expo/React Native mobile app (Android only) for scanning receipts: it reads line items
and prices from a photo on-device (ML Kit), lets the user correct them, and keeps a history in a
local SQLite database. Prioritize mobile-first patterns, performance, and simple, readable code.

`README.md` has the setup steps, the project structure and the testing notes; read it alongside
this file.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

This project uses yarn (`yarn.lock`). Use `yarn` in place of `npx` for local binaries (e.g. `yarn expo start`).

```bash
yarn expo install <package>  # ALWAYS use instead of yarn add — resolves SDK-compatible versions
yarn expo start              # start the dev server
yarn lint                    # oxlint, type-aware (config: .oxlintrc.json); fails on warnings
yarn lint:fix                # oxlint with auto-fix
yarn fmt                     # format with oxfmt (config: .oxfmtrc.json; sorts imports and Tailwind classes)
yarn fmt:check               # check formatting without writing
yarn tsc --noEmit            # typecheck
yarn test                    # unit tests (Jest + jest-expo)
npx expo-doctor             # diagnose dependency and config issues
yarn expo install --fix      # fix incompatible package versions
```

## Definition of done

Before declaring any task done, all of these must pass:

```bash
yarn lint && yarn fmt:check && yarn tsc --noEmit && yarn test
```

Don't add ESLint or Prettier. Disable an oxlint rule only with an
`// oxlint-disable-next-line <rule>` and a comment explaining why.

## Code style

- **Always use curly braces** for `if`, `else`, `for`, `while` and `do`, even when the body is one
  statement. No single-line `if (x) return;`. Enforced by oxlint's `curly: all`.

  ```ts
  // ✗
  if (!uri) return;

  // ✓
  if (!uri) {
    return;
  }
  ```

- Prefer early returns over nested `if`/`else`, still with braces.
- TypeScript is strict. Use `type` aliases, not `interface`. Import types with `import type` (or
  inline `type` specifiers). Avoid `as` casts and `any`; narrow instead.
- Use named exports. Default exports are only for route files in `src/app/` and config files.
- Import project code through the `@/` alias (`@/utils/price`), not relative `../` paths. Import
  order is handled by `yarn fmt`.
- Mark promises you deliberately don't await with `void` (`void db.getItems(...).then(...)`).
- Give exported functions a short `/** */` comment when the name doesn't say everything. Comments
  explain why, not what.
- Keep functions small and pure where possible. Name constants in `UPPER_SNAKE_CASE` at the top of
  the module.

## Architecture

Code is layered; each layer only calls the ones below it.

| Layer             | Folder                         | Rules                                                                               |
| ----------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| Screens           | `src/app/`                     | Routes only. Thin: layout plus calls into one hook. No direct DB or service calls.  |
| Components        | `src/components/`              | Presentational. Data comes in through props, changes go out through callbacks.      |
| Hooks             | `src/hooks/`                   | React state and side effects behind a screen (`useReceipt`, `useReceiptScanner`).   |
| Services          | `src/services/`                | Device integrations: OCR, file storage, the scan pipeline.                          |
| Database          | `src/db/`                      | SQL only. Every function takes the `SQLiteDatabase` as its first argument.          |
| Utils             | `src/utils/`                   | Pure functions with no React, native modules or I/O (parsing, formatting).          |
| Types / constants | `src/types/`, `src/constants/` | Shared types (DB row types mirror the `snake_case` columns) and shared class names. |

- **Database**: change the schema only by bumping `DATABASE_VERSION` in `src/db/migrations.ts` and
  adding a migration step; never edit an existing step. Write multi-row changes in a transaction.
  Use `?` placeholders, never string-interpolated values.
- **Money**: prices are numbers in forints (HUF), possibly with decimals. Parse with `parsePrice` /
  `parsePriceInput`, display with `formatPrice`, compare totals with `totalsDiffer` (it absorbs
  floating-point noise). Dates are stored as ms since epoch and shown with `formatDate`.
- **Receipt parsing** (`src/utils/parseReceipt.ts`): changes must keep `fixtures/receipts/` passing;
  add a fixture for each new receipt layout (see `fixtures/receipts/README.md`).

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Typed routes are on (`experiments.typedRoutes` in `app.json`), so `href`s passed to `Link` and
  `router` are type-checked. Pass dynamic segments as `params` rather than building the path by hand.
- Docs: https://docs.expo.dev/router/introduction.md

## Styling

- Style with NativeWind `className`s (v4, Tailwind 3). Don't use `StyleSheet` or inline `style`
  objects, and don't hard-code hex colors.
- The app is dark-only and uses Tailwind's default palette (`bg-zinc-900`, `text-red-500`). There
  are no `dark:` variants. Props that need a raw color (`placeholderTextColor`, the native tab bar)
  read it from `tailwindcss/colors`.
- Combine conditional classes with `cn()` from `@/utils/cn`.
- Set text color with `ThemedText`'s `themeColor` prop, not in `className`.
- Third-party components need `cssInterop` before they accept `className`; use the wrappers in
  `src/components/ui/` (`Image`, `SafeAreaView`).
- After changing `tailwind.config.ts`, `src/global.css` or `nativewind.options.js`, restart Metro with `yarn expo start --clear`.

## Tests

- Every module gets a colocated `*.test.ts(x)`. Route tests go in `src/__tests__/app/` — never put tests inside `src/app/`.
- Testing Library v14 is async: `await` every `render`, `renderHook`, `fireEvent` and `act`.
- Database code is tested against a real in-memory SQLite database (`src/test-utils/testDatabase.ts`),
  not mocks.
- Test behavior a user or caller can see, not implementation details.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `yarn dlx eas-cli <command>` (Yarn Berry) or `npx eas-cli@latest <command>`; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- `android/` is generated (Continuous Native Generation) and gitignored. Never create or edit it by hand — configure native behavior in `app.json` and config plugins.
- The app targets Android only. Don't add iOS- or web-specific code or config.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `yarn expo run:android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
- Keep docs current: when a change makes `README.md` or this file wrong, update them in the same change.
