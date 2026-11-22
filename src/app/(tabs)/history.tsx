import { router } from 'expo-router';
import { FlatList, View } from 'react-native';

import { ReceiptListItem } from '@/components/receipts/ReceiptListItem';
import { SafeAreaView } from '@/components/ui/SafeAreaView';
import { ThemedText } from '@/components/ui/ThemedText';
import { TAB_BAR_PADDING } from '@/constants/layout';
import { useReceiptList } from '@/hooks/useReceiptList';
import { cn } from '@/utils/cn';

export default function HistoryScreen() {
  const receipts = useReceiptList();

  return (
    <View className="flex-1 flex-row justify-center bg-black">
      <SafeAreaView className="max-w-content flex-1" edges={['top', 'left', 'right']}>
        <ThemedText type="subtitle" className="px-6 py-4">
          History
        </ThemedText>
        <FlatList
          testID="receipt-list"
          data={receipts}
          keyExtractor={(r) => String(r.id)}
          contentContainerClassName={cn('gap-2 px-6', TAB_BAR_PADDING)}
          ListEmptyComponent={
            <ThemedText themeColor="mutedForeground">No receipts yet. Scan one first.</ThemedText>
          }
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
