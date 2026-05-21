import { forwardRef } from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps, type View } from 'react-native';

import { playUiTap } from '../lib/uiTapSound';

export type UiTapPressableProps = PressableProps & {
  /** Silence tap audio (e.g. modal backdrops); sound only plays on a completed press, not while scrolling. */
  disableUiTapSound?: boolean;
};

export const UiTapPressable = forwardRef<View, UiTapPressableProps>(function UiTapPressable(
  { onPress, onPressIn, disabled, disableUiTapSound, ...rest },
  ref,
) {
  const handlePress = (e: GestureResponderEvent) => {
    if (!disabled && !disableUiTapSound) {
      playUiTap();
    }
    onPress?.(e);
  };

  return (
    <Pressable ref={ref} {...rest} disabled={disabled} onPressIn={onPressIn} onPress={handlePress} />
  );
});
