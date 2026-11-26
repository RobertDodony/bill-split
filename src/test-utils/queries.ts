import type { RenderResult } from '@testing-library/react-native';

type TestInstance = RenderResult['container'];

/**
 * Host elements whose props match all of `props`. Use it for native props that have no
 * accessible query, such as the `title` of a native stack header or tab.
 */
export function queryAllByProps(container: TestInstance, props: Record<string, unknown>) {
  return container.queryAll((node) =>
    Object.entries(props).every(([key, value]) => node.props[key] === value)
  );
}

/** The native sliders (`@react-native-community/slider`, stood in for by `jest/mocks.js`). */
export function queryAllSliders(container: TestInstance) {
  return container.queryAll((node) => node.type === 'Slider');
}
