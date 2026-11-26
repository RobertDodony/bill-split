import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { COLORS } from '@/constants/theme';
import { SPLIT_BREAKPOINTS, snapShare } from '@/utils/split';

/**
 * How far Android's native SeekBar insets its track from each edge (Material's default padding),
 * so the breakpoint ticks line up with where the thumb sits at those values.
 */
const TRACK_INSET = 16;
const TICK_WIDTH = 2;
const TICK_HEIGHT = 14;

/** Where each breakpoint's tick sits along the track. */
const TICK_POSITIONS = SPLIT_BREAKPOINTS.map((share) => ({ left: `${share}%` as const }));

export type SplitSliderProps = {
  /** R's share in percent (0–100). */
  value: number;
  /** Called with the new share, already snapped to a breakpoint or a whole percent. */
  onChange: (value: number) => void;
};

/**
 * A native slider between R (left) and K (right). The filled part from the left is R's share.
 * Near a breakpoint (⅓, ½, ⅔) the value snaps to it, and the thumb jumps there when it's let go.
 * Each breakpoint is marked with a tick across the track.
 */
export function SplitSlider({ value, onChange }: SplitSliderProps) {
  // Where the thumb is drawn. While dragging it follows the finger rather than the snapped value,
  // so it doesn't stick at breakpoints; it moves to the snapped value on release.
  const [position, setPosition] = useState(value);

  return (
    <View style={styles.row}>
      <Text variant="headlineSmall" style={[styles.letter, styles.personR]}>
        R
      </Text>
      <View style={styles.track}>
        {/* Drawn before the slider so the thumb covers a tick it's on. */}
        <View style={styles.ticks}>
          {TICK_POSITIONS.map((tick) => (
            <View key={tick.left} testID="split-breakpoint" style={[styles.tick, tick]} />
          ))}
        </View>
        <Slider
          value={position}
          minimumValue={0}
          maximumValue={100}
          minimumTrackTintColor={COLORS.personRStrong}
          maximumTrackTintColor={COLORS.personKStrong}
          thumbTintColor={COLORS.onSurface}
          onValueChange={(raw) => {
            setPosition(raw);
            onChange(snapShare(raw));
          }}
          onSlidingComplete={(raw) => setPosition(snapShare(raw))}
        />
      </View>
      <Text variant="headlineSmall" style={[styles.letter, styles.personK]}>
        K
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, justifyContent: 'center' },
  ticks: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: TRACK_INSET,
    right: TRACK_INSET,
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  tick: {
    position: 'absolute',
    width: TICK_WIDTH,
    height: TICK_HEIGHT,
    marginLeft: -TICK_WIDTH / 2,
    borderRadius: TICK_WIDTH / 2,
    backgroundColor: COLORS.onSurfaceVariant,
  },
  letter: { fontWeight: 'bold' },
  personR: { color: COLORS.personR },
  personK: { color: COLORS.personK },
});
