import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  useFonts as useFredoka,
} from '@expo-google-fonts/fredoka';
import {
  NotoSansArabic_500Medium,
  NotoSansArabic_700Bold,
  useFonts as useNotoArabic,
} from '@expo-google-fonts/noto-sans-arabic';
import { Nunito_700Bold, Nunito_800ExtraBold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { useMemo } from 'react';
import {

  ImageSourcePropType,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { AppImage } from './AppImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LessonIntroIconBack from '../assets/lesson-intro/icon-back.svg';
import LessonIntroIconBook from '../assets/lesson-intro/icon-book.svg';
import LessonIntroIconClock from '../assets/lesson-intro/icon-clock.svg';
import LessonIntroIconSeedling from '../assets/lesson-intro/icon-seedling.svg';
import type { LearningPathId } from './ChoosePathScreen';
import { lessonFlowCtaA11yLabel, lessonFlowCtaLabel } from '../lib/lessonCopy';
import { defaultLessonHeroBackground } from '../lib/lessonIntroAssets';
import { buildLessonIntroModel, getDefaultLessonIntro, type LessonIntroModel } from '../lib/lessonIntroDefaults';
import { getLessonAtIndices } from '../lib/loadUnits';
import { pathThemeOf } from '../lib/pathTheme';

import { UiTapPressable } from './UiTapPressable';

const FIGMA_W = 393;

function r(n: number, s: number) {
  return Math.round(n * s);
}

const textPad = Platform.select({ android: { includeFontPadding: false as const }, default: {} });

export type LessonIntroScreenProps = {
  learningPath: LearningPathId;
  /** Indices into bundled `*_units.json` for this path (same as home resume). */
  unitIndex?: number;
  lessonIndex?: number;
  /** Matches home resume CTA: Bismillah vs Resume. */
  isNewUser?: boolean;
  /** Optional per-lesson hero; defaults by path in `defaultLessonHeroBackground`. */
  heroBackground?: ImageSourcePropType;
  /** When set, overrides copy built from JSON + defaults. */
  lesson?: LessonIntroModel;
  onBack: () => void;
  onBegin: () => void;
};

export function LessonIntroScreen({
  learningPath,
  unitIndex = 0,
  lessonIndex = 0,
  isNewUser = true,
  heroBackground,
  lesson: lessonProp,
  onBack,
  onBegin,
}: LessonIntroScreenProps) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const s = W / FIGMA_W;

  const [fredokaLoaded] = useFredoka({ Fredoka_500Medium, Fredoka_600SemiBold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_500Medium, NotoSansArabic_700Bold });

  const theme = useMemo(() => pathThemeOf(learningPath), [learningPath]);
  const heroSource = heroBackground ?? defaultLessonHeroBackground(learningPath);
  const descColors = useMemo(() => ({ muted: '#737373', accent: theme.primaryDark }), [theme.primaryDark]);

  const lesson = useMemo(() => {
    if (lessonProp) return lessonProp;
    const hit = getLessonAtIndices(learningPath, unitIndex, lessonIndex);
    if (hit) {
      return buildLessonIntroModel(learningPath, unitIndex, lessonIndex, hit.unit, hit.lesson, descColors);
    }
    return getDefaultLessonIntro(learningPath, descColors);
  }, [lessonProp, learningPath, unitIndex, lessonIndex, descColors]);

  const ctaLabel = lessonFlowCtaLabel(isNewUser);
  const ctaA11y = lessonFlowCtaA11yLabel(isNewUser);

  const heroHeight = Math.min(H * 0.46, W * 1.15);

  const cardShadow: ViewStyle =
    Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 4 },
      default: {},
    }) ?? {};

  const backShadow: ViewStyle =
    Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
      android: { elevation: 3 },
      default: {},
    }) ?? {};

  if (!fredokaLoaded || !nunitoLoaded || !notoArLoaded) {
    return <View style={styles.root} />;
  }

  const iconSize = r(35, s);
  const padH = r(23, s);
  const ctaBottom = Math.max(r(16, s), insets.bottom);

  return (
    <View style={styles.root}>
      <View style={{ height: heroHeight + insets.top }}>
        <AppImage
          source={heroSource}
          style={[styles.heroImage, { height: heroHeight + insets.top + r(40, s), top: -insets.top }]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />

        <UiTapPressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backFab,
            {
              top: insets.top + r(8, s),
              left: r(23, s),
              width: r(40, s),
              height: r(40, s),
              borderRadius: r(20, s),
              opacity: pressed ? 0.85 : 1,
              ...backShadow,
            },
          ]}
        >
          <LessonIntroIconBack width={r(22, s)} height={r(22, s)} />
        </UiTapPressable>
      </View>

      <View
        style={[
          styles.sheet,
          {
            marginTop: -r(24, s),
            borderTopLeftRadius: r(30, s),
            borderTopRightRadius: r(30, s),
            borderBottomLeftRadius: r(10, s),
            borderBottomRightRadius: r(10, s),
            paddingHorizontal: padH,
            paddingTop: r(28, s),
            paddingBottom: ctaBottom,
            ...cardShadow,
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: r(12, s) }}>
          <Text style={[styles.unitMeta, { fontSize: r(15, s), color: theme.primaryDark }]}>
            {lesson.unitDisplay}
            <Text style={{ color: theme.primaryDark }}>{' \u00b7 '}</Text>
            {lesson.lessonDisplay}
          </Text>

          <Text style={[styles.titleEn, { fontSize: r(25, s), lineHeight: r(30, s), marginTop: r(6, s) }]}>{lesson.titleEn}</Text>

          <Text
            style={[
              styles.titleAr,
              { fontSize: r(22, s), lineHeight: r(-2, s), marginTop: r(0, s), color: theme.primaryDark, ...textPad },
            ]}
          >
            {lesson.titleAr}
          </Text>

          <View style={{ marginTop: r(14, s) }}>{lesson.description}</View>

          <View
            style={[
              styles.statsCard,
              {
                marginTop: r(20, s),
                borderRadius: r(15, s),
                paddingVertical: r(14, s),
                paddingHorizontal: r(8, s),
              },
            ]}
          >
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <LessonIntroIconSeedling width={iconSize} height={iconSize} />
                <Text style={[styles.statValue, { fontSize: r(15, s), marginTop: r(4, s) }]}>{lesson.levelLabel}</Text>
                <Text style={[styles.statHint, { fontSize: r(13, s), marginTop: r(2, s) }]}>Level</Text>
              </View>
              <View style={[styles.statDivider, { height: r(56, s) }]} />
              <View style={styles.statCol}>
                <LessonIntroIconClock width={iconSize} height={iconSize} />
                <Text style={[styles.statValue, { fontSize: r(15, s), marginTop: r(4, s) }]}>{lesson.estTimeLabel}</Text>
                <Text style={[styles.statHint, { fontSize: r(13, s), marginTop: r(2, s) }]}>Est. time</Text>
              </View>
              <View style={[styles.statDivider, { height: r(56, s) }]} />
              <View style={styles.statCol}>
                <LessonIntroIconBook width={iconSize} height={iconSize} />
                <Text style={[styles.statValue, { fontSize: r(15, s), marginTop: r(4, s) }]}>{lesson.conceptsLabel}</Text>
                <Text style={[styles.statHint, { fontSize: r(13, s), marginTop: r(2, s) }]}>In this lesson</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <UiTapPressable
          accessibilityRole="button"
          accessibilityLabel={ctaA11y}
          onPress={onBegin}
          style={({ pressed }) => [
            styles.cta,
            {
              marginTop: r(16, s),
              borderRadius: r(42, s),
              paddingVertical: r(14, s),
              backgroundColor: theme.primary,
              borderColor: theme.primaryDark,
              transform: [{ scale: pressed ? 0.98 : 1 }, { translateY: pressed ? 1 : 0 }],
              shadowOpacity: pressed ? 0 : 1,
            },
          ]}
        >
          <Text style={[styles.ctaText, { fontSize: r(18, s) }]}>{ctaLabel}</Text>
        </UiTapPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff8e8',
  },
  heroImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    opacity: 0.65,
  },
  backFab: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
  },
  unitMeta: {
    fontFamily: 'Fredoka_600SemiBold',
  },
  titleEn: {
    fontFamily: 'Fredoka_600SemiBold',
    color: '#000',
  },
  titleAr: {
    fontFamily: 'NotoSansArabic_700Bold',
  },
  statsCard: {
    backgroundColor: '#f5f4ec',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center',
  },
  statValue: {
    fontFamily: 'Fredoka_600SemiBold',
    color: '#000',
    textAlign: 'center',
  },
  statHint: {
    fontFamily: 'Nunito_700Bold',
    color: '#4a5565',
    textAlign: 'center',
  },
  cta: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#104e53',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 0,
    elevation: 2,
  },
  ctaText: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
    textAlign: 'center',
  },
});
