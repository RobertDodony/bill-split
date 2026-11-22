import type { RenderResult } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

type TestInstance = RenderResult['container'];

/**
 * The element's opacity. Compare it with `toBeCloseTo`: NativeWind stores it as a 32-bit float,
 * so `opacity-60` is 0.6000000238418579.
 */
export function opacityOf(element: TestInstance): number | undefined {
  return StyleSheet.flatten(element.props.style)?.opacity as number | undefined;
}
