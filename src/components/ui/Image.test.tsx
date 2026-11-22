import { render, screen } from '@testing-library/react-native';

import { Image } from '@/components/ui/Image';

describe('Image', () => {
  it('shows the image', async () => {
    await render(<Image testID="image" source={{ uri: 'file:///r.jpg' }} />);

    expect(screen.getByTestId('image')).toHaveProp('source', [{ uri: 'file:///r.jpg' }]);
  });

  it('is styled with className', async () => {
    await render(
      <Image testID="image" source={{ uri: 'file:///r.jpg' }} className="h-40 w-full rounded-2xl" />
    );

    expect(screen.getByTestId('image')).toHaveStyle({
      height: 160,
      width: '100%',
      borderRadius: 16,
    });
  });
});
