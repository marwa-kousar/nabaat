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
import { ScrollView, Text, View } from 'react-native';
import { AppImage } from './AppImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppDimensions } from '../lib/useAppDimensions';

import type { LearningPathId } from './ChoosePathScreen';
import {
  LessonHighlightedSentenceCard,
  LessonLearnContinueButton,
  LessonLearnHeadline,
  LessonLearnHeader,
  LessonLearnVsBadge,
  LessonRewardPill,
  LESSON_LEARN_PAGE_BG,
} from './LessonLearnChrome';
import { UiTapPressable } from './UiTapPressable';
import { lessonLearnLantern } from '../lib/lessonLearnAssets';
import type { LessonEndingsRevealStep } from '../lib/lessonSteps';
import { pathThemeOf } from '../lib/pathTheme';

const FIGMA_W = 393;

function r(n: number, s: number) {
  return Math.round(n * s);
}

export type LessonEndingsRevealScreenProps = {
  learningPath: LearningPathId;
  step: LessonEndingsRevealStep;
  seedsEarned: number;
  onExit: () => void;
  onContinue: (seedsDelta: number) => void;
};

export function LessonEndingsRevealScreen({
  learningPath,
  step,
  seedsEarned,
  onExit,
  onContinue,
}: LessonEndingsRevealScreenProps) {
  const { width: W } = useAppDimensions();
  const insets = useSafeAreaInsets();
  const s = W / FIGMA_W;

  const [fredokaLoaded] = useFredoka({ Fredoka_500Medium, Fredoka_600SemiBold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_500Medium, NotoSansArabic_700Bold });

  const theme = useMemo(() => pathThemeOf(learningPath), [learningPath]);
  const [revealed, setRevealed] = useState(false);

  const progressFrac = revealed ? step.progressRevealed ?? step.progress ?? 0.23 : step.progress ?? 0.18;

  const handleContinue = useCallback(() => {
    if (!revealed) return;
    onContinue(step.footerInsight.rewardSeeds);
  }, [revealed, onContinue, step.footerInsight.rewardSeeds]);

  if (!fredokaLoaded || !nunitoLoaded || !notoArLoaded) {
    return <View style={{ flex: 1, backgroundColor: LESSON_LEARN_PAGE_BG }} />;
  }

  const padH = r(23, s);
  const cardW = Math.min(W - padH * 2, r(335, s));
  const [topSentence, bottomSentence] = step.sentences;

  return (
    <View style={{ flex: 1, backgroundColor: LESSON_LEARN_PAGE_BG, paddingTop: insets.top }}>
      <LessonLearnHeader
        s={s}
        theme={theme}
        progressFrac={progressFrac}
        seedsEarned={seedsEarned}
        pendingGain={revealed ? step.footerInsight.rewardSeeds : 0}
        onExit={onExit}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: padH, paddingBottom: r(8, s) }}
        showsVerticalScrollIndicator={false}
      >
        <LessonLearnHeadline s={s} title={step.headline.title} subtitle={step.headline.subtitle} />

        {/* Tap-to-reveal / revealed definition card */}
        {!revealed ? (
          <UiTapPressable
            accessibilityRole="button"
            accessibilityLabel={`${step.revealCard.tapLabel}. ${step.revealCard.tapHint}`}
            onPress={() => setRevealed(true)}
            style={({ pressed }) => [
              {
                marginTop: r(20, s),
                minHeight: r(64, s),
                borderRadius: r(15, s),
                backgroundColor: theme.primaryDark,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: r(14, s),
                paddingHorizontal: r(16, s),
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: r(14, s), color: '#fff', textAlign: 'center' }}>
              {step.revealCard.tapLabel}
            </Text>
            <Text
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: r(10, s),
                color: theme.primary,
                marginTop: r(6, s),
                textAlign: 'center',
              }}
            >
              {step.revealCard.tapHint}
            </Text>
          </UiTapPressable>
        ) : (
          <View
            style={{
              marginTop: r(20, s),
              minHeight: r(95, s),
              borderRadius: r(15, s),
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.1)',
              flexDirection: 'row',
              paddingVertical: r(12, s),
              paddingHorizontal: r(12, s),
              alignItems: 'center',
            }}
          >
            <AppImage
              source={lessonLearnLantern}
              style={{ width: r(52, s), height: r(64, s), marginRight: r(10, s) }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={{ flex: 1, fontFamily: 'Nunito_700Bold', fontSize: r(14, s), color: '#000', lineHeight: r(20, s) }}>
              {step.revealCard.body}
            </Text>
          </View>
        )}

        <LessonHighlightedSentenceCard s={s} cardW={cardW} sentence={topSentence} marginTop={r(20, s)} />
        <LessonLearnVsBadge s={s} />
        <LessonHighlightedSentenceCard s={s} cardW={cardW} sentence={bottomSentence} marginTop={0} />
      </ScrollView>

      <View style={{ paddingHorizontal: padH, paddingBottom: Math.max(r(16, s), insets.bottom) }}>
        {revealed ? (
          <View
            style={{
              marginBottom: r(12, s),
              borderRadius: r(15, s),
              backgroundColor: '#f5f4ec',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.1)',
              paddingVertical: r(12, s),
              paddingHorizontal: r(14, s),
              minHeight: r(78, s),
            }}
          >
            <Text
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: r(10, s),
                color: '#6f6f6f',
                textAlign: 'center',
                lineHeight: r(15, s),
                paddingRight: r(48, s),
              }}
            >
              {step.footerInsight.message}
            </Text>
            <LessonRewardPill
              s={s}
              amount={step.footerInsight.rewardSeeds}
              style={{ position: 'absolute', right: r(10, s), top: r(12, s) }}
            />
          </View>
        ) : null}

        <LessonLearnContinueButton
          s={s}
          theme={theme}
          label="Continue"
          disabled={!revealed}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}
