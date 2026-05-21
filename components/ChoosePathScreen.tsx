import {
  Fredoka_600SemiBold,
  useFonts as useFredoka,
} from '@expo-google-fonts/fredoka';
import {
  NotoSansArabic_700Bold,
  useFonts as useNotoArabic,
} from '@expo-google-fonts/noto-sans-arabic';
import { Nunito_700Bold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,

  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppImage } from './AppImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg, { Path } from 'react-native-svg';

import { UiTapPressable } from './UiTapPressable';

import NabtaSitting from '../assets/nabta-sitting.svg';
import PathPagination from '../assets/path-pagination.svg';
import { PathSwatchLetter } from './PathSwatchLetter';

/** Figma “Choose Path Screen” — node 922:9298 (393×852) */
const FIGMA_W = 393;
const FIGMA_H = 852;

/** Swatch letter SVG / text scale (was 0.78; smaller reads closer to Figma). */
const LETTER_IN_SWATCH = 0.64;

export type LearningPathId = 'nahw' | 'sarf' | 'tajweed' | 'qaida';

/** Figma letter marks: 1354:5800 noon, 1083:2764 saad, 1354:5798 taa, 1354:5799 qaf */
type LetterIconKey = 'noon' | 'saad' | 'taa' | 'qaf';

export const PATH_OPTIONS: Array<{
  id: LearningPathId;
  titleEn: string;
  titleAr: string;
  subtitle: string;
  swatch: string;
  /** Card body fill when this row is selected. */
  selectedFill: string;
  /** Custom SVG in swatch (Figma components). */
  letterIcon?: LetterIconKey;
  /** Fallback text glyph when no `letterIcon` (rare; prefer adding an SVG). */
  letter?: string;
}> = [
  {
    id: 'nahw',
    titleEn: 'Nahw',
    titleAr: 'النَّحْوُ',
    subtitle: 'Grammar & Sentences',
    swatch: '#24c1a4',
    selectedFill: '#c5f0e6',
    letterIcon: 'noon',
  },
  {
    id: 'sarf',
    titleEn: 'Sarf',
    titleAr: 'الصَّرْفُ',
    subtitle: 'Word Patterns & Morphology',
    swatch: '#d76700',
    selectedFill: '#ffe3c9',
    letterIcon: 'saad',
  },
  {
    id: 'tajweed',
    titleEn: 'Tajweed',
    titleAr: 'التَّجْوِيدُ',
    subtitle: 'Qur’an Recitation Rules',
    swatch: '#9a69fe',
    selectedFill: '#e8deff',
    letterIcon: 'taa',
  },
  {
    id: 'qaida',
    titleEn: 'Qa’ida',
    titleAr: 'الْقَاعِدَةُ',
    subtitle: 'Arabic Letters & Foundations',
    swatch: '#e3c802',
    selectedFill: '#faf0b8',
    letterIcon: 'qaf',
  },
];

type Props = {
  onContinue?: (path: LearningPathId) => void;
};

