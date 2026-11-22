import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { listReceipts } from '@/db/receipts';
import type { ReceiptSummary } from '@/types/receipt';

/** All saved receipts, reloaded whenever the screen gains focus. */
export function useReceiptList(): ReceiptSummary[] {
  const db = useSQLiteContext();
  const [receipts, setReceipts] = useState<ReceiptSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      void listReceipts(db).then(setReceipts);
    }, [db])
  );

  return receipts;
}
