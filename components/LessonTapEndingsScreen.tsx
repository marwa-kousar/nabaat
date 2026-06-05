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
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppDimensions } from '../lib/useAppDimensions';
import type { LearningPathId } from './ChoosePathScreen';
import {
  LessonHighlightedSentenceCard,
  LessonLearnContinueButton,
  LessonLearnHeadline,
  LessonLearnHeader,
  LessonRewardPill,
  LESSON_LEARN_PAGE_BG,
} from './LessonLearnChrome';
import { UiTapPressable } from './UiTapPressable';
import { lessonLearnIcons } from '../lib/lessonLearnAssets';
import type { LessonSentenceCard, LessonTapEndingsStep, TanweenEndingOption } from '../lib/lessonSteps';
import { pathThemeOf } from '../lib/pathTheme';

const FIGMA_W = 393;

const ArrowDownIcon = lessonLearnIcons.arrowDown;

const textPad = Platform.select({ android: { includeFontPadding: false as const }, default: {} });

function r(n: number, s: number) {
  return Math.round(n * s);
}

function previewToSentence(ending: TanweenEndingOption, index: number): LessonSentenceCard {
  return {
    id: `preview-${ending.id}`,
    arabic: ending.preview.arabicSegments.map((s) => s.text).join(''),
    arabicSegments: ending.preview.arabicSegments,
    transliteration: ending.preview.transliteration,
    translation: ending.preview.translation,
    audioKey: `tap-ending-${index}`,
  };
}

export type LessonTapEndingsScreenProps = {
  learningPath: LearningPathId;
  step: LessonTapEndingsStep;
  seedsEarned: number;
  onExit: () => void;
  onContinue: (seedsDelta: number) => void;
};

