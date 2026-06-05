import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  useFonts as useFredoka,
} from '@expo-google-fonts/fredoka';
import { Nunito_700Bold, Nunito_800ExtraBold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { useMemo, type ReactNode } from 'react';
import {

  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppDimensions } from '../lib/useAppDimensions';
import { AppImage } from './AppImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LearningPathId } from './ChoosePathScreen';
import { UiTapPressable } from './UiTapPressable';
import HomePointsLeaf from '../assets/home-points-leaf.svg';
import LessonCompleteHill from '../assets/lesson-learn/lesson-complete-hill.svg';
import {
  lessonLearnCompleteIcons,
  lessonLearnCompleteMascot,
} from '../lib/lessonLearnAssets';
import type { LessonCompleteStep } from '../lib/lessonSteps';
import { pathThemeOf } from '../lib/pathTheme';

const FIGMA_W = 393;
const PAGE_BG = '#dcfff9';

const CheckmarkOutline = lessonLearnCompleteIcons.checkmarkOutline;
const RedoIcon = lessonLearnCompleteIcons.redo;
const RewardBookIcon = lessonLearnCompleteIcons.rewardBook;
const RewardStreakIcon = lessonLearnCompleteIcons.rewardStreak;

function r(n: number, s: number) {
  return Math.round(n * s);
}

export type LessonCompleteScreenProps = {
  learningPath: LearningPathId;
  step: LessonCompleteStep;
  seedsEarned: number;
  onContinueLearning: () => void;
  onReviewLesson: () => void;
  onExploreAyahLab: () => void;
};

export function LessonCompleteScreen({
  learningPath,
  step,
  seedsEarned,
  onContinueLearning,
  onReviewLesson,
  onExploreAyahLab,
}: LessonCompleteScreenProps) {
  const { width: W, height: H } = useAppDimensions();
  const insets = useSafeAreaInsets();
  const s = W / FIGMA_W;

  const [fredokaLoaded] = useFredoka({ Fredoka_500Medium, Fredoka_600SemiBold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });

  const theme = useMemo(() => pathThemeOf(learningPath), [learningPath]);
  const totalSeeds = step.rewards.totalSeeds ?? seedsEarned;

  if (!fredokaLoaded || !nunitoLoaded) {
    return <View style={{ flex: 1, backgroundColor: PAGE_BG }} />;
  }

  const padH = r(22, s);
  const contentW = Math.min(W - padH * 2, r(330, s));
  const bottomPad = Math.max(r(12, s), insets.bottom);
  const footerBlockH = r(40, s) + r(10, s) + r(32, s) + r(10, s) + r(32, s) + bottomPad;

  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      <View style={[StyleSheet.absoluteFill, { top: r(210, s) }]} pointerEvents="none">
        <LessonCompleteHill width={W} height={H - r(210, s)} preserveAspectRatio="none" />
      </View>

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + r(4, s),
          paddingHorizontal: padH,
          paddingBottom: footerBlockH,
        }}
      >
        <Text style={[styles.heroTitle, { fontSize: r(28, s) }]}>{step.title}</Text>
        <Text style={[styles.heroSubtitle, { fontSize: r(18, s), marginTop: r(2, s) }]}>{step.subtitle}</Text>

        <View
          style={{
            alignSelf: 'center',
            marginTop: r(8, s),
            width: r(139, s),
            height: r(152, s),
            overflow: 'hidden',
          }}
        >
          <AppImage
            source={lessonLearnCompleteMascot}
            style={{
              position: 'absolute',
              width: '127.44%',
              height: '174.18%',
              left: '-16.25%',
              top: '-31.33%',
            }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>

        <SummaryCard s={s} width={contentW} title={step.learnedTitle} marginTop={r(26, s)} compact>
          {step.learned.map((item) => (
            <BulletRow key={item} s={s} label={item} />
          ))}
        </SummaryCard>

        <SummaryCard s={s} width={contentW} title={step.canNowTitle} marginTop={r(8, s)} compact>
          {step.canNow.map((item) => (
            <CheckRow key={item} s={s} label={item} />
          ))}
        </SummaryCard>

        <RewardsCard s={s} width={contentW} step={step} totalSeeds={totalSeeds} marginTop={r(10, s)} />
      </View>

      <View style={{ position: 'absolute', left: padH, right: padH, bottom: bottomPad }}>
        <PrimaryCta s={s} theme={theme} label="Continue Learning" onPress={onContinueLearning} />
        <OutlineCta s={s} theme={theme} label="Review Lesson" onPress={onReviewLesson} marginTop={r(10, s)} />
        <AyahLabCta s={s} onPress={onExploreAyahLab} marginTop={r(10, s)} width={r(174, s)} />
      </View>
    </View>
  );
}

