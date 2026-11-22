import { Directory, File, Paths } from 'expo-file-system';

const receiptsDir = new Directory(Paths.document, 'receipts');

/** Copies a temporary camera/picker image into the app's documents dir so it survives cache cleanup. */
export async function persistReceiptImage(tempUri: string): Promise<string> {
  receiptsDir.create({ idempotent: true, intermediates: true });
  const ext = tempUri.split('.').pop()?.split('?')[0] || 'jpg';
  const dest = new File(receiptsDir, `${Date.now()}.${ext}`);
  await new File(tempUri).copy(dest);
  return dest.uri;
}

export function deleteReceiptImage(uri: string | null) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Missing file is fine.
  }
}
