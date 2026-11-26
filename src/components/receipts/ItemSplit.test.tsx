import { fireEvent, render, screen } from '@testing-library/react-native';

import { ItemSplit, type ItemSplitProps } from '@/components/receipts/ItemSplit';
import { COLORS } from '@/constants/theme';
import { queryAllSliders } from '@/test-utils/queries';

async function renderSplit(props: Partial<ItemSplitProps> = {}) {
  const onAccept = jest.fn();
  const onEdit = jest.fn();
  await render(
    <ItemSplit
      price={600}
      share={null}
      active={false}
      initialShare={50}
      onAccept={onAccept}
      onEdit={onEdit}
      {...props}
    />
  );
  return { onAccept, onEdit };
}

describe('ItemSplit', () => {
  describe('while editing', () => {
    it('shows the slider starting at the initial share, with both amounts', async () => {
      await renderSplit({ active: true, initialShare: 100 / 3 });

      expect(queryAllSliders(screen.container)).toHaveLength(1);
      expect(screen.getByText('R 1/3 · 200')).toHaveStyle({ color: COLORS.personR });
      expect(screen.getByText('K 2/3 · 400')).toHaveStyle({ color: COLORS.personK });
    });

    it('updates the amounts as the slider moves', async () => {
      await renderSplit({ active: true });
      await fireEvent(queryAllSliders(screen.container)[0], 'valueChange', 55.2);

      expect(screen.getByText('R 55% · 330')).toBeOnTheScreen();
      expect(screen.getByText('K 45% · 270')).toBeOnTheScreen();
    });

    it('accepts the slider’s share', async () => {
      const { onAccept } = await renderSplit({ active: true, initialShare: 200 / 3 });

      await fireEvent.press(screen.getByRole('button', { name: 'Accept' }));

      expect(onAccept).toHaveBeenCalledWith(200 / 3);
    });
  });

  describe('when not editing', () => {
    it('says an unsplit item isn’t split yet and opens it on tap', async () => {
      const { onEdit } = await renderSplit();

      expect(queryAllSliders(screen.container)).toHaveLength(0);
      await fireEvent.press(screen.getByRole('button', { name: 'Split item' }));

      expect(screen.getByText('Not split yet')).toBeOnTheScreen();
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('shows the accepted split and reopens it on tap', async () => {
      const { onEdit } = await renderSplit({ share: 75 });

      expect(screen.getByText('R 75% · 450')).toBeOnTheScreen();
      expect(screen.getByText('K 25% · 150')).toBeOnTheScreen();
      await fireEvent.press(screen.getByRole('button', { name: 'Change split' }));

      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });
});
