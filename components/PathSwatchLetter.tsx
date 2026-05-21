import { StyleSheet, Text, View } from 'react-native';

import LetterNoon from '../assets/path-letter-noon.svg';
import LetterQaf from '../assets/path-letter-qaf.svg';
import LetterSaad from '../assets/path-letter-saad.svg';
import LetterTaa from '../assets/path-letter-taa.svg';

export type PathLetterIconKey = 'noon' | 'saad' | 'taa' | 'qaf';

/** Figma 1083:2764 — 35×16 */
const SAAD_ASPECT = 35 / 16;
const SAAD_SIZE_BOOST = 1.14;

type Props = {
  letterIcon?: PathLetterIconKey;
  /** Shown when there is no SVG letter asset (optional per path). */
  letter?: string;
  width: number;
  height: number;
  /** Text glyph color on the swatch (Choose Path + Home header). */
  letterTextColor?: string;
};

/**
 * Same path-mark rendering as Choose Path swatches: SVG letters or `letter` fallback.
 */
export function PathSwatchLetter({
  letterIcon,
  letter,
  width,
  height,
  letterTextColor = '#ffffff',
}: Props) {
  if (letterIcon === 'noon') {
    return <LetterNoon width={width} height={height} />;
  }
  if (letterIcon === 'saad') {
    const slotW = width;
    const slotH = height;
    let glyphH = slotH * SAAD_SIZE_BOOST;
    let glyphW = glyphH * SAAD_ASPECT;
    if (glyphW > slotW * SAAD_SIZE_BOOST) {
      glyphW = slotW * SAAD_SIZE_BOOST;
      glyphH = glyphW / SAAD_ASPECT;
    }
    return (
      <View style={[styles.letterSlot, { width: slotW, height: slotH }]}>
        <LetterSaad width={glyphW} height={glyphH} />
      </View>
    );
  }
  if (letterIcon === 'taa') {
    return <LetterTaa width={width} height={height} />;
  }
  if (letterIcon === 'qaf') {
    return <LetterQaf width={width} height={height} />;
  }
  if (letter) {
    return (
      <Text
        style={[
          styles.fallbackLetter,
          {
            fontSize: Math.round(width * 0.72),
            lineHeight: Math.round(height * 1.05),
            color: letterTextColor,
          },
        ]}
      >
        {letter}
      </Text>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  letterSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLetter: {
    fontFamily: 'NotoSansArabic_700Bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