export function LessonTapEndingsScreen({
  learningPath,
  step,
  seedsEarned,
  onExit,
  onContinue,
}: LessonTapEndingsScreenProps) {
  const { width: W } = useAppDimensions();
  const insets = useSafeAreaInsets();
  const s = W / FIGMA_W;

  const [fredokaLoaded] = useFredoka({ Fredoka_500Medium, Fredoka_600SemiBold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_500Medium, NotoSansArabic_700Bold });

  const theme = useMemo(() => pathThemeOf(learningPath), [learningPath]);
  const progressFrac = step.progress ?? 0.38;

  const defaultEndingId = step.endings[0].id;
  const [selectedId, setSelectedId] = useState<string>(defaultEndingId);
  const [tappedIds, setTappedIds] = useState<Set<string>>(() => new Set([defaultEndingId]));

  const selectedEnding = useMemo(
    () => step.endings.find((e) => e.id === selectedId) ?? step.endings[0],
    [step.endings, selectedId],
  );

  const activeSentence = useMemo(
    () => previewToSentence(selectedEnding, step.endings.findIndex((e) => e.id === selectedEnding.id)),
    [selectedEnding, step.endings],
  );

  const allTapped = tappedIds.size >= step.endings.length;

  const handleTapEnding = useCallback((id: string) => {
    setSelectedId(id);
    setTappedIds((prev) => new Set(prev).add(id));
  }, []);

  const handleContinue = useCallback(() => {
    if (!allTapped) return;
    onContinue(step.footerInsight.rewardSeeds);
  }, [allTapped, onContinue, step.footerInsight.rewardSeeds]);

  if (!fredokaLoaded || !nunitoLoaded || !notoArLoaded) {
    return <View style={{ flex: 1, backgroundColor: LESSON_LEARN_PAGE_BG }} />;
  }

  const padH = r(23, s);
  const cardW = Math.min(W - padH * 2, r(335, s));
  const tileSize = r(100, s);
  const tileGap = r(18, s);

  return (
    <View style={{ flex: 1, backgroundColor: LESSON_LEARN_PAGE_BG, paddingTop: insets.top }}>
      <LessonLearnHeader
        s={s}
        theme={theme}
        progressFrac={progressFrac}
        seedsEarned={seedsEarned}
        pendingGain={allTapped ? step.footerInsight.rewardSeeds : 0}
        onExit={onExit}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: padH, paddingBottom: r(8, s) }}
        showsVerticalScrollIndicator={false}
      >
        <LessonLearnHeadline s={s} title={step.headline.title} subtitle={step.headline.subtitle} />

        <LessonHighlightedSentenceCard s={s} cardW={cardW} sentence={activeSentence} marginTop={r(20, s)} />

        <View style={[styles.arrowWrap, { marginTop: r(10, s), marginBottom: r(6, s) }]}>
          <View style={{ transform: [{ rotate: '90deg' }] }}>
            <ArrowDownIcon width={r(20, s)} height={r(14, s)} />
          </View>
        </View>

        <Text style={[styles.tapPrompt, { fontSize: r(16, s), marginBottom: r(14, s) }]}>{step.tapPrompt}</Text>

        <View style={[styles.tilesRow, { gap: tileGap, marginBottom: r(8, s) }]}>
          {step.endings.map((ending) => (
            <EndingTile
              key={ending.id}
              s={s}
              size={tileSize}
              ending={ending}
              selected={selectedId === ending.id}
              themePrimary={theme.primary}
              onPress={() => handleTapEnding(ending.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: padH, paddingBottom: Math.max(r(16, s), insets.bottom) }}>
        {allTapped ? (
          <View style={[styles.footerCard, { marginBottom: r(12, s), minHeight: r(78, s), paddingVertical: r(12, s) }]}>
            <Text style={[styles.footerTitleAr, { fontSize: r(20, s), color: theme.primaryDark }]}>{step.footerInsight.titleAr}</Text>
            <Text style={[styles.footerBody, { fontSize: r(12, s), marginTop: r(6, s), paddingHorizontal: r(40, s) }]}>
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
          disabled={!allTapped}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}

function EndingTile({
  s,
  size,
  ending,
  selected,
  themePrimary,
  onPress,
}: {
  s: number;
  size: number;
  ending: TanweenEndingOption;
  selected: boolean;
  themePrimary: string;
  onPress: () => void;
}) {
  const symbolColor = selected || ending.symbolColor === 'default' ? '#006052' : '#1a1a1a';
  const tileBg = selected ? '#eefffc' : '#fff7ec';
  const symbolSize = r(48, s);
  const lineW = r(57, s);

  return (
    <UiTapPressable
      accessibilityRole="button"
      accessibilityLabel={`${ending.arabicLabel}, ${ending.transliteration}. ${ending.preview.translation}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: r(15, s),
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? themePrimary : 'rgba(0,0,0,0.1)',
          backgroundColor: tileBg,
          overflow: 'visible',
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {/* Symbol: system font (SF Arabic on iOS) renders standalone diacritics natively, same as Figma */}
      <Text
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: r(8, s),
          fontSize: symbolSize,
          lineHeight: symbolSize,
          fontWeight: '700',
          color: symbolColor,
          textAlign: 'center',
        }}
      >
        {ending.symbol}
      </Text>

      {/* divider — Figma: 42px from tile top */}
      <View style={[styles.tileDivider, { position: 'absolute', top: r(42, s), left: r(21, s), width: lineW }]} />

      {/* Arabic label — Figma: 67px from tile top */}
      <Text style={[styles.tileArabicLabel, { position: 'absolute', top: r(67, s), left: 0, right: 0, fontSize: r(12, s), ...textPad }]} numberOfLines={1}>
        {ending.arabicLabel}
      </Text>
      {/* transliteration — Figma: 83px from tile top */}
      <Text style={[styles.tileTranslit, { position: 'absolute', top: r(83, s), left: 0, right: 0, fontSize: r(10, s) }]} numberOfLines={1}>
        {ending.transliteration}
      </Text>
    </UiTapPressable>
  );
}

const styles = StyleSheet.create({
  arrowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapPrompt: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#000',
    textAlign: 'center',
  },
  tilesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  footerCard: {
    borderRadius: 15,
    backgroundColor: '#f5f4ec',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  footerTitleAr: {
    fontFamily: 'NotoSansArabic_700Bold',
    textAlign: 'center',
  },
  footerBody: {
    fontFamily: 'Nunito_700Bold',
    color: '#5d5c5c',
    textAlign: 'center',
    lineHeight: 16,
  },
  rewardPill: {
    position: 'absolute',
    borderRadius: 70,
    backgroundColor: '#ece9d9',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  tileArabicLabel: {
    fontFamily: 'NotoSansArabic_500Medium',
    color: '#737373',
    textAlign: 'center',
  },
  tileTranslit: {
    fontFamily: 'Nunito_700Bold',
    color: '#737373',
    textAlign: 'center',
  },
});
