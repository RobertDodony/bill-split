This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

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

Run lint, fmt:check, typecheck and tests before declaring any task done. Don't add ESLint or Prettier; disable an oxlint rule only with an `// oxlint-disable-next-line <rule>` and a comment explaining why.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `yarn dlx eas-cli <command>` (Yarn Berry) or `npx eas-cli@latest <command>`; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Code structure & tests

- See the "Project structure" section of `README.md` for where code goes. Components are `PascalCase.tsx`, hooks `useSomething.ts`, everything else `camelCase.ts`.
- Style with NativeWind `className`s (v4, Tailwind 3). Colors live in `src/constants/colors.ts` and become theme-aware classes (`bg-surface`, `text-danger`); don't use `StyleSheet` or hard-coded colors. Use `useTheme()` only for props that need a raw color.
- After changing `tailwind.config.ts`, `src/global.css` or `nativewind.options.js`, restart Metro with `yarn expo start --clear`.
- Every module gets a colocated `*.test.ts(x)`. Route tests go in `src/__tests__/app/` — never put tests inside `src/app/`.
- Receipt parsing changes must keep `fixtures/receipts/` passing; add a fixture for each new receipt layout.

## Rules

- If the `android/` directory does not exist, it is generated (Continuous Native Generation). Never create or edit it by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `yarn expo run:android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
