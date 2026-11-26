import { router } from 'expo-router';
import { SectionList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReceiptListItem } from '@/components/receipts/ReceiptListItem';
import { SCREEN_STYLES, TAB_BAR_PADDING } from '@/constants/layout';
import { COLORS } from '@/constants/theme';
import { useReceiptList } from '@/hooks/useReceiptList';

export default function HistoryScreen() {
  const sections = useReceiptList();

  return (
    <View style={SCREEN_STYLES.screen}>
      <SafeAreaView style={SCREEN_STYLES.content} edges={['top', 'left', 'right']}>
        <Text variant="headlineLarge" style={styles.title}>
          History
        </Text>
        <SectionList
          testID="receipt-list"
          sections={sections}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text variant="bodyLarge" style={styles.muted}>
              No receipts yet. Scan one first.
            </Text>
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium">{section.title}</Text>
              <Text variant="bodyMedium" style={styles.muted}>
                {section.summary}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <ReceiptListItem
              receipt={item}
              onPress={() =>
                router.push({ pathname: '/receipt/[id]', params: { id: String(item.id) } })
              }
            />
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: 24, paddingVertical: 16 },
  list: { gap: 8, paddingHorizontal: 24, paddingBottom: TAB_BAR_PADDING },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 16,
  },
  muted: { color: COLORS.onSurfaceVariant },
});
