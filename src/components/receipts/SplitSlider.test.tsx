import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { SplitSlider } from '@/components/receipts/SplitSlider';
import { COLORS } from '@/constants/theme';
import { queryAllSliders } from '@/test-utils/queries';

const slider = () => queryAllSliders(screen.container)[0];

/** A slider that keeps its own value, like the item split does. */
function Controlled({ initial, onChange }: { initial: number; onChange: (v: number) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <SplitSlider
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

async function renderSlider(initial = 50) {
  const onChange = jest.fn();
  await render(<Controlled initial={initial} onChange={onChange} />);
  return onChange;
}

/** Drags the native slider to `value`, as its `onValueChange` reports it. */
const dragTo = (value: number) => fireEvent(slider(), 'valueChange', value);
/** Lets go of the slider at `value`, as its `onSlidingComplete` reports it. */
const release = (value: number) => fireEvent(slider(), 'slidingComplete', value);

describe('SplitSlider', () => {
  it('has R on the left and K on the right', async () => {
    await renderSlider();

    expect(screen.getByText('R')).toBeOnTheScreen();
    expect(screen.getByText('K')).toBeOnTheScreen();
  });

  it('is a 0–100 slider starting at R’s share', async () => {
    await renderSlider(25);

    expect(slider()).toHaveProp('value', 25);
    expect(slider()).toHaveProp('minimumValue', 0);
    expect(slider()).toHaveProp('maximumValue', 100);
  });

  it('colors R’s side of the track sky and K’s side amber', async () => {
    await renderSlider();

    expect(slider()).toHaveProp('minimumTrackTintColor', COLORS.personRStrong);
    expect(slider()).toHaveProp('maximumTrackTintColor', COLORS.personKStrong);
    expect(slider()).toHaveProp('thumbTintColor', COLORS.onSurface);
  });

  it('marks the breakpoints at a third, half and two thirds of the track', async () => {
    await renderSlider();

    const ticks = screen.getAllByTestId('split-breakpoint');
    expect(ticks.map((tick) => tick.props.style)).toEqual([
      expect.arrayContaining([expect.objectContaining({ left: `${100 / 3}%` })]),
      expect.arrayContaining([expect.objectContaining({ left: '50%' })]),
      expect.arrayContaining([expect.objectContaining({ left: `${200 / 3}%` })]),
    ]);
  });

  it('reports a whole percent away from the breakpoints', async () => {
    const onChange = await renderSlider();

    await dragTo(78.4);

    expect(onChange).toHaveBeenLastCalledWith(78);
  });

  it('reports the breakpoint when dragged close to it', async () => {
    const onChange = await renderSlider();

    await dragTo(36.2);
    expect(onChange).toHaveBeenLastCalledWith(100 / 3);

    await dragTo(63.5);
    expect(onChange).toHaveBeenLastCalledWith(200 / 3);
  });

  it('lets the thumb follow the finger while dragging', async () => {
    await renderSlider();

    await dragTo(36.2);

    expect(slider()).toHaveProp('value', 36.2);
  });

  it('moves the thumb to the snapped value when let go', async () => {
    const onChange = await renderSlider();

    await dragTo(36.2);
    await release(36.2);

    expect(slider()).toHaveProp('value', 100 / 3);
    expect(onChange).toHaveBeenLastCalledWith(100 / 3);
  });

  it('lets go on a free value as a whole percent', async () => {
    await renderSlider();

    await dragTo(78.4);
    await release(78.4);

    expect(slider()).toHaveProp('value', 78);
  });
});
