import { fireEvent, render, screen } from '@testing-library/react-native';

import { PaidByToggle } from '@/components/receipts/PaidByToggle';
import { isChecked } from '@/test-utils/queries';

describe('PaidByToggle', () => {
  it('shows who paid', async () => {
    await render(<PaidByToggle value="K" onChange={jest.fn()} />);

    expect(isChecked(screen.getByRole('button', { name: 'Paid by K' }))).toBe(true);
    expect(isChecked(screen.getByRole('button', { name: 'Paid by R' }))).toBe(false);
  });

  it('selects nobody until a payer is picked', async () => {
    await render(<PaidByToggle value={null} onChange={jest.fn()} />);

    expect(isChecked(screen.getByRole('button', { name: 'Paid by R' }))).toBe(false);
    expect(isChecked(screen.getByRole('button', { name: 'Paid by K' }))).toBe(false);
  });

  it('reports the picked payer', async () => {
    const onChange = jest.fn();
    await render(<PaidByToggle value={null} onChange={onChange} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Paid by R' }));

    expect(onChange).toHaveBeenCalledWith('R');
  });
});