export function ChoosePathScreen({ onContinue }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sx = W / FIGMA_W;
  const sy = H / FIGMA_H;

  const [selected, setSelected] = useState<LearningPathId | null>(null);

  const [fredokaLoaded] = useFredoka({ Fredoka_600SemiBold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_700Bold });
  const fontsLoaded = fredokaLoaded && nunitoLoaded && notoArLoaded;

  const onSelect = useCallback((id: LearningPathId) => {
    setSelected((prev) => (prev === id ? null : id));
  }, []);

  const handleContinue = useCallback(() => {
    if (selected) onContinue?.(selected);
  }, [onContinue, selected]);

  const continueBtnAnim = useRef(new Animated.Value(0)).current;
  const continueBtnTranslateY = continueBtnAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3 * sy],
  });
  const onContinuePressIn = () => {
    if (!selected) return;
    Animated.timing(continueBtnAnim, { toValue: 1, duration: 60, useNativeDriver: true }).start();
  };
  const onContinuePressOut = () => {
    Animated.spring(continueBtnAnim, { toValue: 0, tension: 300, friction: 20, useNativeDriver: true }).start();
  };

  if (!fontsLoaded) {
    return <View style={[styles.root, styles.fontsFallback]} />;
  }

  const mascotCenterY = H / 2 - 178 * sy;
  const mascotTop = mascotCenterY - (118 / 2) * sy;
  const mascotLeft = W / 2 - (112 / 2) * sx;

  const cardW = 320 * sx;
  const cardH = 88 * sy;
  const swatchW = 0.1531 * 320 * sx;
  const swatchH = 0.5568 * 88 * sy;
  const swatchLeft = 0.0563 * 320 * sx;
  const swatchTop = 0.2273 * 88 * sy;
  const textLeft = 0.2438 * 320 * sx;
  const letterIconW = swatchW * LETTER_IN_SWATCH;
  const letterIconH = swatchH * LETTER_IN_SWATCH;

  return (
    <View style={styles.root}>
      <View style={[styles.bottomDecor, { height: 237 * sy, pointerEvents: 'none' }]}>
        <View style={styles.bottomDecorClip}>
          <AppImage
            source={require('../assets/path-selector-bottom.png')}
            style={styles.bottomDecorImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
      </View>

      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 8) + 12 * sy,
          paddingBottom: Math.max(insets.bottom + 16, 40),
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: 70 * sx, height: 7 * sy, marginTop: 8 * sy }}>
          <PathPagination width="100%" height="100%" />
        </View>

        <Text style={[styles.title, { marginTop: 14 * sy, paddingHorizontal: 20 * sx }]}>
          <Text style={{ fontFamily: 'Fredoka_600SemiBold', color: '#000000', fontSize: 32 * sx }}>
            What brings you to{' '}
          </Text>
          <Text style={{ fontFamily: 'Fredoka_600SemiBold', color: '#ff8c1a', fontSize: 32 * sx }}>
            Nabaat?
          </Text>
        </Text>

        <Text
          style={{
            marginTop: 12 * sy,
            fontFamily: 'Nunito_700Bold',
            fontSize: 16 * sx,
            color: '#737373',
            textAlign: 'center',
            maxWidth: 280 * sx,
          }}
        >
          Choose what you would like to grow in
        </Text>

        <View style={{ height: 78 * sy }} />

        {PATH_OPTIONS.map((opt, index) => {
          const isOn = selected === opt.id;
          return (
            <UiTapPressable
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              style={({ pressed }) => [
                {
                  width: cardW,
                  height: cardH,
                  marginBottom: index < PATH_OPTIONS.length - 1 ? 21 * sy : 30 * sy,
                  shadowColor: '#7c4718',
                  shadowOffset: { width: 0, height: isOn ? 0 : 2 },
                  shadowOpacity: isOn ? 0 : 1,
                  shadowRadius: 0,
                  elevation: isOn ? 0 : 3,
                },
                pressed && { opacity: 0.92 },
              ]}
            >
              <Svg
                style={StyleSheet.absoluteFillObject}
                viewBox="0 0 320 88"
                fill="none"
                preserveAspectRatio="none"
              >
                <Path
                  d="M27 1.5H293C307.083 1.5 318.5 12.9167 318.5 27V61C318.5 75.0833 307.083 86.5 293 86.5H27C12.9167 86.5 1.5 75.0833 1.5 61V27C1.5 12.9167 12.9167 1.5 27 1.5Z"
                  fill={isOn ? opt.selectedFill : '#ffffff'}
                  stroke="#7C4718"
                  strokeWidth={3}
                />
              </Svg>
              <View
                style={[
                  styles.swatch,
                  {
                    left: swatchLeft,
                    top: swatchTop,
                    width: swatchW,
                    height: swatchH,
                    backgroundColor: opt.swatch,
                  },
                ]}
              >
                <PathSwatchLetter letterIcon={opt.letterIcon} letter={opt.letter} width={letterIconW} height={letterIconH} />
              </View>
              <View
                style={{
                  position: 'absolute',
                  left: textLeft,
                  right: 52 * sx,
                  top: 0,
                  bottom: 0,
                  justifyContent: 'center',
                }}
              >
                <Text>
                  <Text
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      fontSize: 16 * sx,
                      color: '#000000',
                    }}
                  >
                    {opt.titleEn}{' '}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'NotoSansArabic_700Bold',
                      fontSize: 16 * sx,
                      color: '#737373',
                    }}
                  >
                    ({opt.titleAr})
                  </Text>
                </Text>
                <Text
                  style={{
                    marginTop: 4 * sy,
                    fontFamily: 'Nunito_700Bold',
                    fontSize: 12 * sx,
                    color: '#737373',
                  }}
                >
                  {opt.subtitle}
                </Text>
              </View>
              <View style={{ position: 'absolute', right: 18 * sx, top: 0, bottom: 0, justifyContent: 'center' }}>
                <Text style={{ fontSize: 28 * sx, fontWeight: '700', color: '#7c4718' }}>›</Text>
              </View>
            </UiTapPressable>
          );
        })}

        <UiTapPressable
          onPress={handleContinue}
          disabled={!selected}
          onPressIn={onContinuePressIn}
          onPressOut={onContinuePressOut}
          style={{ width: cardW, height: (49 + 3) * sy }}
        >
          {selected && (
            <View
              style={{
                position: 'absolute',
                top: 3 * sy,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 10,
                backgroundColor: '#7c4718',
              }}
            />
          )}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 49 * sy,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? '#ff8c1a' : '#ababab',
              borderWidth: selected ? 1 : 0,
              borderColor: '#7c4718',
              transform: [{ translateY: continueBtnTranslateY }],
            }}
          >
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 16 * sx, color: '#ffffff' }}>
              Continue
            </Text>
          </Animated.View>
        </UiTapPressable>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: mascotLeft,
          top: mascotTop,
          width: 112 * sx,
          height: 125 * sy,
          pointerEvents: 'none',
        }}
      >
        <NabtaSitting width="100%" height="100%" />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff8e8',
  },
  fontsFallback: {
    backgroundColor: '#fff8e8',
  },
  title: {
    textAlign: 'center',
  },
  swatch: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  chevron: {
    position: 'absolute',
    top: '36%',
    fontWeight: '700',
    color: '#7c4718',
  },
  bottomDecor: {
    position: 'absolute',
    left: -1,
    right: -1,
    bottom: 0,
    overflow: 'hidden',
  },
  bottomDecorClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bottomDecorImage: {
    position: 'absolute',
    width: '433%',
    height: '479%',
    left: '-4.2%',
    top: '-372%',
  },
});
