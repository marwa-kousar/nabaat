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
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppDimensions } from '../lib/useAppDimensions';
import { AppImage } from './AppImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';

import type { LearningPathId } from './ChoosePathScreen';
import {
  LessonLearnContinueButton,
  LessonLearnHeader,
  LessonRewardPill,
  LESSON_LEARN_PAGE_BG,
} from './LessonLearnChrome';
import { UiTapPressable } from './UiTapPressable';
import {
  lessonLearnIcons,
  lessonLearnSprout,
  lessonLearnWhyQuran,
} from '../lib/lessonLearnAssets';
import type { LessonWhyNahwOption, LessonWhyNahwOptionIcon, LessonWhyNahwStep } from '../lib/lessonSteps';
import { pathThemeOf } from '../lib/pathTheme';
import { stopLessonSentenceAudio } from '../lib/lessonSentenceAudio';
import { safeAudioPlayUri } from '../lib/safeExpoAudio';
import {
  fetchAyahRecitationWordTimings,
  fetchLessonAyah,
  type LessonAyahData,
  type AyahWordTiming,
} from '../lib/quranCloudApi';

const FIGMA_W = 393;

const SoundCircle = lessonLearnIcons.soundCircle;
const SoundIcon = lessonLearnIcons.sound;
const CheckmarkIcon = lessonLearnIcons.checkmarkFilled;
const LightbulbIcon = lessonLearnIcons.whyLightbulb;
const PlantIcon = lessonLearnIcons.whyPlant;
const ShieldIcon = lessonLearnIcons.whyShield;

type IconComponent = ComponentType<SvgProps>;

const OPTION_ICONS: Record<
  LessonWhyNahwOptionIcon,
  { type: 'image' } | { type: 'svg'; Icon: IconComponent }
> = {
  quran: { type: 'image' },
  shield: { type: 'svg', Icon: ShieldIcon },
  lightbulb: { type: 'svg', Icon: LightbulbIcon },
  all: { type: 'svg', Icon: PlantIcon },
};

const textPad = Platform.select({ android: { includeFontPadding: false as const }, default: {} });

function r(n: number, s: number) {
  return Math.round(n * s);
}

export type LessonWhyNahwScreenProps = {
  learningPath: LearningPathId;
  step: LessonWhyNahwStep;
  seedsEarned: number;
  onExit: () => void;
  onContinue: (seedsDelta: number) => void;
};