function SummaryCard({
  s,
  width,
  title,
  marginTop,
  compact,
  children,
}: {
  s: number;
  width: number;
  title: string;
  marginTop: number;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          width,
          alignSelf: 'center',
          marginTop,
          borderRadius: r(15, s),
          paddingHorizontal: r(18, s),
          paddingTop: r(compact ? 8 : 12, s),
          paddingBottom: r(compact ? 10 : 14, s),
        },
      ]}
    >
      <Text style={[styles.cardTitle, { fontSize: r(16, s), marginBottom: r(compact ? 6 : 10, s) }]}>{title}</Text>
      {children}
    </View>
  );
}

function BulletRow({ s, label }: { s: number; label: string }) {
  return (
    <View style={[styles.row, { marginTop: r(2, s) }]}>
      <View style={[styles.bullet, { width: r(9, s), height: r(9, s), borderRadius: r(5, s), marginTop: r(5, s) }]} />
      <Text style={[styles.rowText, { fontSize: r(14, s), lineHeight: r(18, s), marginLeft: r(10, s) }]}>{label}</Text>
    </View>
  );
}

function CheckRow({ s, label }: { s: number; label: string }) {
  return (
    <View style={[styles.row, { marginTop: r(4, s) }]}>
      <CheckmarkOutline width={r(16, s)} height={r(16, s)} style={{ marginTop: r(1, s) }} />
      <Text style={[styles.rowText, { fontSize: r(14, s), lineHeight: r(18, s), marginLeft: r(10, s) }]}>{label}</Text>
    </View>
  );
}

