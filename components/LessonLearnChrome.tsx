import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { LessonArabicLine } from './LessonArabicLine';
import { LessonSentenceAudioButton } from './LessonSentenceAudioButton';
import { useLessonListeningWordIndex } from './useLessonListeningWordIndex';
import { UiTapPressable } from './UiTapPressable';
import HomePointsLeaf from '../assets/home-points-leaf.svg';
import { lessonLearnIcons } from '../lib/lessonLearnAssets';
import type { LessonSentenceCard } from '../lib/lessonSteps';
import type { PathTheme } from '../lib/pathTheme';

const CloseIcon = lessonLearnIcons.close;
export const LESSON_LEARN_PAGE_BG = '#fef9f5';
export const LESSON_PROGRESS_TRACK = '#ebe1d7';

const VS_CIRCLE = '#F3E7CF';

const textPad = Platform.select({ android: { includeFontPadding: false as const }, default: {} });

export function lessonLearnCloseShadow(s: number): ViewStyle {
  return (
    Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: Math.round(3 * s) },
        shadowOpacity: 0.2,
        shadowRadius: Math.round(2 * s),
      },
      android: { elevation: 3 },
      default: {},
    }) ?? {}
  );
}

type LessonSeedsPillProps = {
  s: number;
  theme: PathTheme;
  seedsEarned: number;
  /** When set (e.g. step just awarded points), celebrate immediately in the header. */
  pendingGain?: number;
  style?: StyleProp<ViewStyle>;
};