export function LessonWhyNahwScreen({
  learningPath,
  step,
  seedsEarned,
  onExit,
  onContinue,
}: LessonWhyNahwScreenProps) {
  const { width: W } = useAppDimensions();
  const insets = useSafeAreaInsets();
  const s = W / FIGMA_W;

  const [fredokaLoaded] = useFredoka({ Fredoka_500Medium, Fredoka_600SemiBold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_500Medium, NotoSansArabic_700Bold });

  const theme = useMemo(() => pathThemeOf(learningPath), [learningPath]);
  const progressFrac = step.progress ?? 0.52;

  const correctId = useMemo(() => step.options.find((o) => o.correct)?.id ?? null, [step.options]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const answeredCorrect = selectedId !== null && selectedId === correctId;

  const [ayah, setAyah] = useState<LessonAyahData | null>(null);
  const [ayahLoading, setAyahLoading] = useState(false);
  const [ayahError, setAyahError] = useState<string | null>(null);

  useEffect(() => {
    if (!answeredCorrect) return;
    let cancelled = false;
    setAyahLoading(true);
    setAyahError(null);
    fetchLessonAyah(step.ayahVerseKey)
      .then((data) => {
        if (!cancelled) setAyah(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setAyahError(e instanceof Error ? e.message : 'Could not load ayah');
        }
      })
      .finally(() => {
        if (!cancelled) setAyahLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [answeredCorrect, step.ayahVerseKey]);

  const handleContinue = useCallback(() => {
    if (!answeredCorrect) return;
    onContinue(step.feedback.rewardSeeds);
  }, [answeredCorrect, onContinue, step.feedback.rewardSeeds]);

  if (!fredokaLoaded || !nunitoLoaded || !notoArLoaded) {
    return <View style={{ flex: 1, backgroundColor: LESSON_LEARN_PAGE_BG }} />;
  }

  const padH = r(23, s);
  const contentW = Math.min(W - padH * 2, r(330, s));
  const tileW = r(155, s);
  const tileH = r(104, s);
  const tileGapX = r(13, s);
  const tileGapY = r(13, s);

  return (
    <View style={{ flex: 1, backgroundColor: LESSON_LEARN_PAGE_BG, paddingTop: insets.top }}>
      <LessonLearnHeader
        s={s}
        theme={theme}
        progressFrac={progressFrac}
        seedsEarned={seedsEarned}
        pendingGain={answeredCorrect ? step.feedback.rewardSeeds : 0}
        onExit={onExit}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: padH, paddingBottom: r(8, s) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.questionRow, { marginTop: r(20, s), paddingHorizontal: r(8, s) }]}>
          <Text style={[styles.question, { fontSize: r(20, s), maxWidth: r(280, s) }]}>
            {step.question}
            {step.questionEmoji ? ` ${step.questionEmoji}` : ''}
          </Text>
          <AppImage source={lessonLearnSprout} style={{ width: r(27, s), height: r(27, s), marginLeft: r(4, s) }} />
        </View>

        <View
          style={{
            width: tileW * 2 + tileGapX,
            alignSelf: 'center',
            marginTop: r(16, s),
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: tileGapX,
            rowGap: tileGapY,
          }}
        >
          {step.options.map((option) => {
            const isSelected = selectedId === option.id;
            const highlighted = answeredCorrect ? option.correct : isSelected;
            return (
              <OptionTile
                key={option.id}
                s={s}
                option={option}
                width={tileW}
                height={tileH}
                highlighted={highlighted}
                showCheck={answeredCorrect && option.correct}
                themePrimary={theme.primary}
                onPress={() => setSelectedId(option.id)}
              />
            );
          })}
        </View>

        {answeredCorrect ? (
          <AyahCard
            s={s}
            width={contentW}
            ayah={ayah}
            loading={ayahLoading}
            error={ayahError}
            verseKey={step.ayahVerseKey}
            themePrimary={theme.primary}
            themeProgressTrack={theme.progressTrack}
          />
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: padH, paddingBottom: Math.max(r(16, s), insets.bottom) }}>
        {answeredCorrect ? (
          <View
            style={[
              styles.feedbackCard,
              {
                marginBottom: r(12, s),
                minHeight: r(118, s),
                paddingVertical: r(12, s),
                paddingHorizontal: r(14, s),
              },
            ]}
          >
            <Text style={[styles.feedbackTitleAr, { fontSize: r(20, s), color: theme.primaryDark }]}>
              {step.feedback.titleAr}
            </Text>
            <Text style={[styles.feedbackTitleEn, { fontSize: r(12, s), color: theme.primaryDark, marginTop: r(2, s) }]}>
              {step.feedback.titleEn}
            </Text>
            <Text style={[styles.feedbackBody, { fontSize: r(10, s), marginTop: r(6, s), paddingHorizontal: r(40, s) }]}>
              {step.feedback.message}
            </Text>
            <LessonRewardPill
              s={s}
              amount={step.feedback.rewardSeeds}
              style={{ position: 'absolute', right: r(10, s), top: r(12, s) }}
            />
          </View>
        ) : null}

        <LessonLearnContinueButton
          s={s}
          theme={theme}
          label="Continue"
          disabled={!answeredCorrect}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}

function OptionIcon({ s, icon }: { s: number; icon: LessonWhyNahwOptionIcon }) {
  const box = r(50, s);
  const iconDef = OPTION_ICONS[icon];

  if (iconDef.type === 'image') {
    const innerW = r(73, s);
    const innerH = r(109, s);
    return (
      <View style={{ width: box, height: box, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <AppImage
          source={lessonLearnWhyQuran}
          style={{
            width: innerW,
            height: innerH,
            position: 'absolute',
            left: r(-12, s),
            top: r(-30, s),
          }}
          resizeMode="contain"
        />
      </View>
    );
  }

  const Icon = iconDef.Icon;
  const size = icon === 'all' ? r(42, s) : r(42, s);
  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      <Icon width={size} height={size} />
    </View>
  );
}

function OptionTile({
  s,
  option,
  width,
  height,
  highlighted,
  showCheck,
  themePrimary,
  onPress,
}: {
  s: number;
  option: LessonWhyNahwOption;
  width: number;
  height: number;
  highlighted: boolean;
  showCheck: boolean;
  themePrimary: string;
  onPress: () => void;
}) {
  const labelColor = highlighted && option.correct ? '#006052' : '#000';

  return (
    <UiTapPressable
      accessibilityRole="button"
      accessibilityLabel={option.label}
      accessibilityState={{ selected: highlighted }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionTile,
        {
          width,
          height,
          borderRadius: r(10, s),
          borderWidth: highlighted ? 2 : 1,
          borderColor: highlighted ? themePrimary : 'rgba(0,0,0,0.15)',
          backgroundColor: highlighted ? '#eefffc' : '#fff7ec',
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {showCheck ? (
        <View style={{ position: 'absolute', right: r(6, s), top: r(6, s), zIndex: 2 }}>
          <CheckmarkIcon width={r(20, s)} height={r(20, s)} />
        </View>
      ) : null}

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <OptionIcon s={s} icon={option.icon} />
      </View>

      <Text
        style={[
          styles.optionLabel,
          {
            fontSize: r(14, s),
            color: labelColor,
            paddingHorizontal: r(8, s),
            paddingBottom: r(10, s),
          },
        ]}
      >
        {option.label}
      </Text>
    </UiTapPressable>
  );
}

function AyahCard({
  s,
  width,
  ayah,
  loading,
  error,
  verseKey,
  themePrimary,
  themeProgressTrack,
}: {
  s: number;
  width: number;
  ayah: LessonAyahData | null;
  loading: boolean;
  error: string | null;
  verseKey: string;
  themePrimary: string;
  themeProgressTrack: string;
}) {
  const fallbackRef = `-Qur'an ${verseKey}`;
  const audioPlayer = useAudioPlayer(null, { updateInterval: 70 });
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const [wordTimings, setWordTimings] = useState<AyahWordTiming[] | null>(null);
  const [syncWordHighlight, setSyncWordHighlight] = useState(false);

  useEffect(() => {
    if (!ayah?.verseKey) {
      setWordTimings(null);
      return;
    }
    let cancelled = false;
    void fetchAyahRecitationWordTimings(ayah.verseKey).then((rows) => {
      if (!cancelled) setWordTimings(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [ayah?.verseKey]);

  const activeWordPosition = useMemo(() => {
    if (!syncWordHighlight || !wordTimings?.length) return null;
    const t = audioStatus.currentTime;
    const dur = audioStatus.duration;
    if (dur <= 0) return null;
    if (t >= dur - 0.08) return null;
    if (!audioStatus.playing && t <= 0) return null;
    for (const seg of wordTimings) {
      if (t >= seg.startSec && t < seg.endSec) return seg.position;
    }
    const last = wordTimings[wordTimings.length - 1]!;
    if (t >= last.startSec && t <= dur + 0.15) return last.position;
    return null;
  }, [
    syncWordHighlight,
    wordTimings,
    audioStatus.currentTime,
    audioStatus.duration,
    audioStatus.playing,
  ]);

  useEffect(() => {
    if (!syncWordHighlight) return;
    const dur = audioStatus.duration;
    const t = audioStatus.currentTime;
    if (dur > 0 && !audioStatus.playing && t >= dur - 0.12) {
      setSyncWordHighlight(false);
    }
  }, [syncWordHighlight, audioStatus.playing, audioStatus.duration, audioStatus.currentTime]);

  const onPlayAyah = useCallback(async () => {
    if (!ayah?.audioUri) return;
    stopLessonSentenceAudio();
    setSyncWordHighlight(true);
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      const ok = await safeAudioPlayUri(audioPlayer, ayah.audioUri);
      if (!ok) setSyncWordHighlight(false);
    } catch {
      setSyncWordHighlight(false);
    }
  }, [ayah?.audioUri, audioPlayer]);

  const iconSize = r(23, s);
  const canPlay = Boolean(ayah?.audioUri);

  return (
    <View
      style={[
        styles.ayahCard,
        {
          width,
          alignSelf: 'center',
          marginTop: r(14, s),
          minHeight: r(148, s),
          borderRadius: r(15, s),
          paddingTop: r(16, s),
          paddingBottom: r(16, s),
          paddingHorizontal: r(12, s),
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#24c1a4" style={{ marginVertical: r(24, s) }} />
      ) : error ? (
        <Text style={[styles.ayahError, { fontSize: r(12, s) }]}>{error}</Text>
      ) : ayah ? (
        <>
          <UiTapPressable
            accessibilityRole="button"
            accessibilityLabel="Play ayah audio"
            accessibilityState={{ disabled: !canPlay }}
            disabled={!canPlay}
            onPress={() => void onPlayAyah()}
            style={({ pressed }) => [
              {
                position: 'absolute',
                left: r(12, s),
                top: r(12, s),
                opacity: !canPlay ? 0.35 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={{ width: iconSize, height: iconSize, alignItems: 'center', justifyContent: 'center' }}>
              <SoundCircle width={iconSize} height={iconSize} style={StyleSheet.absoluteFillObject} />
              <SoundIcon width={r(14, s)} height={r(14, s)} />
            </View>
          </UiTapPressable>

          <Text
            style={[
              styles.ayahArabic,
              {
                fontSize: r(18, s),
                lineHeight: r(-32, s),
                writingDirection: 'rtl',
                marginTop: r(4, s),
                paddingHorizontal: r(8, s),
                ...textPad,
              },
            ]}
          >
            {ayah.words.map((w, i) => (
              <Text
                key={w.id}
                style={
                  activeWordPosition === w.position
                    ? {
                        backgroundColor: themeProgressTrack,
                        borderRadius: r(4, s),
                        color: themePrimary,
                      }
                    : undefined
                }
              >
                {w.text}
                {i < ayah.words.length - 1 ? '\u00A0' : ''}
              </Text>
            ))}
          </Text>
          <Text style={[styles.ayahTranslit, { fontSize: r(10, s), marginTop: r(8, s) }]}>{ayah.transliteration}</Text>
          <Text style={[styles.ayahTranslation, { fontSize: r(12, s), marginTop: r(10, s) }]}>{ayah.translation}</Text>
          <Text style={[styles.ayahRef, { fontSize: r(12, s), marginTop: r(6, s) }]}>{ayah.referenceLabel}</Text>
        </>
      ) : (
        <Text style={[styles.ayahError, { fontSize: r(12, s) }]}>Ayah unavailable.</Text>
      )}
      {!ayah && !loading && !error ? (
        <Text style={[styles.ayahRef, { fontSize: r(12, s), marginTop: r(8, s) }]}>{fallbackRef}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  question: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#0b3b3f',
    textAlign: 'center',
  },
  optionTile: {
    alignItems: 'center',
  },
  optionLabel: {
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
  },
  ayahCard: {
    backgroundColor: '#fbf3e5',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  ayahArabic: {
    fontFamily: 'NotoSansArabic_700Bold',
    color: '#006052',
    textAlign: 'center',
  },
  ayahTranslit: {
    fontFamily: 'Nunito_700Bold',
    color: '#737373',
    textAlign: 'center',
  },
  ayahTranslation: {
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    textAlign: 'center',
  },
  ayahRef: {
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    textAlign: 'center',
  },
  ayahError: {
    fontFamily: 'Nunito_700Bold',
    color: '#737373',
    textAlign: 'center',
  },
  feedbackCard: {
    borderRadius: 15,
    backgroundColor: '#f5f4ec',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  feedbackTitleAr: {
    fontFamily: 'NotoSansArabic_700Bold',
    textAlign: 'center',
  },
  feedbackTitleEn: {
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
  },
  feedbackBody: {
    fontFamily: 'Nunito_700Bold',
    color: '#6f6f6f',
    textAlign: 'center',
    lineHeight: 14,
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
});
