import { act, renderHook } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import { useReceiptScanner } from '@/hooks/useReceiptScanner';
import { scanReceipt, type ScanResult } from '@/services/scanReceipt';

const mockDb = { name: 'test-db' };

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('@/services/scanReceipt');

const picker = jest.mocked(ImagePicker);
const mockScan = jest.mocked(scanReceipt);

const photo = (uri: string) =>
  ({ canceled: false, assets: [{ uri }] }) as unknown as ImagePicker.ImagePickerResult;
const canceled = { canceled: true, assets: null } as ImagePicker.ImagePickerResult;
const permission = (granted: boolean) => ({ granted }) as ImagePicker.CameraPermissionResponse;

describe('useReceiptScanner', () => {
  let alert: jest.SpyInstance;

  beforeEach(() => {
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    picker.requestCameraPermissionsAsync.mockResolvedValue(permission(true));
    mockScan.mockResolvedValue({ receiptId: 42, itemCount: 3 });
  });

  afterEach(() => alert.mockRestore());

  describe('takePhoto', () => {
    it('scans the photo and opens the new receipt', async () => {
      picker.launchCameraAsync.mockResolvedValue(photo('file:///cache/cam.jpg'));
      const { result } = await renderHook(() => useReceiptScanner());

      await act(() => result.current.takePhoto());

      expect(picker.launchCameraAsync).toHaveBeenCalledWith({ mediaTypes: ['images'], quality: 1 });
      expect(mockScan).toHaveBeenCalledWith(mockDb, 'file:///cache/cam.jpg');
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/receipt/[id]',
        params: { id: '42' },
      });
      expect(alert).not.toHaveBeenCalled();
    });

    it('asks for camera permission when it is denied', async () => {
      picker.requestCameraPermissionsAsync.mockResolvedValue(permission(false));
      const { result } = await renderHook(() => useReceiptScanner());

      await act(() => result.current.takePhoto());

      expect(alert).toHaveBeenCalledWith('Camera permission needed', expect.any(String));
      expect(picker.launchCameraAsync).not.toHaveBeenCalled();
    });

    it('does nothing when the camera is closed without a photo', async () => {
      picker.launchCameraAsync.mockResolvedValue(canceled);
      const { result } = await renderHook(() => useReceiptScanner());

      await act(() => result.current.takePhoto());

      expect(mockScan).not.toHaveBeenCalled();
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  describe('pickPhoto', () => {
    it('scans the chosen photo and opens the new receipt', async () => {
      picker.launchImageLibraryAsync.mockResolvedValue(photo('file:///cache/lib.png'));
      const { result } = await renderHook(() => useReceiptScanner());

      await act(() => result.current.pickPhoto());

      expect(mockScan).toHaveBeenCalledWith(mockDb, 'file:///cache/lib.png');
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/receipt/[id]',
        params: { id: '42' },
      });
    });

    it('does nothing when the picker is canceled', async () => {
      picker.launchImageLibraryAsync.mockResolvedValue(canceled);
      const { result } = await renderHook(() => useReceiptScanner());

      await act(() => result.current.pickPhoto());

      expect(mockScan).not.toHaveBeenCalled();
    });
  });

  describe('scanning', () => {
    beforeEach(() => {
      picker.launchImageLibraryAsync.mockResolvedValue(photo('file:///cache/lib.png'));
    });

    it('is busy while the receipt is being read', async () => {
      let finish!: (result: ScanResult) => void;
      mockScan.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      const { result } = await renderHook(() => useReceiptScanner());
      expect(result.current.busy).toBe(false);

      let picking!: Promise<void>;
      await act(async () => {
        picking = result.current.pickPhoto();
      });
      expect(result.current.busy).toBe(true);

      await act(async () => {
        finish({ receiptId: 1, itemCount: 1 });
        await picking;
      });
      expect(result.current.busy).toBe(false);
    });

    it('still opens the receipt but warns when no items were found', async () => {
      mockScan.mockResolvedValue({ receiptId: 5, itemCount: 0 });
      const { result } = await renderHook(() => useReceiptScanner());

      await act(() => result.current.pickPhoto());

      expect(alert).toHaveBeenCalledWith('No items found', expect.any(String));
      expect(router.push).toHaveBeenCalledWith({ pathname: '/receipt/[id]', params: { id: '5' } });
    });

    it('shows the error and stays on the screen when scanning fails', async () => {
      mockScan.mockRejectedValue(new Error('OCR failed'));
      const { result } = await renderHook(() => useReceiptScanner());

      await act(() => result.current.pickPhoto());

      expect(alert).toHaveBeenCalledWith('Something went wrong', 'OCR failed');
      expect(router.push).not.toHaveBeenCalled();
      expect(result.current.busy).toBe(false);
    });

    it('shows non-Error failures as text', async () => {
      mockScan.mockRejectedValue('disk full');
      const { result } = await renderHook(() => useReceiptScanner());

      await act(() => result.current.pickPhoto());

      expect(alert).toHaveBeenCalledWith('Something went wrong', 'disk full');
    });
  });
});
