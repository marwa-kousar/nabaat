import { useMemo } from 'react';
import { Platform, Text } from 'react-native';

import {
  buildArabicWordSpans,
  LESSON_LISTENING_COLOR,
  segmentListeningFlags,
} from '../lib/lessonSentenceAudio';
import type { ArabicTextSegment } from '../lib/lessonSteps';

const ARABIC_SEGMENT_COLORS = {
  default: '#006052',
  highlight: '#ff8c1a',
  highlightAlt: '#ff7d00',
  highlightAlt2: '#ff7f00',
} as const;

const textPad = Platform.select({ android: { includeFontPadding: false as const }, default: {} });

function ArabicSegmentText({
  segment,
  fontSize,
  listening,
}: {
  segment: ArabicTextSegment;
  fontSize: number;
  listening: boolean;
}) {
  if (segment.color === 'endingBadge') {
    return (
      <Text
        style={{
          fontFamily: 'NotoSansArabic_700Bold',
          fontSize,
          color: listening ? LESSON_LISTENING_COLOR : '#006052',
          backgroundColor: listening ? '#fff3e6' : '#eefffc',
          borderRadius: Math.max(4, Math.round((4 * fontSize) / 26)),
          ...textPad,
        }}
      >
        {segment.text}
      </Text>
    );
  }

  const key = segment.color ?? 'default';
  const baseColor =
    key in ARABIC_SEGMENT_COLORS ? ARABIC_SEGMENT_COLORS[key as keyof typeof ARABIC_SEGMENT_COLORS] : ARABIC_SEGMENT_COLORS.default;

  return (
    <Text
      style={{
        fontFamily: 'NotoSansArabic_700Bold',
        fontSize,
        color: listening ? LESSON_LISTENING_COLOR : baseColor,
        backgroundColor: listening ? 'rgba(255, 140, 26, 0.12)' : undefined,
        borderRadius: listening ? Math.max(4, Math.round((4 * fontSize) / 26)) : 0,
        ...textPad,
      }}
    >
      {segment.text}
    </Text>
  );
}

export type LessonArabicLineProps = {
  s: number;
  arabic: string;
  arabicSegments?: ArabicTextSegment[];
  listeningWordIndex: number | null;
  fontSize?: number;
  /** Plain-line fallback when there are no colored segments (compare screen). */
  plainColor?: string;
};

export function LessonArabicLine({
  s,
  arabic,
  arabicSegments,
  listeningWordIndex,
  fontSize,
  plainColor = '#006052',
}: LessonArabicLineProps) {
  const r = (n: number) => Math.round(n * s);
  const fs = fontSize ?? r(26);
  const lineHeight = r(-36);

  const segments = useMemo(
    () => (arabicSegments?.length ? arabicSegments : [{ text: arabic, color: 'default' as const }]),
    [arabic, arabicSegments],
  );

  const listeningFlags = useMemo(
    () => segmentListeningFlags(segments, arabic, listeningWordIndex),
    [segments, arabic, listeningWordIndex],
  );

  const words = useMemo(() => buildArabicWordSpans(arabic), [arabic]);
  const useWordLine = !arabicSegments?.length && words.length > 1;

  if (useWordLine) {
    return (
      <Text style={{ textAlign: 'center', marginTop: r(6), lineHeight, ...textPad }}>
        {words.map((word, i) => (
          <Text
            key={`${word.index}-${word.text}`}
            style={{
              fontFamily: 'NotoSansArabic_700Bold',
              fontSize: fs,
              color: listeningWordIndex === word.index ? LESSON_LISTENING_COLOR : plainColor,
              backgroundColor: listeningWordIndex === word.index ? 'rgba(255, 140, 26, 0.12)' : undefined,
              ...textPad,
            }}
          >
            {word.text}
            {i < words.length - 1 ? ' ' : ''}
          </Text>
        ))}
      </Text>
    );
  }

  return (
    <Text style={{ textAlign: 'center', marginTop: r(6), lineHeight, ...textPad }}>
      {segments.map((seg, i) => (
        <ArabicSegmentText key={`${i}-${seg.text}`} segment={seg} fontSize={fs} listening={listeningFlags[i]} />
      ))}
    </Text>
  );
}
