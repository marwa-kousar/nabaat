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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppDimensions } from '../lib/useAppDimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LearningPathId } from './ChoosePathScreen';
import { UiTapPressable } from './UiTapPressable';
import HomePointsLeaf from '../assets/home-points-leaf.svg';
import {
  getExampleLessonSteps,
  NABAAT_COMPLETION_BONUS,
  NABAAT_REWARD_ON_NEXT,
} from '../lib/exampleLessonFlow';
import { pathThemeOf } from '../lib/pathTheme';

const FIGMA_W = 393;
const SCROLL_END_THRESHOLD = 56;

function r(n: number, s: number) {
  return Math.round(n * s);
}

const textPad = Platform.select({ android: { includeFontPadding: false as const }, default: {} });

export type ExampleLessonFlowScreenProps = {
  learningPath: LearningPathId;
  /** Shown in the header (e.g. current lesson title from units JSON). */
  lessonTitleEn: string;
  lessonTitleAr?: string;
  onExit: () => void;
  onComplete: (totalSeeds: number) => void;
};

export function ExampleLessonFlowScreen({
  learningPath,
  lessonTitleEn,
  lessonTitleAr,
  onExit,
  onComplete,
}: ExampleLessonFlowScreenProps) {
  const { width: W } = useAppDimensions();
  const insets = useSafeAreaInsets();
  const s = W / FIGMA_W;

  const [fredokaLoaded] = useFredoka({ Fredoka_500Medium, Fredoka_600SemiBold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_500Medium, NotoSansArabic_700Bold });

  const theme = useMemo(() => pathThemeOf(learningPath), [learningPath]);
  const steps = useMemo(() => getExampleLessonSteps(), []);

  const [stepIndex, setStepIndex] = useState(0);
  const [readScrolledEnd, setReadScrolledEnd] = useState(false);
  const [scrollViewportH, setScrollViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());
  const [tfChoice, setTfChoice] = useState<'true' | 'false' | null>(null);
  const [quizChoiceId, setQuizChoiceId] = useState<string | null>(null);

  const [nabaatPoints, setNabaatPoints] = useState(0);
  const claimedStepRewardsRef = useRef<Set<number>>(new Set());
  const completionBonusRef = useRef(false);

  const scrollRef = useRef<ScrollView>(null);
  const step = steps[stepIndex];
  const totalSteps = steps.length;
  const progressPct = useMemo(() => {
    if (totalSteps <= 1) return 100;
    return Math.round((stepIndex / (totalSteps - 1)) * 100);
  }, [stepIndex, totalSteps]);

  useEffect(() => {
    setReadScrolledEnd(false);
    setScrollViewportH(0);
    setContentH(0);
    setRevealedIds(new Set());
    setTfChoice(null);
    setQuizChoiceId(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [stepIndex]);

  const canAdvance = useMemo(() => {
    if (!step) return false;
    if (step.kind === 'readScroll') return readScrolledEnd;
    if (step.kind === 'tapReveal') return step.cards.every((c) => revealedIds.has(c.id));
    if (step.kind === 'trueFalse') {
      const ok = step.correctIsTrue ? tfChoice === 'true' : tfChoice === 'false';
      return ok;
    }
    if (step.kind === 'quiz') return quizChoiceId === step.correctOptionId;
    return false;
  }, [step, readScrolledEnd, revealedIds, tfChoice, quizChoiceId]);

  const goNext = useCallback(() => {
    if (!step) return;
    if (step.kind === 'complete') return;
    if (!canAdvance) return;
    if (!claimedStepRewardsRef.current.has(stepIndex)) {
      if (stepIndex >= 0 && stepIndex < NABAAT_REWARD_ON_NEXT.length) {
        setNabaatPoints((p) => p + NABAAT_REWARD_ON_NEXT[stepIndex]);
      }
      claimedStepRewardsRef.current.add(stepIndex);
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [step, canAdvance, steps.length, stepIndex]);

  const handleComplete = useCallback(() => {
    const bonus = completionBonusRef.current ? 0 : NABAAT_COMPLETION_BONUS;
    if (!completionBonusRef.current) {
      completionBonusRef.current = true;
    }
    const total = nabaatPoints + bonus;
    if (bonus > 0) {
      setNabaatPoints((p) => p + bonus);
    }
    onComplete(total);
  }, [nabaatPoints, onComplete]);

  const goBack = useCallback(() => {
    if (stepIndex <= 0) {
      onExit();
      return;
    }
    setStepIndex((i) => i - 1);
  }, [stepIndex, onExit]);

  const maybeMarkReadScrollDone = useCallback(
    (contentHeight: number, viewportHeight: number, offsetY: number) => {
      if (step?.kind !== 'readScroll') return;
      const shortContent = contentHeight > 0 && viewportHeight > 0 && contentHeight <= viewportHeight + 8;
      if (shortContent) {
        setReadScrolledEnd(true);
        return;
      }
      const reachedEnd = offsetY + viewportHeight >= contentHeight - SCROLL_END_THRESHOLD;
      if (reachedEnd) setReadScrolledEnd(true);
    },
    [step?.kind],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (step?.kind !== 'readScroll') return;
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      maybeMarkReadScrollDone(contentSize.height, layoutMeasurement.height, contentOffset.y);
    },
    [step?.kind, maybeMarkReadScrollDone],
  );

  const onContentSizeChange = useCallback(
    (_w: number, h: number) => {
      setContentH(h);
      if (step?.kind === 'readScroll' && scrollViewportH > 0) {
        maybeMarkReadScrollDone(h, scrollViewportH, 0);
      }
    },
    [step?.kind, scrollViewportH, maybeMarkReadScrollDone],
  );

  const onScrollViewLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      const h = e.nativeEvent.layout.height;
      setScrollViewportH(h);
      if (step?.kind === 'readScroll' && contentH > 0) {
        maybeMarkReadScrollDone(contentH, h, 0);
      }
    },
    [step?.kind, contentH, maybeMarkReadScrollDone],
  );

  const openReveal = useCallback((id: string) => {
    setRevealedIds((prev) => new Set(prev).add(id));
  }, []);

  const padH = r(22, s);
  const bottomPad = Math.max(r(20, s), insets.bottom);

  const footerHint = useMemo(() => {
    if (!step || step.kind === 'complete') return '';
    if (step.kind === 'readScroll') return 'Scroll to the bottom to continue.';
    if (step.kind === 'tapReveal') return 'Tap each card to reveal it — open all three to continue.';
    if (step.kind === 'trueFalse') return 'Choose true or false to continue.';
    if (step.kind === 'quiz') return 'Select the correct answer to continue.';
    return '';
  }, [step]);

  if (!fredokaLoaded || !nunitoLoaded || !notoArLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + r(8, s), paddingHorizontal: padH }]}>
        <UiTapPressable
          accessibilityRole="button"
          accessibilityLabel={stepIndex === 0 ? 'Exit lesson' : 'Previous step'}
          onPress={goBack}
          hitSlop={12}
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.headerBtnText, { fontSize: r(16, s), color: theme.primaryDark }]}>‹</Text>
        </UiTapPressable>
        <View style={[styles.headerCenter, { paddingHorizontal: r(6, s) }]}>
          <Text
            style={[styles.headerLessonTitle, { fontSize: r(16, s), color: theme.primaryDark }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {lessonTitleEn}
          </Text>
          {!!lessonTitleAr && (
            <Text
              style={[
                styles.headerLessonTitleAr,
                {
                  fontSize: r(14, s),
                  lineHeight: r(-1, s),
                  marginTop: r(2, s),
                  color: theme.primaryDark,
                  fontFamily: 'NotoSansArabic_700Bold',
                  ...textPad,
                },
              ]}
              numberOfLines={2}
            >
              {lessonTitleAr}
            </Text>
          )}
        </View>
        <View style={{ width: r(40, s) }} />
      </View>

      <View style={[styles.progressRow, { paddingHorizontal: padH, marginTop: r(10, s), alignItems: 'center' }]}>
        <View
          style={[styles.progressTrack, { flex: 1, height: r(11, s), borderRadius: r(20, s), backgroundColor: theme.progressTrack }]}
          accessibilityRole="progressbar"
          accessibilityLabel="Lesson progress"
        >
          <View
            style={[
              styles.progressFill,
              { width: `${progressPct}%`, borderRadius: r(20, s), backgroundColor: theme.primary },
            ]}
          />
          {progressPct > 0 ? (
            <View
              style={[
                styles.progressSheen,
                {
                  width: '22%',
                  height: r(2, s),
                  top: r(2, s),
                  left: r(2, s),
                  borderRadius: r(3, s),
                  backgroundColor: theme.progressSheen,
                },
              ]}
            />
          ) : null}
        </View>
        <View
          style={[
            styles.nabaatPill,
            {
              marginLeft: r(12, s),
              borderColor: theme.primaryDark,
              paddingVertical: r(6, s),
              paddingHorizontal: r(10, s),
            },
          ]}
          accessibilityLabel={`Nabaat points earned this lesson, ${nabaatPoints}`}
        >
          <HomePointsLeaf width={r(18, s)} height={r(18, s)} />
          <Text style={[styles.nabaatPillText, { fontSize: r(15, s), color: theme.primaryDark, marginLeft: r(4, s) }]}>
            {nabaatPoints}
          </Text>
        </View>
      </View>

      <Text style={[styles.stepCounter, { fontSize: r(13, s), color: '#737373', marginTop: r(10, s), paddingHorizontal: padH }]}>
        Part {stepIndex + 1} of {totalSteps}
      </Text>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: padH, paddingBottom: bottomPad + r(100, s), paddingTop: r(12, s) }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={onContentSizeChange}
        onLayout={onScrollViewLayout}
      >
        {step?.kind === 'readScroll' && (
          <>
            <Text style={[styles.title, { fontSize: r(22, s), color: '#000' }]}>{step.title}</Text>
            {!!step.titleAr && (
              <Text
                style={[
                  styles.titleAr,
                  {
                    fontSize: r(22, s),
                    lineHeight: r(-30, s),
                    marginTop: r(6, s),
                    color: theme.primaryDark,
                    fontFamily: 'NotoSansArabic_700Bold',
                    ...textPad,
                  },
                ]}
              >
                {step.titleAr}
              </Text>
            )}
            {step.paragraphs.map((p, i) => (
              <Text
                key={i}
                style={[
                  styles.readParagraph,
                  {
                    fontSize: r(16, s),
                    lineHeight: r(26, s),
                    marginTop: i === 0 && !step.titleAr ? r(12, s) : r(14, s),
                    color: '#4a5565',
                    fontFamily: 'NotoSansArabic_500Medium',
                    ...textPad,
                  },
                ]}
              >
                {p}
              </Text>
            ))}
            {step.examples?.map((ex, j) => (
              <View
                key={j}
                style={[
                  styles.exampleBox,
                  {
                    marginTop: r(16, s),
                    padding: r(14, s),
                    borderRadius: r(14, s),
                    borderColor: theme.primaryDark,
                    backgroundColor: '#f5f4ec',
                  },
                ]}
              >
                <Text style={[styles.exampleLabel, { fontSize: r(12, s), color: theme.primaryDark }]}>{ex.label}</Text>
                <Text
                  style={[
                    styles.exampleAr,
                    {
                      fontSize: r(20, s),
                      lineHeight: r(32, s),
                      marginTop: r(8, s),
                      color: '#1a1a1a',
                      fontFamily: 'NotoSansArabic_700Bold',
                      ...textPad,
                    },
                  ]}
                >
                  {ex.ar}
                </Text>
                <Text style={[styles.exampleEn, { fontSize: r(15, s), lineHeight: r(22, s), marginTop: r(6, s), color: '#4a5565' }]}>
                  {ex.en}
                </Text>
                <Text style={[styles.exampleNote, { fontSize: r(13, s), lineHeight: r(19, s), marginTop: r(10, s), color: '#737373' }]}>
                  {ex.note}
                </Text>
              </View>
            ))}
            <View style={{ height: r(120, s) }} />
          </>
        )}

        {step?.kind === 'tapReveal' && (
          <>
            <Text style={[styles.title, { fontSize: r(22, s), color: '#000' }]}>{step.title}</Text>
            <Text style={[styles.introMuted, { fontSize: r(15, s), lineHeight: r(22, s), marginTop: r(10, s), color: '#4a5565' }]}>
              {step.intro}
            </Text>
            <View style={{ marginTop: r(18, s) }}>
              {step.cards.map((card, idx) => {
                const open = revealedIds.has(card.id);
                return (
                  <UiTapPressable
                    key={card.id}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    onPress={() => openReveal(card.id)}
                    style={({ pressed }) => [
                      styles.revealCard,
                      {
                        marginBottom: idx < step.cards.length - 1 ? r(12, s) : 0,
                        borderColor: open ? theme.primaryDark : 'rgba(0,0,0,0.12)',
                        backgroundColor: open ? theme.progressTrack : '#fff',
                        opacity: pressed ? 0.94 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.revealHeadline, { fontSize: r(16, s), color: theme.primaryDark }]}>{card.headline}</Text>
                    {open ? (
                      <Text
                        style={[
                          styles.revealDetail,
                          {
                            fontSize: r(15, s),
                            lineHeight: r(22, s),
                            marginTop: r(8, s),
                            color: '#3d3d3d',
                            fontFamily: 'NotoSansArabic_500Medium',
                            ...textPad,
                          },
                        ]}
                      >
                        {card.detail}
                      </Text>
                    ) : (
                      <Text style={[styles.revealHint, { fontSize: r(13, s), marginTop: r(6, s), color: '#737373' }]}>
                        Tap to reveal
                      </Text>
                    )}
                  </UiTapPressable>
                );
              })}
            </View>
          </>
        )}

        {step?.kind === 'trueFalse' && (
          <>
            <Text style={[styles.title, { fontSize: r(22, s), color: '#000' }]}>{step.title}</Text>
            <Text style={[styles.introMuted, { fontSize: r(16, s), lineHeight: r(24, s), marginTop: r(12, s), color: '#1a1a1a' }]}>
              {step.statement}
            </Text>
            <View style={[styles.tfRow, { marginTop: r(20, s) }]}>
              <UiTapPressable
                accessibilityRole="button"
                onPress={() => setTfChoice('true')}
                style={({ pressed }) => [
                  styles.tfBtn,
                  {
                    flex: 1,
                    marginRight: r(6, s),
                    borderColor: tfChoice === 'true' ? theme.primaryDark : 'rgba(0,0,0,0.12)',
                    backgroundColor: tfChoice === 'true' ? theme.progressTrack : '#fff',
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Text style={[styles.tfBtnText, { fontSize: r(17, s), color: theme.primaryDark }]}>True</Text>
              </UiTapPressable>
              <UiTapPressable
                accessibilityRole="button"
                onPress={() => setTfChoice('false')}
                style={({ pressed }) => [
                  styles.tfBtn,
                  {
                    flex: 1,
                    marginLeft: r(6, s),
                    borderColor: tfChoice === 'false' ? theme.primaryDark : 'rgba(0,0,0,0.12)',
                    backgroundColor: tfChoice === 'false' ? theme.progressTrack : '#fff',
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Text style={[styles.tfBtnText, { fontSize: r(17, s), color: theme.primaryDark }]}>False</Text>
              </UiTapPressable>
            </View>
            {tfChoice != null &&
            ((step.correctIsTrue && tfChoice === 'false') || (!step.correctIsTrue && tfChoice === 'true')) ? (
              <Text style={[styles.hint, { fontSize: r(14, s), marginTop: r(12, s), color: '#c62828' }]}>
                {step.wrongHint ?? 'Try the other answer.'}
              </Text>
            ) : null}
          </>
        )}

        {step?.kind === 'quiz' && (
          <>
            <Text style={[styles.title, { fontSize: r(22, s), color: '#000' }]}>{step.title}</Text>
            <Text
              style={[
                styles.introMuted,
                {
                  fontSize: r(16, s),
                  lineHeight: r(24, s),
                  marginTop: r(12, s),
                  color: '#4a5565',
                  fontFamily: 'NotoSansArabic_500Medium',
                  ...textPad,
                },
              ]}
            >
              {step.prompt}
            </Text>
            <View style={{ marginTop: r(16, s) }}>
              {step.options.map((opt, idx) => {
                const selected = quizChoiceId === opt.id;
                const isCorrect = opt.id === step.correctOptionId;
                const showWrong = selected && !isCorrect;
                return (
                  <UiTapPressable
                    key={opt.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setQuizChoiceId(opt.id)}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        marginBottom: idx < step.options.length - 1 ? r(10, s) : 0,
                        borderColor: showWrong ? '#c62828' : selected && isCorrect ? theme.primaryDark : 'rgba(0,0,0,0.12)',
                        backgroundColor: selected && isCorrect ? theme.progressTrack : showWrong ? '#ffebee' : '#fff',
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.optionText, { fontSize: r(15, s), lineHeight: r(22, s), color: '#1a1a1a' }]}>{opt.label}</Text>
                  </UiTapPressable>
                );
              })}
            </View>
            {quizChoiceId != null && quizChoiceId !== step.correctOptionId ? (
              <Text style={[styles.hint, { fontSize: r(14, s), marginTop: r(12, s), color: '#c62828' }]}>
                {step.wrongHint ?? 'Try another option.'}
              </Text>
            ) : null}
          </>
        )}

        {step?.kind === 'complete' && (
          <>
            <Text style={[styles.title, { fontSize: r(22, s), color: '#000' }]}>{step.title}</Text>
            <Text style={[styles.introMuted, { fontSize: r(16, s), lineHeight: r(24, s), marginTop: r(12, s), color: '#4a5565' }]}>
              {step.body}
            </Text>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad, paddingHorizontal: padH, paddingTop: r(12, s) }]}>
        {step?.kind === 'complete' ? (
          <UiTapPressable
            accessibilityRole="button"
            onPress={handleComplete}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: theme.primary,
                borderColor: theme.primaryDark,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={[styles.primaryBtnText, { fontSize: r(17, s) }]}>{step.doneLabel}</Text>
          </UiTapPressable>
        ) : (
          <UiTapPressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canAdvance }}
            onPress={goNext}
            disabled={!canAdvance}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: canAdvance ? theme.primary : '#d0d0d0',
                borderColor: canAdvance ? theme.primaryDark : '#b0b0b0',
                opacity: pressed && canAdvance ? 0.92 : 1,
              },
            ]}
          >
            <Text style={[styles.primaryBtnText, { fontSize: r(17, s), color: canAdvance ? '#fff' : '#888' }]}>Next</Text>
          </UiTapPressable>
        )}
        {!canAdvance && step?.kind !== 'complete' ? (
          <Text style={[styles.footerHint, { fontSize: r(13, s), marginTop: r(8, s), color: '#737373' }]}>{footerHint}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff8e8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: {
    fontFamily: 'Fredoka_600SemiBold',
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  headerLessonTitle: {
    fontFamily: 'Fredoka_600SemiBold',
    textAlign: 'center',
    ...textPad,
  },
  headerLessonTitleAr: {
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
  },
  nabaatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  nabaatPillText: {
    fontFamily: 'Nunito_800ExtraBold',
  },
  exampleBox: {
    borderWidth: 1,
  },
  exampleLabel: {
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: 0.3,
  },
  exampleAr: {},
  exampleEn: {
    fontFamily: 'Nunito_700Bold',
  },
  exampleNote: {
    fontFamily: 'Nunito_700Bold',
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
  stepCounter: {
    fontFamily: 'Nunito_700Bold',
  },
  scroll: {
    flex: 1,
  },
  title: {
    fontFamily: 'Fredoka_600SemiBold',
  },
  titleAr: {},
  readParagraph: {},
  introMuted: {
    fontFamily: 'Nunito_700Bold',
  },
  revealCard: {
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  revealHeadline: {
    fontFamily: 'Fredoka_600SemiBold',
  },
  revealDetail: {},
  revealHint: {
    fontFamily: 'Nunito_700Bold',
  },
  tfRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tfBtn: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tfBtnText: {
    fontFamily: 'Fredoka_800ExtraBold',
  },
  option: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  optionText: {
    fontFamily: 'Nunito_700Bold',
  },
  hint: {
    fontFamily: 'Nunito_700Bold',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff8e8',
  },
  footerHint: {
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
  },
  primaryBtn: {
    borderWidth: 1,
    borderRadius: 42,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
  },
});
