import { useCallback, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { lessonLearnIcons } from '../lib/lessonLearnAssets';
import {
  playLessonSentenceAudio,
  stopLessonSentenceAudio,
  type LessonSentenceAudioInput,
} from '../lib/lessonSentenceAudio';
import type { ArabicTextSegment } from '../lib/lessonSteps';
import { UiTapPressable } from './UiTapPressable';

const SoundCircle = lessonLearnIcons.soundCircle;
const SoundIcon = lessonLearnIcons.sound;

export type LessonSentenceAudioButtonProps = {
  s: number;
  sourceId: string;
  phrase: LessonSentenceAudioInput & { translation: string; arabicSegments?: ArabicTextSegment[] };
  style?: StyleProp<ViewStyle>;
};

export function LessonSentenceAudioButton({
  s,
  sourceId,
  phrase,
  style,
}: LessonSentenceAudioButtonProps) {
  const r = (n: number) => Math.round(n * s);
  const [busy, setBusy] = useState(false);

  const onPress = useCallback(() => {
    if (busy) {
      stopLessonSentenceAudio({ sourceId });
      setBusy(false);
      return;
    }
    setBusy(true);
    void playLessonSentenceAudio(
      {
        arabic: phrase.arabic,
        audioKey: phrase.audioKey,
        audioUri: phrase.audioUri,
        arabicSegments: phrase.arabicSegments,
      },
      { sourceId },
    ).finally(() => setBusy(false));
  }, [busy, sourceId, phrase.arabic, phrase.arabicSegments, phrase.audioKey, phrase.audioUri]);

  const size = r(23);
  const icon = r(14);

  return (
    <UiTapPressable
      accessibilityRole="button"
      accessibilityLabel={`Play audio for ${phrase.translation}`}
      accessibilityState={{ busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed || busy ? 0.7 : 1 }, style]}
    >
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <SoundCircle width={size} height={size} style={StyleSheet.absoluteFillObject} />
        <SoundIcon width={icon} height={icon} />
      </View>
    </UiTapPressable>
  );
}
