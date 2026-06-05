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
import { useCallback, useMemo, useState } from 'react';
import {

  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useAppDimensions } from '../lib/useAppDimensions';
import { AppImage } from './AppImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LearningPathId } from './ChoosePathScreen';
import { LessonArabicLine } from './LessonArabicLine';
import { LessonSentenceAudioButton } from './LessonSentenceAudioButton';
import { useLessonListeningWordIndex } from './useLessonListeningWordIndex';
import { LessonRewardPill, LessonSeedsPill } from './LessonLearnChrome';
import { UiTapPressable } from './UiTapPressable';
import { lessonLearnFeedbackMascot, lessonLearnIcons, lessonLearnSprout } from '../lib/lessonLearnAssets';
import type { LessonSentenceCard, LessonSentenceCompareStep } from '../lib/lessonSteps';
import { pathThemeOf } from '../lib/pathTheme';

const FIGMA_W = 393;

/** Figma learn screen — exact neutrals from node 1392:5810 */
const C = {
  pageBg: '#fef9f5',
  progressTrack: '#ebe1d7',
  title: '#0b3b3f',
  muted: '#737373',
  cardBg: '#fff7ec',
  cardBorder: 'rgba(0,0,0,0.1)',
  optionBorder: 'rgba(0,0,0,0.15)',
  optionSelectedBg: '#eefffc',
  feedbackBg: '#f5f4ec',
  feedbackSub: '#6f6f6f',
  rewardBg: '#e2dfcb',
  rewardText: '#578140',
  vsText: '#000',
  optionWrongBg: '#fdebe3',
  optionWrongBorder: '#ff0000',
  wrongTitle: '#ca3500',
  tryAgainBg: '#f54900',
  tryAgainBorder: '#942f0d',
} as const;

function r(n: number, s: number) {
  return Math.round(n * s);
}

const textPad = Platform.select({ android: { includeFontPadding: false as const }, default: {} });

const CloseIcon = lessonLearnIcons.close;
const StarIcon = lessonLearnIcons.star;
const StarSmallIcon = lessonLearnIcons.starSmall;
const RestartIcon = lessonLearnIcons.restart;

const VS_CIRCLE = '#F3E7CF';

export type LessonCompareStepScreenProps = {
  learningPath: LearningPathId;
  step: LessonSentenceCompareStep;
  /** Seeds earned earlier in this lesson session. */
  seedsEarned: number;
  onExit: () => void;
  onContinue: (seedsDelta: number) => void;
};

