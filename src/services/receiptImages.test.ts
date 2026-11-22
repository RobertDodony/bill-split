import { deleteReceiptImage, fileExtension, persistReceiptImage } from '@/services/receiptImages';

const mockCreateDir = jest.fn();
const mockCopy = jest.fn();
const mockDelete = jest.fn();
const mockExists = jest.fn(() => true);

type MockPathPart = string | { uri: string };

jest.mock('expo-file-system', () => {
  const join = (parts: MockPathPart[]) =>
    parts.map((p) => (typeof p === 'string' ? p : p.uri)).join('/');

  return {
    Paths: { document: { uri: 'file:///documents' } },
    Directory: class {
      uri: string;
      constructor(...parts: MockPathPart[]) {
        this.uri = join(parts);
      }
      create(options: unknown) {
        mockCreateDir(this.uri, options);
      }
    },
    File: class {
      uri: string;
      constructor(...parts: MockPathPart[]) {
        this.uri = join(parts);
      }
      get exists() {
        return mockExists();
      }
      async copy(dest: { uri: string }) {
        mockCopy(this.uri, dest.uri);
      }
      delete() {
        mockDelete(this.uri);
      }
    },
  };
});

describe('fileExtension', () => {
  it.each([
    ['file:///cache/photo.png', 'png'],
    ['file:///cache/photo.JPEG', 'JPEG'],
    ['file:///cache/photo.heic?width=100', 'heic'],
    ['file:///cache/photo.jpg#frag', 'jpg'],
    ['file:///data/com.example.app/cache/photo', 'jpg'],
    ['content://media/external/images/42', 'jpg'],
    ['file:///cache/.hidden', 'jpg'],
    ['file:///cache/trailing.', 'jpg'],
  ])('%p → %p', (uri, expected) => {
    expect(fileExtension(uri)).toBe(expected);
  });
});

describe('persistReceiptImage', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('copies the image into the receipts folder and returns its new uri', async () => {
    const uri = await persistReceiptImage('file:///cache/ImagePicker/abc.png');

    expect(mockCreateDir).toHaveBeenCalledWith('file:///documents/receipts', {
      idempotent: true,
      intermediates: true,
    });
    expect(mockCopy).toHaveBeenCalledWith(
      'file:///cache/ImagePicker/abc.png',
      'file:///documents/receipts/1700000000000.png'
    );
    expect(uri).toBe('file:///documents/receipts/1700000000000.png');
  });

  it('uses .jpg when the source has no extension', async () => {
    const uri = await persistReceiptImage('file:///data/com.app/cache/abc');

    expect(uri).toBe('file:///documents/receipts/1700000000000.jpg');
  });

  it('fails when the copy fails', async () => {
    mockCopy.mockImplementationOnce(() => {
      throw new Error('disk full');
    });

    await expect(persistReceiptImage('file:///cache/a.jpg')).rejects.toThrow('disk full');
  });
});

describe('deleteReceiptImage', () => {
  it('deletes an existing file', () => {
    deleteReceiptImage('file:///documents/receipts/1.jpg');

    expect(mockDelete).toHaveBeenCalledWith('file:///documents/receipts/1.jpg');
  });

  it('does nothing without a uri', () => {
    deleteReceiptImage(null);

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('does nothing when the file is already gone', () => {
    mockExists.mockReturnValueOnce(false);

    deleteReceiptImage('file:///documents/receipts/1.jpg');

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('swallows file system errors', () => {
    mockDelete.mockImplementationOnce(() => {
      throw new Error('permission denied');
    });

    expect(() => deleteReceiptImage('file:///documents/receipts/1.jpg')).not.toThrow();
  });
});
