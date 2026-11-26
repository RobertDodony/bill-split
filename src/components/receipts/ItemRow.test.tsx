import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ItemRow } from '@/components/receipts/ItemRow';
import { COLORS } from '@/constants/theme';

const nameInput = () => screen.getByLabelText('Item name');
const priceInput = () => screen.getByLabelText('Item price');

async function renderRow(props: Partial<Parameters<typeof ItemRow>[0]> = {}) {
  const onChange = jest.fn();
  const onDelete = jest.fn();
  await render(
    <ItemRow name="KENYÉR" price={599} onChange={onChange} onDelete={onDelete} {...props} />
  );
  return { onChange, onDelete };
}

describe('ItemRow', () => {
  it('shows the name and price', async () => {
    await renderRow({ price: 12.5 });

    expect(nameInput()).toHaveDisplayValue('KENYÉR');
    expect(priceInput()).toHaveDisplayValue('12,5');
  });

  it('shows a zero price as an empty field', async () => {
    await renderRow({ name: '', price: 0 });

    expect(priceInput()).toHaveDisplayValue('');
    expect(priceInput()).toHaveProp('placeholder', '0');
    expect(nameInput()).toHaveProp('placeholder', 'Item');
    expect(nameInput()).toHaveProp('placeholderTextColor', COLORS.onSurfaceVariant);
  });

  it('saves a trimmed name when editing ends', async () => {
    const { onChange } = await renderRow();

    await fireEvent.changeText(nameInput(), '  Kenyér félbarna ');
    await fireEvent(nameInput(), 'endEditing');

    expect(onChange).toHaveBeenCalledWith({ name: 'Kenyér félbarna', price: 599 });
  });

  it('parses the typed price when editing ends', async () => {
    const { onChange } = await renderRow();

    await fireEvent.changeText(priceInput(), '1 299,50 Ft');
    await fireEvent(priceInput(), 'endEditing');

    expect(onChange).toHaveBeenCalledWith({ name: 'KENYÉR', price: 1299.5 });
  });

  it('saves an unreadable price as 0', async () => {
    const { onChange } = await renderRow();

    await fireEvent.changeText(priceInput(), 'free');
    await fireEvent(priceInput(), 'endEditing');

    expect(onChange).toHaveBeenCalledWith({ name: 'KENYÉR', price: 0 });
  });

  it('does not save when nothing changed', async () => {
    const { onChange } = await renderRow();

    await fireEvent.changeText(nameInput(), 'KENYÉR ');
    await fireEvent(nameInput(), 'endEditing');
    await fireEvent(priceInput(), 'endEditing');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('deletes the item', async () => {
    const { onDelete } = await renderRow();

    await fireEvent.press(screen.getByRole('button', { name: 'Delete item' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows its children under the name and price', async () => {
    await renderRow({ children: <Text>Split here</Text> });

    expect(screen.getByText('Split here')).toBeOnTheScreen();
  });

  it('is outlined when active', async () => {
    await renderRow({ active: true });

    expect(screen.getByTestId('item-row')).toHaveStyle({ borderColor: COLORS.personRStrong });
  });

  it('has no visible outline otherwise', async () => {
    await renderRow();

    expect(screen.getByTestId('item-row')).toHaveStyle({ borderColor: 'transparent' });
  });
});
