import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  useFonts as useFredoka,
} from '@expo-google-fonts/fredoka';
import {
  NotoSansArabic_500Medium,
  useFonts as useNotoArabic,
} from '@expo-google-fonts/noto-sans-arabic';
import { Nunito_700Bold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,

  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppImage } from './AppImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DailyGoalPagination from '../assets/daily-goal-pagination.svg';

import { UiTapPressable } from './UiTapPressable';

/** Figma “Choose Daily Goal” — node 1137:3143 (393×852) */
const FIGMA_W = 393;
const FIGMA_H = 852;

export type DailyGoalMinutesId = 'min5' | 'min10' | 'min15' | 'min20';

type TimeCardConfig = {
  id: DailyGoalMinutesId;
  title: string;
  subtitle: [string, string];
  plant: ImageSourcePropType;
  /** Plant image layout inside card (Figma px, 150×150 card). */
  plantStyle: { left: number; top: number; width: number; height: number };
};

const TIME_OPTIONS: TimeCardConfig[] = [
  {
    id: 'min5',
    title: '5 min',
    subtitle: ['Start with', 'intention'],
    plant: require('../assets/daily-goal-plant-5min.png'),
    plantStyle: { left: 46, top: 20, width: 57, height: 60 },
  },
  {
    id: 'min10',
    title: '10 min',
    subtitle: ['Stay', 'consistent'],
    plant: require('../assets/daily-goal-plant-10min.png'),
    plantStyle: { left: 50, top: 13, width: 44, height: 64 },
  },
  {
    id: 'min15',
    title: '15 min',
    subtitle: ['Build a', 'strong habit'],
    plant: require('../assets/daily-goal-plant-15min.png'),
    plantStyle: { left: 50, top: 18, width: 49, height: 57 },
  },
  {
    id: 'min20',
    title: '20+ min',
    subtitle: ['Grow', 'with purpose'],
    plant: require('../assets/daily-goal-plant-20min.png'),
    plantStyle: { left: 50, top: 18, width: 50, height: 57 },
  },
];

const ARABIC_QUOTE =' نِيَّةُ الْمُؤْمِنِ خَيْرٌ مِنْ عَمَلِهِ';
const ENGLISH_QUOTE = 'The intention of a believer is better than his action';

type Props = {
  onContinue?: (minutes: DailyGoalMinutesId) => void;
  onSkipForNow?: () => void;
};

