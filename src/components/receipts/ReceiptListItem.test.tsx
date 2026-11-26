import { fireEvent, render, screen } from '@testing-library/react-native';

import { ReceiptListItem } from '@/components/receipts/ReceiptListItem';
import { makeReceiptSummary } from '@/test-utils/fixtures';

describe('ReceiptListItem', () => {
  it('shows the date, item count and total', async () => {
    await render(
      <ReceiptListItem
        receipt={makeReceiptSummary({ item_count: 3, items_total: 12999.5 })}
        onPress={jest.fn()}
      />
    );

    expect(screen.getByText('2026. 01. 05. 14:03')).toBeOnTheScreen();
    expect(screen.getByText(/^3 items/)).toBeOnTheScreen();
    expect(screen.getByText(/^12\s999,5$/)).toBeOnTheScreen();
  });

  it('uses the singular for one item', async () => {
    await render(
      <ReceiptListItem receipt={makeReceiptSummary({ item_count: 1 })} onPress={jest.fn()} />
    );

    expect(screen.getByText(/^1 item /)).toBeOnTheScreen();
  });

  it('shows who paid', async () => {
    await render(
      <ReceiptListItem
        receipt={makeReceiptSummary({ item_count: 2, paid_by: 'K' })}
        onPress={jest.fn()}
      />
    );

    expect(screen.getByText('2 items · paid by K')).toBeOnTheScreen();
  });

  it('says when nobody has been picked as the payer', async () => {
    await render(
      <ReceiptListItem
        receipt={makeReceiptSummary({ item_count: 2, paid_by: null })}
        onPress={jest.fn()}
      />
    );

    expect(screen.getByText('2 items · no payer yet')).toBeOnTheScreen();
  });

  it('shows the photo as a thumbnail', async () => {
    await render(
      <ReceiptListItem
        receipt={makeReceiptSummary({ image_uri: 'file:///r.jpg' })}
        onPress={jest.fn()}
      />
    );

    expect(screen.getByTestId('receipt-thumbnail')).toHaveProp('source', [
      { uri: 'file:///r.jpg' },
    ]);
    expect(screen.queryByTestId('receipt-thumbnail-placeholder')).not.toBeOnTheScreen();
  });

  it('shows a placeholder without a photo', async () => {
    await render(
      <ReceiptListItem receipt={makeReceiptSummary({ image_uri: null })} onPress={jest.fn()} />
    );

    expect(screen.getByTestId('receipt-thumbnail-placeholder')).toBeOnTheScreen();
    expect(screen.queryByTestId('receipt-thumbnail')).not.toBeOnTheScreen();
  });

  it('handles presses', async () => {
    const onPress = jest.fn();
    await render(<ReceiptListItem receipt={makeReceiptSummary()} onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
