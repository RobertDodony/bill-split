import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { cn } from '@/utils/cn';

/** Top tab bar for web. The native version lives in `AppTabs.tsx`. */
export function AppTabs() {
  return (
    <Tabs>
      {/* TabSlot has no className support. */}
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <TabBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Scan</TabButton>
          </TabTrigger>
          <TabTrigger name="history" href="/history" asChild>
            <TabButton>History</TabButton>
          </TabTrigger>
        </TabBar>
      </TabList>
    </Tabs>
  );
}

// `ref` is left out: TabTrigger doesn't use it, and its `RefAttributes<View>` type doesn't fit
// React Native's function-component `View`.
function TabButton({ children, isFocused, ...props }: Omit<TabTriggerSlotProps, 'ref'>) {
  return (
    <Pressable {...props} className="active:opacity-70">
      <View className={cn('rounded-2xl px-4 py-1', isFocused ? 'bg-zinc-800' : 'bg-zinc-900')}>
        <ThemedText type="small" themeColor={isFocused ? 'foreground' : 'mutedForeground'}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function TabBar({ children, ...props }: TabListProps) {
  return (
    // `style={undefined}` drops TabList's default row style; the classes below replace it.
    <View
      {...props}
      style={undefined}
      className="absolute w-full flex-row items-center justify-center p-4"
    >
      <View className="max-w-content flex-grow flex-row items-center gap-2 rounded-[32px] bg-zinc-900 px-8 py-2">
        <ThemedText type="smallBold" className="mr-auto">
          Számla elosztó
        </ThemedText>
        {children}
      </View>
    </View>
  );
}
