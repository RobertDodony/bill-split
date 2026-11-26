import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert } from 'react-native';

import { scanReceipt } from '@/services/scanReceipt';

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 1,
};

export type ReceiptScannerOptions = {
  /**
   * Open the new receipt in place of the current screen instead of on top of it. Used when
   * scanning from a receipt, so a run of receipts doesn't pile up behind the Back button.
   */
  replace?: boolean;
};

/** Photo capture/pick for receipts. Scans the photo and opens the new receipt when it's done. */
export function useReceiptScanner({ replace = false }: ReceiptScannerOptions = {}) {
  const db = useSQLiteContext();
  const [busy, setBusy] = useState(false);

  const process = async (tempUri: string) => {
    setBusy(true);
    try {
      const { receiptId, itemCount } = await scanReceipt(db, tempUri);
      if (itemCount === 0) {
        Alert.alert(
          'No items found',
          'Could not read any items from this photo. You can add them by hand.'
        );
      }
      const href: Href = { pathname: '/receipt/[id]', params: { id: String(receiptId) } };
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    } catch (e) {
      Alert.alert('Something went wrong', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access in Settings to scan receipts.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(pickerOptions);
    if (!result.canceled) {
      await process(result.assets[0].uri);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    if (!result.canceled) {
      await process(result.assets[0].uri);
    }
  };

  return { busy, takePhoto, pickPhoto };
}
