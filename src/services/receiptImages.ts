import { Directory, File, Paths } from 'expo-file-system';

const RECEIPTS_DIR_NAME = 'receipts';
const DEFAULT_EXTENSION = 'jpg';

/** The file extension of a URI's last path segment, e.g. `png` for `file:///a.b/photo.png?x=1`. */
export function fileExtension(uri: string): string {
  const fileName = uri.split(/[?#]/)[0].split('/').pop() ?? '';
  const dot = fileName.lastIndexOf('.');
  return dot > 0 && dot < fileName.length - 1 ? fileName.slice(dot + 1) : DEFAULT_EXTENSION;
}

/** Copies a temporary camera/picker image into the app's documents dir so it survives cache cleanup. */
export async function persistReceiptImage(tempUri: string): Promise<string> {
  const dir = new Directory(Paths.document, RECEIPTS_DIR_NAME);
  dir.create({ idempotent: true, intermediates: true });
  const dest = new File(dir, `${Date.now()}.${fileExtension(tempUri)}`);
  await new File(tempUri).copy(dest);
  return dest.uri;
}

/** Deletes a stored receipt image. Missing files and `null` are ignored. */
export function deleteReceiptImage(uri: string | null) {
  if (!uri) {
    return;
  }
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Missing file is fine.
  }
}