/** Header seeds counter — pulses and shows a brief +N float when points are earned. */
export function LessonSeedsPill({ s, theme, seedsEarned, pendingGain = 0, style }: LessonSeedsPillProps) {
  const r = (n: number) => Math.round(n * s);
  const prevSeeds = useRef(seedsEarned);
  const celebratedPending = useRef(0);
  const pillScale = useRef(new Animated.Value(1)).current;
  const popOpacity = useRef(new Animated.Value(0)).current;
  const popY = useRef(new Animated.Value(0)).current;
  const [gainLabel, setGainLabel] = useState<string | null>(null);

  const displaySeeds = seedsEarned + (pendingGain > 0 ? pendingGain : 0);

  const runGainCelebrate = useCallback(
    (delta: number) => {
      if (delta <= 0) return;

      setGainLabel(`+${delta}`);
      pillScale.setValue(1);
      popOpacity.setValue(1);
      popY.setValue(0);

      Animated.parallel([
        Animated.sequence([
          Animated.spring(pillScale, {
            toValue: 1.18,
            tension: 220,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(pillScale, {
            toValue: 1,
            tension: 300,
            friction: 14,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(popY, { toValue: -r(20), duration: 500, useNativeDriver: true }),
          Animated.timing(popOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
      ]).start(({ finished }) => {
        if (finished) setGainLabel(null);
      });
    },
    [pillScale, popOpacity, popY, s],
  );

  useEffect(() => {
    if (pendingGain <= 0) {
      celebratedPending.current = 0;
      return;
    }
    if (celebratedPending.current === pendingGain) return;
    celebratedPending.current = pendingGain;
    runGainCelebrate(pendingGain);
  }, [pendingGain, runGainCelebrate]);

  useEffect(() => {
    const delta = seedsEarned - prevSeeds.current;
    prevSeeds.current = seedsEarned;
    if (delta <= 0) return;
    if (celebratedPending.current === delta) {
      celebratedPending.current = 0;
      return;
    }
    runGainCelebrate(delta);
  }, [seedsEarned, runGainCelebrate]);

  return (
    <View style={[{ marginLeft: r(12) }, style]}>
      {gainLabel ? (
        <Animated.Text
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: r(4),
            top: -r(4),
            zIndex: 2,
            opacity: popOpacity,
            transform: [{ translateY: popY }],
            fontFamily: 'Nunito_800ExtraBold',
            fontSize: r(14),
            color: theme.primary,
          }}
        >
          {gainLabel}
        </Animated.Text>
      ) : null}
      <Animated.View
        style={[
          chromeStyles.seedsPill,
          {
            height: r(30),
            minWidth: r(49),
            borderRadius: r(15),
            borderColor: theme.primaryDark,
            paddingHorizontal: r(8),
            transform: [{ scale: pillScale }],
          },
        ]}
      >
        <HomePointsLeaf width={r(17)} height={r(17)} />
        <Text
          style={{
            fontFamily: 'Nunito_800ExtraBold',
            fontSize: r(17),
            color: theme.primaryDark,
            marginLeft: r(4),
          }}
        >
          {displaySeeds}
        </Text>
      </Animated.View>
    </View>
  );
}

type LessonRewardPillProps = {
  s: number;
  amount: number;
  style?: StyleProp<ViewStyle>;
};

/** +N seeds badge on feedback cards — pops in when the user earns points. */
export function LessonRewardPill({ s, amount, style }: LessonRewardPillProps) {
  const r = (n: number) => Math.round(n * s);
  const scale = useRef(new Animated.Value(0.55)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 280,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View
      style={[
        chromeStyles.rewardPill,
        {
          width: r(41),
          height: r(53),
          borderRadius: r(70),
          opacity,
          transform: [{ scale }],
        },
        style,
      ]}
    >
      <HomePointsLeaf width={r(13)} height={r(13)} />
      <Text
        style={{
          fontFamily: 'Fredoka_600SemiBold',
          fontSize: r(12),
          color: '#578140',
          marginTop: r(2),
        }}
      >
        +{amount}
      </Text>
      <Text style={{ fontFamily: 'Fredoka_500Medium', fontSize: r(8), color: '#578140' }}>Seeds</Text>
    </Animated.View>
  );
}

type LessonLearnHeaderProps = {
  s: number;
  theme: PathTheme;
  progressFrac: number;
  seedsEarned: number;
  pendingGain?: number;
  onExit: () => void;
};

export function LessonLearnHeader({ s, theme, progressFrac, seedsEarned, pendingGain, onExit }: LessonLearnHeaderProps) {
  const r = (n: number) => Math.round(n * s);
  const progressFillW = Math.max(r(12), Math.round(progressFrac * r(244)));

  return (
    <View style={[chromeStyles.headerRow, { paddingHorizontal: r(19), marginTop: r(10), minHeight: r(40) }]}>
      <UiTapPressable
        accessibilityRole="button"
        accessibilityLabel="Exit lesson"
        onPress={onExit}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, marginRight: r(12) }]}
      >
        <View
          style={[
            chromeStyles.closeFab,
            { width: r(40), height: r(40), borderRadius: r(20), ...lessonLearnCloseShadow(s) },
          ]}
        >
          <CloseIcon width={r(24)} height={r(24)} />
        </View>
      </UiTapPressable>

      <View
        style={[
          chromeStyles.progressTrack,
          {
            flex: 1,
            maxWidth: r(244),
            height: r(11),
            borderRadius: r(20),
            backgroundColor: LESSON_PROGRESS_TRACK,
          },
        ]}
        accessibilityRole="progressbar"
      >
        {progressFrac > 0 ? (
          <>
            <View
              style={[
                chromeStyles.progressFill,
                { width: progressFillW, borderRadius: r(20), backgroundColor: theme.primary },
              ]}
            />
            <View
              style={[
                chromeStyles.progressSheen,
                {
                  width: Math.max(r(8), Math.round(progressFillW * 0.94)),
                  height: r(2),
                  top: r(2),
                  left: r(2),
                  borderRadius: r(3),
                  backgroundColor: theme.progressSheen,
                },
              ]}
            />
          </>
        ) : null}
      </View>

      <LessonSeedsPill s={s} theme={theme} seedsEarned={seedsEarned} pendingGain={pendingGain} />
    </View>
  );
}

export function LessonLearnHeadline({
  s,
  title,
  subtitle,
}: {
  s: number;
  title: string;
  subtitle: string;
}) {
  const r = (n: number) => Math.round(n * s);
  return (
    <View style={{ alignItems: 'center', marginTop: r(20), paddingHorizontal: r(24) }}>
      <Text style={[chromeStyles.headlineTitle, { fontSize: r(20), color: '#0b3b3f' }]}>{title}</Text>
      <Text style={[chromeStyles.headlineSub, { fontSize: r(20), color: '#0b3b3f', marginTop: r(2) }]}>{subtitle}</Text>
    </View>
  );
}

export function LessonLearnVsBadge({ s }: { s: number }) {
  const r = (n: number) => Math.round(n * s);
  return (
    <View
      style={{
        alignSelf: 'center',
        marginTop: r(-6),
        marginBottom: r(-6),
        zIndex: 2,
        width: r(50),
        height: r(50),
        borderRadius: r(25),
        backgroundColor: VS_CIRCLE,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: r(20), color: '#000' }}>VS</Text>
    </View>
  );
}

export function LessonHighlightedSentenceCard({
  s,
  cardW,
  sentence,
  marginTop,
}: {
  s: number;
  cardW: number;
  sentence: LessonSentenceCard;
  marginTop: number;
}) {
  const r = (n: number) => Math.round(n * s);
  const listeningWordIndex = useLessonListeningWordIndex(sentence.id);

  return (
    <View
      style={{
        marginTop,
        width: cardW,
        alignSelf: 'center',
        minHeight: r(112),
        borderRadius: r(15),
        paddingTop: r(14),
        paddingBottom: r(12),
        paddingHorizontal: r(14),
        backgroundColor: '#fff7ec',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
      }}
    >
      <LessonSentenceAudioButton
        s={s}
        sourceId={sentence.id}
        phrase={sentence}
        style={{ position: 'absolute', left: r(13), top: r(13) }}
      />

      <LessonArabicLine
        s={s}
        arabic={sentence.arabic}
        arabicSegments={sentence.arabicSegments}
        listeningWordIndex={listeningWordIndex}
      />
      <Text
        style={{
          fontFamily: 'Nunito_700Bold',
          fontSize: r(12),
          color: '#737373',
          marginTop: r(4),
          textAlign: 'center',
        }}
      >
        {sentence.transliteration}
      </Text>
      <View
        style={{
          alignSelf: 'stretch',
          height: StyleSheet.hairlineWidth,
          backgroundColor: 'rgba(0,0,0,0.12)',
          marginTop: r(8),
          marginHorizontal: r(4),
        }}
      />
      <Text
        style={{
          fontFamily: 'Nunito_700Bold',
          fontSize: r(16),
          color: '#000',
          marginTop: r(8),
          textAlign: 'center',
        }}
      >
        {sentence.translation}
      </Text>
    </View>
  );
}

export function LessonLearnContinueButton({
  s,
  theme,
  label,
  disabled,
  onPress,
  variant = 'primary',
}: {
  s: number;
  theme: PathTheme;
  label: string;
  disabled?: boolean;
  onPress: () => void;
  variant?: 'primary' | 'tryAgain';
}) {
  const r = (n: number) => Math.round(n * s);
  const ctaDepth = r(4);
  const isTryAgain = variant === 'tryAgain';
  const bg = isTryAgain ? '#f54900' : theme.primary;
  const border = isTryAgain ? '#942f0d' : theme.primaryDark;

  return (
    <UiTapPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => {
        const isEnabled = !disabled;
        const isDown = isEnabled && pressed;
        return [
          chromeStyles.cta,
          {
            height: r(49),
            borderRadius: r(42),
            marginBottom: ctaDepth,
            backgroundColor: bg,
            borderColor: border,
            opacity: isEnabled ? 1 : 0.45,
            transform: [{ scale: isDown ? 0.98 : 1 }, { translateY: isDown ? ctaDepth : 0 }],
            shadowColor: border,
            shadowOffset: { width: 0, height: isDown ? 0 : ctaDepth },
            shadowOpacity: isEnabled && !isDown ? 1 : 0,
            shadowRadius: 0,
            elevation: isEnabled && !isDown ? 4 : 0,
          },
        ];
      }}
    >
      <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: r(20), color: '#fff' }}>{label}</Text>
    </UiTapPressable>
  );
}

const chromeStyles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  closeFab: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  progressTrack: { overflow: 'hidden', position: 'relative' },
  progressFill: { position: 'absolute', top: 0, left: 0, bottom: 0 },
  progressSheen: { position: 'absolute' },
  seedsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
  },
  rewardPill: {
    backgroundColor: '#ece9d9',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineTitle: { fontFamily: 'Nunito_800ExtraBold', textAlign: 'center' },
  headlineSub: { fontFamily: 'Nunito_800ExtraBold', textAlign: 'center' },
  cta: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