export function ChooseDailyGoalScreen({ onContinue, onSkipForNow }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sx = W / FIGMA_W;
  const sy = H / FIGMA_H;

  const [selected, setSelected] = useState<DailyGoalMinutesId | null>(null);

  const [fredokaLoaded] = useFredoka({ Fredoka_600SemiBold, Fredoka_500Medium });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_500Medium });
  const fontsLoaded = fredokaLoaded && nunitoLoaded && notoArLoaded;

  const onSelect = useCallback((id: DailyGoalMinutesId) => {
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

  const bgH = 797 * sy;
  const bgImageStyle = {
    position: 'absolute' as const,
    width: W * 1.1807,
    height: bgH * 1.2586,
    left: -W * 0.0763,
    top: -bgH * 0.2585,
  };

  const cardSize = 150 * sx;
  const colGap = 10 * sx;
  const gridW = cardSize * 2 + colGap;
  const rowGap = 24 * sy;
  const pillW = 65.04 * sx;
  const pillH = 62.326 * sy;
  const pillLeft = 42 * sx;
  const pillTop = 13 * sy;
  const pillRadius = 47 * sx;

  const footerBlockH =
    (49 + 3) * sy + 10 * sy + 21 * sy + Math.max(insets.bottom, 12);

  const renderTimeCard = (opt: TimeCardConfig) => {
    const isOn = selected === opt.id;
    const ps = opt.plantStyle;
    const subLine = `${opt.subtitle[0]}\n${opt.subtitle[1]}`;

    return (
      <UiTapPressable
        key={opt.id}
        onPress={() => onSelect(opt.id)}
        style={({ pressed }) => [
          {
            width: cardSize,
            height: cardSize,
            borderRadius: 27 * sx,
            backgroundColor: isOn ? '#fff4d1' : '#ffffff',
            borderWidth: 2,
            borderColor: '#7c4718',
            shadowColor: '#7c4718',
            shadowOffset: { width: 0, height: isOn ? 2 : 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: isOn ? 2 : 5,
            overflow: 'hidden',
          },
          pressed && { opacity: 0.94 },
        ]}
      >
        <View
          style={[
            styles.pill,
            {
              left: pillLeft,
              top: pillTop,
              width: pillW,
              height: pillH,
              borderRadius: pillRadius,
            },
          ]}
        />
        <AppImage
          source={opt.plant}
          style={{
            position: 'absolute',
            left: ps.left * sx,
            top: ps.top * sy,
            width: ps.width * sx,
            height: ps.height * sy,
          }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <Text
          style={[
            styles.cardTitle,
            {
              top: 83 * sy,
              fontSize: 16 * sx,
            },
          ]}
        >
          {opt.title}
        </Text>
        <Text
          style={[
            styles.cardSubtitle,
            {
              top: 106 * sy,
              fontSize: 12 * sx,
              lineHeight: Math.round(15 * sx),
            },
          ]}
        >
          {subLine}
        </Text>
      </UiTapPressable>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.bgClip, { height: bgH }]}>
        <AppImage
          source={require('../assets/daily-goal-bg.png')}
          style={bgImageStyle}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </View>

      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 8) + 12 * sy,
          paddingBottom: footerBlockH + 16 * sy,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: 70 * sx, height: 7 * sy, marginTop: 8 * sy }}>
          <DailyGoalPagination width="100%" height="100%" />
        </View>

        <Text style={[styles.titleBlock, { marginTop: 14 * sy, paddingHorizontal: 20 * sx }]}>
          <Text style={{ fontFamily: 'Fredoka_600SemiBold', color: '#000000', fontSize: 32 * sx }}>
            Let’s Set a{'\n'}
          </Text>
          <Text style={{ fontFamily: 'Fredoka_600SemiBold', color: '#fdce06', fontSize: 32 * sx }}>
            Daily Goal?
          </Text>
        </Text>

        <View
          style={[
            styles.quoteRow,
            {
              marginTop: 13 * sy,
              width: 294 * sx,
              paddingHorizontal: 4 * sx,
            },
          ]}
        >
          <AppImage
            source={require('../assets/daily-goal-ornament.png')}
            style={{ width: 16 * sx, height: 32 * sy }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text
            style={[
              styles.arabicQuote,
              {
                fontSize: 20 * sx,
                flex: 1,
                marginHorizontal: 6 * sx,
              },
            ]}
          >
            {ARABIC_QUOTE}
          </Text>
          <View style={{ transform: [{ rotate: '180deg' }, { scaleY: -1 }] }}>
            <AppImage
              source={require('../assets/daily-goal-ornament.png')}
              style={{ width: 16 * sx, height: 32 * sy }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
        </View>

        <Text
          style={[
            styles.englishQuote,
            {
              marginTop: 7 * sy,
              fontSize: 16 * sx,
              maxWidth: 221 * sx,
              lineHeight: Math.round(20 * sx),
            },
          ]}
        >
          {ENGLISH_QUOTE}
        </Text>

        <View style={{ marginTop: 32 * sy, width: gridW }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {renderTimeCard(TIME_OPTIONS[0])}
            {renderTimeCard(TIME_OPTIONS[1])}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: rowGap }}>
            {renderTimeCard(TIME_OPTIONS[2])}
            {renderTimeCard(TIME_OPTIONS[3])}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footerStack,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            paddingHorizontal: ((FIGMA_W - 310) / 2) * sx,
            pointerEvents: 'box-none',
          },
        ]}
      >
        <UiTapPressable
          onPress={handleContinue}
          disabled={!selected}
          onPressIn={onContinuePressIn}
          onPressOut={onContinuePressOut}
          style={{ width: 310 * sx, height: (49 + 3) * sy, alignSelf: 'center' }}
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
        </UiTapPressable>

        <UiTapPressable
          onPress={onSkipForNow}
          style={{ marginTop: 10 * sy, alignSelf: 'center', paddingVertical: 6 * sy }}
        >
          <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14 * sx, color: '#fdce06' }}>
            Skip for now
          </Text>
        </UiTapPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fdf3e0',
  },
  fontsFallback: {
    backgroundColor: '#fdf3e0',
  },
  bgClip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
  titleBlock: {
    textAlign: 'center',
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicQuote: {
    fontFamily: 'NotoSansArabic_500Medium',
    color: '#737373',
    textAlign: 'center',
  },
  englishQuote: {
    fontFamily: 'Fredoka_500Medium',
    color: '#737373',
    textAlign: 'center',
  },
  pill: {
    position: 'absolute',
    backgroundColor: '#ffefb1',
  },
  cardTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
    textAlign: 'center',
  },
  cardSubtitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontFamily: 'Nunito_700Bold',
    color: '#737373',
    textAlign: 'center',
  },
  footerStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 4,
    elevation: 10,
  },
});
