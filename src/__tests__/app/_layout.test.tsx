import { Slot, useTheme } from 'expo-router';
import { renderRouter, screen, testRouter } from 'expo-router/testing-library';
import * as SplashScreen from 'expo-splash-screen';
import type { SQLiteDatabase, SQLiteProviderProps } from 'expo-sqlite';
import { Text } from 'react-native';

import RootLayout from '@/app/_layout';
import { DATABASE_VERSION } from '@/db/migrations';
import { queryAllByProps } from '@/test-utils/queries';
import { createTestDatabase } from '@/test-utils/testDatabase';

const mockProvider = jest.fn();

jest.mock('expo-sqlite', () => ({
  SQLiteProvider: (props: SQLiteProviderProps) => {
    mockProvider(props);
    return props.children;
  },
}));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  setOptions: jest.fn(),
  hide: jest.fn(),
}));

function NavigationTheme() {
  return <Text>{useTheme().dark ? 'dark theme' : 'light theme'}</Text>;
}

const routes = {
  _layout: RootLayout,
  '(tabs)/_layout': Slot,
  '(tabs)/index': NavigationTheme,
  'receipt/[id]': () => <Text>Receipt screen</Text>,
};

const providerProps = (): SQLiteProviderProps => mockProvider.mock.lastCall[0];

// `_layout` sets up the splash screen when it is imported, before `clearMocks` resets the
// mocks for each test, so record those calls now.
const splashCallsOnImport = {
  preventAutoHide: jest.mocked(SplashScreen.preventAutoHideAsync).mock.calls.length,
  setOptions: [...jest.mocked(SplashScreen.setOptions).mock.calls],
  hide: jest.mocked(SplashScreen.hide).mock.calls.length,
};

describe('RootLayout', () => {
  it('keeps the splash screen up while the app loads', () => {
    expect(splashCallsOnImport).toEqual({
      preventAutoHide: 1,
      setOptions: [[{ fade: true }]],
      hide: 0,
    });
  });

  it('opens the receipts database', async () => {
    await renderRouter(routes);

    expect(providerProps().databaseName).toBe('receipts.db');
  });

  it('migrates the database and then hides the splash screen', async () => {
    await renderRouter(routes);
    const db = createTestDatabase();

    await providerProps().onInit?.(db);

    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(DATABASE_VERSION);
    expect(SplashScreen.hide).toHaveBeenCalled();
  });

  it('hides the splash screen even when the migration fails', async () => {
    await renderRouter(routes);
    const brokenDb = {
      execAsync: jest.fn().mockRejectedValue(new Error('disk I/O error')),
    } as unknown as SQLiteDatabase;

    await expect(providerProps().onInit?.(brokenDb)).rejects.toThrow('disk I/O error');
    expect(SplashScreen.hide).toHaveBeenCalled();
  });

  it('starts on the tabs without a header', async () => {
    await renderRouter(routes);

    expect(screen).toHavePathname('/');
    expect(screen.getByText('dark theme')).toBeOnTheScreen();
  });

  it('opens a receipt with a "Receipt" header', async () => {
    await renderRouter(routes);

    await testRouter.push('/receipt/1');

    expect(screen.getByText('Receipt screen')).toBeOnTheScreen();
    expect(queryAllByProps(screen.container, { title: 'Receipt' })).toHaveLength(1);
  });
});
