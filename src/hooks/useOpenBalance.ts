import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import * as settlementsDb from '@/db/settlements';
import { useReceiptScanner } from '@/hooks/useReceiptScanner';
import type { ReceiptWithItems } from '@/types/receipt';
import { canSettle, summarizeBalance } from '@/utils/balance';

/**
 * The data behind the Scan tab: the running balance of every receipt not settled yet, reloaded
 * whenever the tab gains focus, the settle-up that closes them, and the receipt scanner.
 */
export function useOpenBalance() {
  const db = useSQLiteContext();
  const scanner = useReceiptScanner();
  const [receipts, setReceipts] = useState<ReceiptWithItems[]>([]);

  const load = useCallback(
    () => settlementsDb.getOpenReceiptsWithItems(db).then(setReceipts),
    [db]
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const balance = summarizeBalance(receipts);

  /** Closes every open receipt as one settlement. Does nothing until all of them are complete. */
  const settle = async () => {
    if (!canSettle(balance)) {
      return;
    }
    await settlementsDb.settleOpenReceipts(db);
    await load();
  };

  return {
    ...scanner,
    balance,
    /** When the oldest open receipt was scanned, or `null` when nothing is open. */
    openSince: receipts.at(0)?.created_at ?? null,
    settle,
  };
}