function RewardIconCircle({ s, children }: { s: number; children: ReactNode }) {
  const size = r(23, s);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

function RewardsCard({
  s,
  width,
  step,
  totalSeeds,
  marginTop,
}: {
  s: number;
  width: number;
  step: LessonCompleteStep;
  totalSeeds: number;
  marginTop: number;
}) {
  const seedsSize = r(70, s);
  const iconSize = r(14, s);
  const leafSize = r(19, s);

  return (
    <View
      style={[
        styles.rewardsCard,
        {
          width,
          alignSelf: 'center',
          marginTop,
          borderRadius: r(15, s),
          paddingTop: r(10, s),
          paddingBottom: r(12, s),
          paddingHorizontal: r(12, s),
          minHeight: r(120, s),
        },
      ]}
    >
      <Text style={[styles.cardTitle, { fontSize: r(16, s), textAlign: 'center', marginBottom: r(10, s) }]}>
        Your rewards
      </Text>

      <View style={styles.rewardsRow}>
        <View style={[styles.seedsCol, { width: r(84, s) }]}>
          <View
            style={[
              styles.seedsCircle,
              {
                width: seedsSize,
                height: seedsSize,
                borderRadius: seedsSize / 2,
              },
            ]}
          >
            <View
              style={[
                styles.seedsLeafSlot,
                {
                  top: r(-2, s),
                  left: (seedsSize - leafSize) / 2,
                  width: leafSize,
                  height: leafSize,
                },
              ]}
            >
              <HomePointsLeaf width={leafSize} height={leafSize} />
            </View>
            <Text
              style={[
                styles.seedsAmount,
                { fontSize: r(24, s), lineHeight: r(22, s), marginTop: r(20, s) },
              ]}
            >
              +{totalSeeds}
            </Text>
            <Text style={[styles.seedsLabel, { fontSize: r(14, s), lineHeight: r(18, s), marginTop: r(-2, s) }]}>
              Seeds
            </Text>
          </View>
        </View>

        <View style={[styles.rewardsDivider, { height: r(64, s), marginHorizontal: r(8, s) }]} />

        <View style={styles.perksCol}>
          <View style={styles.perkRow}>
            <RewardIconCircle s={s}>
              <RewardBookIcon width={iconSize} height={iconSize} />
            </RewardIconCircle>
            <Text
              style={[
                styles.perkText,
                { fontSize: r(12, s), lineHeight: r(16, s), marginLeft: r(8, s), flex: 1, minWidth: 0 },
              ]}
            >
              {step.rewards.reflectionsSaved} Reflection Saved
            </Text>
          </View>

          {step.rewards.streakMaintained ? (
            <View style={[styles.perkRow, { marginTop: r(12, s), alignItems: 'flex-start' }]}>
              <RewardIconCircle s={s}>
                <RewardStreakIcon width={iconSize} height={iconSize} />
              </RewardIconCircle>
              <View style={[styles.perkTextCol, { marginLeft: r(8, s) }]}>
                <Text style={[styles.perkText, { fontSize: r(12, s), lineHeight: r(16, s) }]}>
                  Lesson streak maintained
                </Text>
                {step.rewards.streakMessageAr ? (
                  <Text style={[styles.perkSubAr, { fontSize: r(10, s), lineHeight: r(14, s), marginTop: r(2, s) }]}>
                    {step.rewards.streakMessageAr}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function PrimaryCta({
  s,
  theme,
  label,
  onPress,
}: {
  s: number;
  theme: ReturnType<typeof pathThemeOf>;
  label: string;
  onPress: () => void;
}) {
  const depth = r(4, s);
  return (
    <UiTapPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => {
        const isDown = pressed;
        return [
          styles.primaryCta,
          {
            height: r(40, s),
            borderRadius: r(42, s),
            marginBottom: depth,
            backgroundColor: theme.primary,
            borderColor: theme.primaryDark,
            transform: [{ scale: isDown ? 0.98 : 1 }, { translateY: isDown ? depth : 0 }],
            shadowColor: theme.primaryDark,
            shadowOffset: { width: 0, height: isDown ? 0 : depth },
            shadowOpacity: isDown ? 0 : 1,
            shadowRadius: 0,
            elevation: isDown ? 0 : 4,
          },
        ];
      }}
    >
      <Text style={[styles.primaryCtaText, { fontSize: r(20, s) }]}>{label}</Text>
    </UiTapPressable>
  );
}

function OutlineCta({
  s,
  theme,
  label,
  onPress,
  marginTop,
}: {
  s: number;
  theme: ReturnType<typeof pathThemeOf>;
  label: string;
  onPress: () => void;
  marginTop: number;
}) {
  return (
    <UiTapPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.outlineCta,
        {
          marginTop,
          height: r(32, s),
          borderRadius: r(42, s),
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <RedoIcon width={r(20, s)} height={r(20, s)} />
      <Text style={[styles.outlineCtaText, { fontSize: r(16, s), marginLeft: r(8, s), color: theme.primaryDark }]}>
        {label}
      </Text>
    </UiTapPressable>
  );
}

function AyahLabCta({
  s,
  onPress,
  marginTop,
  width,
}: {
  s: number;
  onPress: () => void;
  marginTop: number;
  width: number;
}) {
  return (
    <UiTapPressable
      accessibilityRole="button"
      accessibilityLabel="Explore Ayah Lab"
      onPress={onPress}
      style={({ pressed }) => [
        styles.ayahLabCta,
        {
          marginTop,
          width,
          alignSelf: 'center',
          height: r(32, s),
          borderRadius: r(42, s),
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <HomePointsLeaf width={r(19, s)} height={r(19, s)} />
      <Text style={[styles.ayahLabText, { fontSize: r(14, s), marginLeft: r(8, s) }]}>Explore Ayah Lab</Text>
      <Text style={[styles.ayahLabChevron, { fontSize: r(19, s), marginLeft: r(6, s) }]}>›</Text>
    </UiTapPressable>
  );
}

const styles = StyleSheet.create({
  heroTitle: {
    fontFamily: 'Fredoka_600SemiBold',
    color: '#0b3b3f',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontFamily: 'Fredoka_500Medium',
    color: '#0b3b3f',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    backgroundColor: '#24c1a4',
  },
  rowText: {
    fontFamily: 'Nunito_700Bold',
    color: '#737373',
    flex: 1,
  },
  rewardsCard: {
    backgroundColor: '#c5e3df',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seedsCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seedsCircle: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    overflow: 'visible',
  },
  seedsLeafSlot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seedsAmount: {
    fontFamily: 'Fredoka_600SemiBold',
    color: '#578140',
    textAlign: 'center',
  },
  seedsLabel: {
    fontFamily: 'Fredoka_500Medium',
    color: '#006052',
    textAlign: 'center',
  },
  rewardsDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginHorizontal: 6,
  },
  perksCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: 2,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perkTextCol: {
    flex: 1,
    minWidth: 0,
  },
  perkText: {
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    flexShrink: 1,
  },
  perkSubAr: {
    fontFamily: 'Nunito_700Bold',
    color: '#737373',
  },
  primaryCta: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
  },
  outlineCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#006052',
  },
  outlineCtaText: {
    fontFamily: 'Nunito_800ExtraBold',
  },
  ayahLabCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#aeddd4',
  },
  ayahLabText: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#578140',
  },
  ayahLabChevron: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#578140',
    marginTop: Platform.OS === 'ios' ? -2 : 0,
  },
});
