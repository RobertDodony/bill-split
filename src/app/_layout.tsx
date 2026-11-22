import '@/global.css';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_NAME, migrate } from '@/db/migrations';

// Keep the native splash screen up until the database is ready to render the first screen.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true });

async function initDatabase(db: SQLiteDatabase) {
  try {
    await migrate(db);
  } finally {
    SplashScreen.hide();
  }
}

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="receipt/[id]" options={{ title: 'Receipt' }} />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
