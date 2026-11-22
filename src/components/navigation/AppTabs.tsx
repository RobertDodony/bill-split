import { NativeTabs } from 'expo-router/native-tabs';
import colors from 'tailwindcss/colors';

/** Native bottom tabs on iOS and Android. The web version lives in `AppTabs.web.tsx`. */
export function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={colors.black}
      indicatorColor={colors.zinc[900]}
      labelStyle={{ selected: { color: colors.white } }}
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