export function LessonCompareStepScreen({
  learningPath,
  step,
  seedsEarned,
  onExit,
  onContinue,
}: LessonCompareStepScreenProps) {
  const { width: W } = useAppDimensions();
  const insets = useSafeAreaInsets();
  const s = W / FIGMA_W;

  const [fredokaLoaded] = useFredoka({ Fredoka_500Medium, Fredoka_600SemiBold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_500Medium, NotoSansArabic_700Bold });

  const theme = useMemo(() => pathThemeOf(learningPath), [learningPath]);
  const progressFrac = step.progress ?? 0.05;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const correctId = useMemo(() => step.options.find((o) => o.correct)?.id ?? null, [step.options]);
  const answeredCorrect = selectedId !== null && selectedId === correctId;
  const answeredWrong = selectedId !== null && selectedId !== correctId;

  const wrongFeedback = step.wrongFeedback ?? {
    titleEn: 'Not quite!',
    titleSub: 'Look carefully at the endings.',
    message: 'The words are the same, but the endings changed - and that changes the meaning.',
  };

  const handleContinue = useCallback(() => {
    if (!answeredCorrect) return;
    onContinue(step.feedback.rewardSeeds);
  }, [answeredCorrect, onContinue, step.feedback.rewardSeeds]);

  const handleTryAgain = useCallback(() => {
    setSelectedId(null);
  }, []);

  const ctaDepth = r(4, s);

  if (!fredokaLoaded || !nunitoLoaded || !notoArLoaded) {
    return <View style={[styles.root, { backgroundColor: C.pageBg }]} />;
  }

  const padH = r(23, s);
  const cardW = Math.min(W - padH * 2, r(335, s));
  const [topSentence, bottomSentence] = step.sentences;

  const progressFillW = Math.max(r(12, s), Math.round(progressFrac * r(244, s)));
  const progressSheenW = Math.max(r(8, s), Math.round(progressFillW * 0.94));

  const closeFabShadow: ViewStyle =
    Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: r(3, s) },
        shadowOpacity: 0.2,
        shadowRadius: r(2, s),
      },
      android: { elevation: 3 },
      default: {},
    }) ?? {};

  return (
    <View style={[styles.root, { backgroundColor: C.pageBg, paddingTop: insets.top }]}>
      {/* Header — Figma: close 40×40 @19, progress 244×11, seeds pill */}
      <View style={[styles.headerRow, { paddingHorizontal: r(19, s), marginTop: r(10, s), minHeight: r(40, s) }]}>
        <UiTapPressable
          accessibilityRole="button"
          accessibilityLabel="Exit lesson"
          onPress={onExit}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, marginRight: r(12, s) }]}
        >
          <View
            style={[
              styles.closeFab,
              {
                width: r(40, s),
                height: r(40, s),
                borderRadius: r(20, s),
                ...closeFabShadow,
              },
            ]}
          >
            <CloseIcon width={r(24, s)} height={r(24, s)} />
          </View>
        </UiTapPressable>

        <View
          style={[
            styles.progressTrack,
            {
              flex: 1,
              maxWidth: r(244, s),
              height: r(11, s),
              borderRadius: r(20, s),
              backgroundColor: C.progressTrack,
            },
          ]}
          accessibilityRole="progressbar"
        >
          {progressFrac > 0 ? (
            <>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: progressFillW,
                    borderRadius: r(20, s),
                    backgroundColor: theme.primary,
                  },
                ]}
              />
              <View
                style={[
                  styles.progressSheen,
                  {
                    width: progressSheenW,
                    height: r(2, s),
                    top: r(2, s),
                    left: r(2, s),
                    borderRadius: r(3, s),
                    backgroundColor: theme.progressSheen,
                  },
                ]}
              />
            </>
          ) : null}
        </View>

        <LessonSeedsPill
          s={s}
          theme={theme}
          seedsEarned={seedsEarned}
          pendingGain={answeredCorrect ? step.feedback.rewardSeeds : 0}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: padH, paddingBottom: r(8, s) }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Question — top 123, 20px bold #0b3b3f */}
        <View style={[styles.questionRow, { marginTop: r(20, s) }]}>
          <Text style={[styles.question, { fontSize: r(20, s), lineHeight: r(26, s), color: C.title, flex: 1 }]}>
            {step.question}
          </Text>
          {step.questionEmoji ? (
            <AppImage source={lessonLearnSprout} style={{ width: r(27, s), height: r(27, s), marginLeft: r(6, s) }} accessibilityLabel="Sprout" />
          ) : null}
        </View>

        <Text style={[styles.instruction, { fontSize: r(12, s), marginTop: r(8, s), color: C.muted }]}>{step.instruction}</Text>

        {/* Sentence cards */}
        <SentenceCard
          s={s}
          themeDark={theme.primaryDark}
          cardW={cardW}
          sentence={topSentence}
          marginTop={r(24, s)}
        />

        <View
          style={[
            styles.vsWrap,
            {
              marginTop: r(-6, s),
              marginBottom: r(-6, s),
              zIndex: 2,
              width: r(50, s),
              height: r(50, s),
              borderRadius: r(25, s),
              backgroundColor: VS_CIRCLE,
            },
          ]}
        >
          <Text style={[styles.vsLabel, { fontSize: r(20, s), color: C.vsText }]}>VS</Text>
        </View>

        <SentenceCard
          s={s}
          themeDark={theme.primaryDark}
          cardW={cardW}
          sentence={bottomSentence}
          marginTop={0}
        />

        {/* Choice prompt — 14px bold */}
        <Text style={[styles.choicePrompt, { fontSize: r(14, s), marginTop: r(28, s) }]}>{step.choicePrompt}</Text>

        <View style={[styles.optionsRow, { marginTop: r(12, s), gap: r(6, s) }]}>
          {step.options.map((opt) => {
            const selected = selectedId === opt.id;
            const showCorrectStyle = answeredCorrect && opt.correct;
            const showWrongStyle = answeredWrong && selected && !opt.correct;
            return (
              <UiTapPressable
                key={opt.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => !answeredCorrect && setSelectedId(opt.id)}
                disabled={answeredCorrect}
                style={({ pressed }) => [
                  styles.optionBtn,
                  {
                    flex: 1,
                    height: r(51, s),
                    borderRadius: r(10, s),
                    borderWidth: 1,
                    borderColor: showWrongStyle
                      ? C.optionWrongBorder
                      : showCorrectStyle
                        ? theme.primary
                        : C.optionBorder,
                    backgroundColor: showWrongStyle ? C.optionWrongBg : showCorrectStyle ? C.optionSelectedBg : '#fff',
                    opacity: pressed && !answeredCorrect ? 0.92 : 1,
                  },
                ]}
              >
                <Text style={[styles.optionLabel, { fontSize: r(14, s) }]}>{opt.label}</Text>
              </UiTapPressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Feedback + CTA */}
      <View style={{ paddingHorizontal: padH, paddingBottom: Math.max(r(16, s), insets.bottom) }}>
        {answeredWrong ? (
          <View
            style={[
              styles.feedbackCard,
              {
                marginBottom: r(12, s),
                borderRadius: r(15, s),
                paddingVertical: r(12, s),
                paddingHorizontal: r(12, s),
                minHeight: r(118, s),
              },
            ]}
          >
            <View
              style={{
                position: 'absolute',
                left: r(8, s),
                bottom: r(4, s),
                width: r(87, s),
                height: r(109, s),
              }}
            >
              <AppImage
                source={lessonLearnFeedbackMascot}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>

            <View style={{ marginLeft: r(96, s), paddingRight: r(8, s) }}>
              <Text style={[styles.wrongTitle, { fontSize: r(12, s), color: C.wrongTitle }]}>
                {wrongFeedback.titleEn}
              </Text>
              <Text style={[styles.wrongTitleSub, { fontSize: r(12, s), color: C.wrongTitle, marginTop: r(2, s) }]}>
                {wrongFeedback.titleSub}
              </Text>
              <Text style={[styles.feedbackBody, { fontSize: r(10, s), color: C.feedbackSub, marginTop: r(8, s) }]}>
                {wrongFeedback.message}
              </Text>
            </View>
          </View>
        ) : answeredCorrect ? (
          <View
            style={[
              styles.feedbackCard,
              {
                marginBottom: r(12, s),
                borderRadius: r(15, s),
                paddingVertical: r(12, s),
                paddingHorizontal: r(12, s),
                minHeight: r(118, s),
              },
            ]}
          >
            <View
              style={{
                position: 'absolute',
                left: r(8, s),
                bottom: r(4, s),
                width: r(87, s),
                height: r(109, s),
              }}
            >
              <AppImage
                source={lessonLearnFeedbackMascot}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              {/* Figma: mdi:stars top-left & bottom-left of mascot; sparkle by title */}
              <View style={{ position: 'absolute', left: 0, top: r(12, s) }}>
                <StarSmallIcon width={r(12, s)} height={r(12, s)} />
              </View>
              <View style={{ position: 'absolute', left: 0, bottom: r(8, s), transform: [{ rotate: '180deg' }] }}>
                <StarSmallIcon width={r(10, s)} height={r(10, s)} />
              </View>
              <View style={{ position: 'absolute', left: r(74, s), top: r(38, s) }}>
                <StarIcon width={r(18, s)} height={r(18, s)} />
              </View>
            </View>

            <View style={{ marginLeft: r(96, s), paddingRight: r(52, s) }}>
              <Text
                style={[
                  styles.feedbackTitleAr,
                  { fontSize: r(20, s), color: theme.primaryDark, ...textPad },
                ]}
              >
                {step.feedback.titleAr}
              </Text>
              <Text style={[styles.feedbackTitleEn, { fontSize: r(12, s), color: theme.primaryDark, marginTop: r(2, s) }]}>
                {step.feedback.titleEn}
              </Text>
              <Text style={[styles.feedbackBody, { fontSize: r(10, s), color: C.feedbackSub, marginTop: r(6, s) }]}>
                {step.feedback.message}
              </Text>
            </View>

            <LessonRewardPill
              s={s}
              amount={step.feedback.rewardSeeds}
              style={{ position: 'absolute', right: r(10, s), top: r(18, s) }}
            />
          </View>
        ) : null}

        <UiTapPressable
          accessibilityRole="button"
          accessibilityLabel={answeredWrong ? 'Try again' : 'Continue'}
          accessibilityState={{ disabled: !answeredCorrect && !answeredWrong }}
          disabled={!answeredCorrect && !answeredWrong}
          onPress={answeredWrong ? handleTryAgain : handleContinue}
          style={({ pressed }) => {
            const isTryAgain = answeredWrong;
            const isEnabled = answeredCorrect || answeredWrong;
            const isDown = isEnabled && pressed;
            const bg = isTryAgain ? C.tryAgainBg : theme.primary;
            const border = isTryAgain ? C.tryAgainBorder : theme.primaryDark;
            return [
              styles.cta,
              {
                height: r(49, s),
                borderRadius: r(42, s),
                marginBottom: ctaDepth,
                backgroundColor: bg,
                borderColor: border,
                opacity: isEnabled ? 1 : 0.45,
                flexDirection: 'row',
                gap: r(8, s),
                transform: [
                  { scale: isDown ? 0.98 : 1 },
                  { translateY: isDown ? ctaDepth : 0 },
                ],
                shadowColor: border,
                shadowOffset: { width: 0, height: isDown ? 0 : ctaDepth },
                shadowOpacity: isEnabled && !isDown ? 1 : 0,
                shadowRadius: 0,
                elevation: isEnabled && !isDown ? 4 : 0,
              },
            ];
          }}
        >
          <Text style={[styles.ctaText, { fontSize: r(20, s) }]}>
            {answeredWrong ? 'Try again' : 'Continue'}
          </Text>
          {answeredWrong ? <RestartIcon width={r(24, s)} height={r(24, s)} /> : null}
        </UiTapPressable>
      </View>
    </View>
  );
}

function SentenceCard({
  s,
  themeDark,
  cardW,
  sentence,
  marginTop,
}: {
  s: number;
  themeDark: string;
  cardW: number;
  sentence: LessonSentenceCard;
  marginTop: number;
}) {
  const listeningWordIndex = useLessonListeningWordIndex(sentence.id);

  return (
    <View
      style={[
        styles.sentenceCard,
        {
          marginTop,
          width: cardW,
          alignSelf: 'center',
          minHeight: r(112, s),
          borderRadius: r(15, s),
          paddingTop: r(14, s),
          paddingBottom: r(12, s),
          paddingHorizontal: r(14, s),
        },
      ]}
    >
      <LessonSentenceAudioButton
        s={s}
        sourceId={sentence.id}
        phrase={sentence}
        style={{ position: 'absolute', left: r(13, s), top: r(13, s) }}
      />

      <LessonArabicLine
        s={s}
        arabic={sentence.arabic}
        arabicSegments={sentence.arabicSegments}
        listeningWordIndex={listeningWordIndex}
        plainColor={themeDark}
      />
      <Text style={[styles.translitLine, { fontSize: r(12, s), color: C.muted, marginTop: r(4, s) }]}>{sentence.transliteration}</Text>
      <Text style={[styles.translationLine, { fontSize: r(16, s), color: '#000', marginTop: r(8, s) }]}>
        {sentence.translation}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeFab: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  progressTrack: {
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  progressSheen: {
    position: 'absolute',
  },
  seedsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
  },
  seedsPillText: {
    fontFamily: 'Nunito_800ExtraBold',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  question: {
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
  },
  instruction: {
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
  },
  sentenceCard: {
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: 'center',
  },
  vsWrap: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsLabel: {
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
  },
  choicePrompt: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#000',
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
  },
  optionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    textAlign: 'center',
  },
  feedbackCard: {
    backgroundColor: C.feedbackBg,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: 'hidden',
  },
  feedbackTitleAr: {
    fontFamily: 'NotoSansArabic_700Bold',
    textAlign: 'left',
  },
  feedbackTitleEn: {
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'left',
  },
  wrongTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'left',
  },
  wrongTitleSub: {
    fontFamily: 'Nunito_700Bold',
    textAlign: 'left',
  },
  feedbackBody: {
    fontFamily: 'Nunito_700Bold',
    textAlign: 'left',
  },
  rewardPill: {
    backgroundColor: C.rewardBg,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardAmount: {
    fontFamily: 'Fredoka_600SemiBold',
  },
  rewardLabel: {
    fontFamily: 'Fredoka_500Medium',
  },
  arabicLine: {
    fontFamily: 'NotoSansArabic_700Bold',
    textAlign: 'center',
  },
  translitLine: {
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
  },
  translationLine: {
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
  },
  cta: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006052',
    shadowRadius: 0,
  },
  ctaText: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
  },
});
