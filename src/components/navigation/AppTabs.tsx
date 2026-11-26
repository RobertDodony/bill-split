import { NativeTabs } from 'expo-router/native-tabs';

import { COLORS } from '@/constants/theme';

/** Native bottom tabs. */
export function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={COLORS.background}
      indicatorColor={COLORS.surface}
      labelStyle={{ selected: { color: COLORS.onSurface } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Scan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
