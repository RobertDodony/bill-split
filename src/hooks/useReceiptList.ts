import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { listAllItems, listReceipts } from '@/db/receipts';
import { listSettlements } from '@/db/settlements';
import { groupHistory, type HistorySection } from '@/utils/history';

/**
 * All saved receipts grouped for the history list: the open ones, then one section per
 * settlement. Reloaded whenever the screen gains focus.
 */
export function useReceiptList(): HistorySection[] {
  const db = useSQLiteContext();
  const [sections, setSections] = useState<HistorySection[]>([]);

  useFocusEffect(
    useCallback(() => {
      void Promise.all([listReceipts(db), listAllItems(db), listSettlements(db)]).then(
        ([receipts, items, settlements]) => setSections(groupHistory(receipts, items, settlements))
      );
    }, [db])
  );

  return sections;
}
