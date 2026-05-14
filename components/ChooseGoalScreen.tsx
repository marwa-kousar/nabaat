import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  useFonts as useFredoka,
} from '@expo-google-fonts/fredoka';
import { Nunito_700Bold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { useCallback, useRef, useState, type ComponentType } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import IconBooks from '../assets/goal-icon-books.svg';
import IconGame from '../assets/goal-icon-game.svg';
import IconQuran from '../assets/goal-icon-quran.svg';
import IconSearch from '../assets/goal-icon-search.svg';
import GoalPagination from '../assets/goal-pagination.svg';

/** Figma “Choose Goal Screen” — node 1101:2831 (393×852) */
const FIGMA_W = 393;
const FIGMA_H = 852;

export type LearningGoalId =
  | 'understandQuran'
  | 'academicStudy'
  | 'classicalTexts'
  | 'justForFun';

type GoalOption = {
  id: LearningGoalId;
  title: string;
  subtitle: string;
  swatch: string;
  /** Card body fill when this row is selected. */
  selectedFill: string;
  Icon: ComponentType<{ width: number; height: number }>;
  iconW: number;
  iconH: number;
};

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'understandQuran',
    title: 'Understand Qur’an',
    subtitle: 'Read with comprehension',
    swatch: '#e7f5ee',
    selectedFill: '#bfe8d6',
    Icon: IconQuran,
    iconW: 22,
    iconH: 25,
  },
  {
    id: 'academicStudy',
    title: 'Academic Study',
    subtitle: 'Deepen your knowledge',
    swatch: '#feeadc',
    selectedFill: '#ffd4b8',
    Icon: IconSearch,
    iconW: 26,
    iconH: 26,
  },
  {
    id: 'classicalTexts',
    title: 'Classical Texts',
    subtitle: 'Explore timeless works',
    swatch: '#eeebfa',
    selectedFill: '#d4c9f5',
    Icon: IconBooks,
    iconW: 31,
    iconH: 31,
  },
  {
    id: 'justForFun',
    title: 'Just For Fun',
    subtitle: 'Learn for enjoyment',
    swatch: '#fdefd9',
    selectedFill: '#fce0a8',
    Icon: IconGame,
    iconW: 23.0833,
    iconH: 20.4316,
  },
];

type Props = {
  onSkip?: () => void;
  onContinue?: (goal: LearningGoalId) => void;
};

