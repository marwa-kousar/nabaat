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

  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { AppImage } from './AppImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LearningPathId } from './ChoosePathScreen';
import {
  LessonLearnContinueButton,
  LessonLearnHeader,
  LessonRewardPill,
  LESSON_LEARN_PAGE_BG,
} from './LessonLearnChrome';
import { UiTapPressable } from './UiTapPressable';
import { lessonLearnReflectionMascot } from '../lib/lessonLearnAssets';
import type { LessonReflectStep } from '../lib/lessonSteps';
import { pathThemeOf } from '../lib/pathTheme';

const FIGMA_W = 393;

const textPad = Platform.select({ android: { includeFontPadding: false as const }, default: {} });

function r(n: number, s: number) {
  return Math.round(n * s);
}

export type LessonReflectStepScreenProps = {
  learningPath: LearningPathId;
  step: LessonReflectStep;
  seedsEarned: number;
  onExit: () => void;
  onContinue: (seedsDelta: number) => void;
};

export function LessonReflectStepScreen({
  learningPath,
  step,
  seedsEarned,
  onExit,
  onContinue,
}: LessonReflectStepScreenProps) {
  const { width: W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const s = W / FIGMA_W;

  const [fredokaLoaded] = useFredoka({ Fredoka_500Medium, Fredoka_600SemiBold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_500Medium, NotoSansArabic_700Bold });

  const theme = useMemo(() => pathThemeOf(learningPath), [learningPath]);
  const progressFrac = step.progress ?? 0.65;
  const minChars = step.minChars ?? 3;

  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);
  const canSave = reflection.trim().length >= minChars;

  const handleSaveReflection = useCallback(() => {
    if (!canSave || saved) return;
    Keyboard.dismiss();
    setSaved(true);
  }, [canSave, saved]);

  const handleContinue = useCallback(() => {
    if (!saved) return;
    onContinue(step.feedback.rewardSeeds);
  }, [saved, onContinue, step.feedback.rewardSeeds]);

  if (!fredokaLoaded || !nunitoLoaded || !notoArLoaded) {
    return <View style={{ flex: 1, backgroundColor: LESSON_LEARN_PAGE_BG }} />;
  }

  const padH = r(23, s);
  const contentW = Math.min(W - padH * 2, r(330, s));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: LESSON_LEARN_PAGE_BG, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LessonLearnHeader
        s={s}
        theme={theme}
        progressFrac={progressFrac}
        seedsEarned={seedsEarned}
        pendingGain={saved ? step.feedback.rewardSeeds : 0}
        onExit={onExit}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: padH, paddingBottom: r(8, s) }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { fontSize: r(20, s), marginTop: r(20, s), maxWidth: r(280, s) }]}>{step.title}</Text>

        <View
          style={[
            styles.promptCard,
            {
              width: contentW,
              alignSelf: 'center',
              marginTop: r(16, s),
              minHeight: r(127, s),
              borderRadius: r(15, s),
              paddingVertical: r(18, s),
              paddingHorizontal: r(16, s),
            },
          ]}
        >
          <Text style={[styles.promptText, { fontSize: r(16, s), lineHeight: r(22, s) }]}>{step.prompt}</Text>
        </View>

        <View
          style={[
            styles.inputCard,
            {
              width: contentW,
              alignSelf: 'center',
              marginTop: r(21, s),
              minHeight: r(127, s),
              borderRadius: r(15, s),
              paddingHorizontal: r(16, s),
              paddingVertical: r(14, s),
            },
          ]}
        >
          <TextInput
            value={reflection}
            onChangeText={setReflection}
            placeholder={step.inputPlaceholder}
            placeholderTextColor="#737373"
            multiline
            editable={!saved}
            textAlignVertical="top"
            style={[
              styles.input,
              {
                fontSize: r(14, s),
                lineHeight: r(20, s),
                minHeight: r(98, s),
                color: reflection.trim() ? '#000' : '#737373',
                opacity: saved ? 0.85 : 1,
              },
            ]}
          />
        </View>

        {!saved ? (
          <UiTapPressable
            accessibilityRole="button"
            accessibilityLabel="Save reflection"
            accessibilityState={{ disabled: !canSave }}
            disabled={!canSave}
            onPress={handleSaveReflection}
            style={({ pressed }) => {
              const enabled = canSave;
              const isDown = enabled && pressed;
              const ctaDepth = r(4, s);
              return [
                styles.saveButton,
                {
                  width: contentW,
                  alignSelf: 'center',
                  marginTop: r(14, s),
                  height: r(49, s),
                  borderRadius: r(42, s),
                  marginBottom: ctaDepth,
                  backgroundColor: theme.primary,
                  borderColor: theme.primaryDark,
                  opacity: enabled ? 1 : 0.45,
                  transform: [{ scale: isDown ? 0.98 : 1 }, { translateY: isDown ? ctaDepth : 0 }],
                  shadowColor: theme.primaryDark,
                  shadowOffset: { width: 0, height: isDown ? 0 : ctaDepth },
                  shadowOpacity: enabled && !isDown ? 1 : 0,
                  shadowRadius: 0,
                  elevation: enabled && !isDown ? 4 : 0,
                },
              ];
            }}
          >
            <Text style={[styles.saveButtonText, { fontSize: r(18, s) }]}>Save reflection</Text>
          </UiTapPressable>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: padH, paddingBottom: Math.max(r(16, s), insets.bottom) }}>
        {saved ? (
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
                left: r(5, s),
                bottom: r(0, s),
                width: r(95, s),
                height: r(127, s),
              }}
            >
              <AppImage
                source={lessonLearnReflectionMascot}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>

            <View style={{ marginLeft: r(96, s), paddingRight: r(52, s) }}>
              <Text style={[styles.feedbackTitleAr, { fontSize: r(20, s), color: theme.primaryDark, ...textPad }]}>
                {step.feedback.titleAr}
              </Text>
              <Text style={[styles.feedbackTitleEn, { fontSize: r(12, s), color: theme.primaryDark, marginTop: r(2, s) }]}>
                {step.feedback.titleEn}
              </Text>
              <Text style={[styles.feedbackBody, { fontSize: r(10, s), marginTop: r(6, s) }]}>{step.feedback.message}</Text>
            </View>

            <LessonRewardPill
              s={s}
              amount={step.feedback.rewardSeeds}
              style={{ position: 'absolute', right: r(10, s), top: r(12, s) }}
            />
          </View>
        ) : null}

        {saved ? (
          <LessonLearnContinueButton
            s={s}
            theme={theme}
            label="Continue"
            disabled={false}
            onPress={handleContinue}
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#0b3b3f',
    textAlign: 'center',
    alignSelf: 'center',
  },
  promptCard: {
    backgroundColor: '#fbf3e5',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
  },
  promptText: {
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    textAlign: 'center',
  },
  inputCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    fontFamily: 'Nunito_700Bold',
    width: '100%',
  },
  saveButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
  },
  feedbackCard: {
    backgroundColor: '#f5f4ec',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
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
    backgroundColor: '#ece9d9',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