export function ChooseGoalScreen({ onSkip, onContinue }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sx = W / FIGMA_W;
  const sy = H / FIGMA_H;

  const [selected, setSelected] = useState<LearningGoalId | null>(null);

  const [fredokaLoaded] = useFredoka({ Fredoka_600SemiBold, Fredoka_500Medium });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold });
  const fontsLoaded = fredokaLoaded && nunitoLoaded;

  const onSelect = useCallback((id: LearningGoalId) => {
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
    Animated.spring(continueBtnAnim, {
      toValue: 0,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  if (!fontsLoaded) {
    return <View style={[styles.root, styles.fontsFallback]} />;
  }

  const cardW = 320 * sx;
  const cardH = 88 * sy;
  const swatchW = 0.1531 * 320 * sx;
  const swatchH = 0.5568 * 88 * sy;
  const swatchLeft = 0.0563 * 320 * sx;
  const swatchTop = 0.2273 * 88 * sy;
  const textLeft = 0.2438 * 320 * sx;

  const iconScale = Math.min(swatchW / 49, swatchH / 49) * 0.92;

  const footerBottom = Math.max(insets.bottom, 12) + (FIGMA_H - 766 - 49) * sy;

  return (
    <View style={styles.root}>
      <Image
        source={require('../assets/goal-bg.png')}
        style={[styles.goalBg, { top: 1 * sy, height: 850 * sy, opacity: 0.49 }]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />

      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 8) + 12 * sy,
          paddingBottom: footerBottom + 49 * sy + 24 * sy,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: 70 * sx, height: 7 * sy, marginTop: 8 * sy }}>
          <GoalPagination width="100%" height="100%" />
        </View>

        <Text style={[styles.title, { marginTop: 14 * sy, paddingHorizontal: 20 * sx }]}>
          <Text style={{ fontFamily: 'Fredoka_600SemiBold', color: '#000000', fontSize: 32 * sx }}>
            What’s Your{' '}
          </Text>
          <Text style={{ fontFamily: 'Fredoka_600SemiBold', color: '#24c1a4', fontSize: 32 * sx }}>
            Goal?
          </Text>
        </Text>

        <Text
          style={{
            marginTop: 12 * sy,
            fontFamily: 'Fredoka_500Medium',
            fontSize: 16 * sx,
            color: '#737373',
            textAlign: 'center',
            maxWidth: 280 * sx,
            lineHeight: Math.round(22 * sx),
          }}
        >
          This helps us personalize your experience
        </Text>

        {/*
          Choose Path uses 100×sy before cards with Nabta overlaid (no layout height).
          Here Mateen is in-flow (~110×sy, −19×sy overlap ⇒ +91×sy). Use a shorter spacer so
          the first card sits near the same vertical position: 100 − 91 ≈ 9×sy.
        */}
        <View style={{ height: 9 * sy }} />

        {/*
          Mateen inside scroll: native ScrollView layers hide sibling overlays.
          zIndex/elevation keep it above the first card (Figma ~19px overlap).
        */}
        <View
          style={[
            styles.mateenRow,
            {
              width: cardW,
              marginTop: -6 * sy,
              marginBottom: -19 * sy,
              zIndex: 10,
              elevation: 12,
              pointerEvents: 'box-none',
            },
          ]}
        >
          <Image
            source={require('../assets/mateen-sitting-goal.png')}
            style={{ width: 82 * sx, height: 110 * sy }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            accessibilityLabel="Mateen mascot"
          />
        </View>

        {GOAL_OPTIONS.map((opt, index) => {
          const isOn = selected === opt.id;
          const Icon = opt.Icon;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              style={({ pressed }) => [
                {
                  width: cardW,
                  height: cardH,
                  marginBottom: index < GOAL_OPTIONS.length - 1 ? 21 * sy : 30 * sy,
                  zIndex: index === 0 ? 1 : 2,
                  shadowColor: '#7c4718',
                  shadowOffset: { width: 0, height: isOn ? 0 : 2 },
                  shadowOpacity: isOn ? 0 : 1,
                  shadowRadius: 0,
                  elevation: isOn ? 0 : index === 0 ? 4 : 5,
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
                {opt.id === 'academicStudy' ? (
                  <View style={{ transform: [{ rotate: '180deg' }, { scaleY: -1 }] }}>
                    <Icon width={opt.iconW * iconScale} height={opt.iconH * iconScale} />
                  </View>
                ) : (
                  <Icon width={opt.iconW * iconScale} height={opt.iconH * iconScale} />
                )}
              </View>
              <View
                style={{
                  position: 'absolute',
                  left: textLeft,
                  right: 52 * sx,
                  top: 0.2159 * cardH,
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: 16 * sx,
                    color: '#000000',
                  }}
                >
                  {opt.title}
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
              <Text style={[styles.chevron, { right: 18 * sx, fontSize: 28 * sx }]}>›</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { bottom: footerBottom, paddingHorizontal: 22 * sx, pointerEvents: 'box-none' }]}>
        <Pressable
          onPress={onSkip}
          style={({ pressed }) => [
            styles.skipBtn,
            { width: 164 * sx, height: 49 * sy, borderRadius: 10 * sx },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={[styles.skipLabel, { fontSize: 16 * sx }]}>Skip</Text>
        </Pressable>

        <Pressable
          onPress={handleContinue}
          disabled={!selected}
          onPressIn={onContinuePressIn}
          onPressOut={onContinuePressOut}
          style={{ width: 166 * sx, height: (49 + 3) * sy }}
        >
          {selected && (
            <View
              style={{
                position: 'absolute',
                top: 3 * sy,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 10 * sx,
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
              borderRadius: 10 * sx,
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
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#eefffc',
  },
  fontsFallback: {
    backgroundColor: '#eefffc',
  },
  mateenRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
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
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 4,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#626262',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLabel: {
    fontFamily: 'Nunito_700Bold',
    color: '#666464',
  },
});
