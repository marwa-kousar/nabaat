/** Lesson step payloads stored in `*_units.json` under each lesson. */

export type ArabicTextSegment = {
  text: string;
  /** default = teal; highlight* = orange; endingBadge = teal pill on tanween (tap-endings screen) */
  color?: 'default' | 'highlight' | 'highlightAlt' | 'highlightAlt2' | 'endingBadge';
};

export type TanweenEndingPreview = {
  arabicSegments: ArabicTextSegment[];
  transliteration: string;
  translation: string;
};

export type TanweenEndingOption = {
  id: string;
  /** Isolated tanween glyph shown large on the tile (ٌ ٍ ً). */
  symbol: string;
  arabicLabel: string;
  transliteration: string;
  /** Symbol color when tile is not selected (default = teal, muted = black). */
  symbolColor?: 'default' | 'muted';
  /** Main sentence card updates to this when the tile is tapped. */
  preview: TanweenEndingPreview;
};

export type LessonSentenceCard = {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  /** Optional audio URI or bundled asset key (future). */
  audioKey?: string;
  /** When set, renders colored ending highlights instead of plain `arabic`. */
  arabicSegments?: ArabicTextSegment[];
};

export type LessonCompareOption = {
  id: string;
  label: string;
  correct: boolean;
};

export type LessonCompareFeedback = {
  titleAr?: string;
  titleEn: string;
  /** Optional second line under title (e.g. “Look carefully at the endings.”). */
  titleSub?: string;
  message: string;
  rewardSeeds: number;
};

export type LessonCompareWrongFeedback = {
  titleEn: string;
  titleSub: string;
  message: string;
};

export type LessonSentenceCompareStep = {
  kind: 'sentenceCompare';
  id: string;
  /** 0–1 progress fill for the top bar on this step. */
  progress?: number;
  question: string;
  /** Shown beside the question (e.g. sprout emoji in Figma). */
  questionEmoji?: string;
  instruction: string;
  sentences: [LessonSentenceCard, LessonSentenceCard];
  choicePrompt: string;
  options: [LessonCompareOption, LessonCompareOption];
  feedback: LessonCompareFeedback;
  wrongFeedback?: LessonCompareWrongFeedback;
};

export type LessonEndingsRevealStep = {
  kind: 'endingsReveal';
  id: string;
  /** Progress before tapping the reveal card. */
  progress?: number;
  /** Progress after reveal (optional; defaults slightly ahead of `progress`). */
  progressRevealed?: number;
  headline: { title: string; subtitle: string };
  revealCard: {
    tapLabel: string;
    tapHint: string;
    body: string;
  };
  sentences: [LessonSentenceCard, LessonSentenceCard];
  footerInsight: {
    message: string;
    rewardSeeds: number;
  };
};

export type LessonTapEndingsStep = {
  kind: 'tapEndings';
  id: string;
  progress?: number;
  headline: { title: string; subtitle: string };
  /** Shown before any ending tile is tapped; defaults to first ending’s preview. */
  example?: LessonSentenceCard;
  tapPrompt: string;
  endings: [TanweenEndingOption, TanweenEndingOption, TanweenEndingOption];
  footerInsight: {
    titleAr: string;
    message: string;
    rewardSeeds: number;
  };
};

export type LessonWhyNahwOptionIcon = 'quran' | 'shield' | 'lightbulb' | 'all';

export type LessonWhyNahwOption = {
  id: string;
  label: string;
  correct: boolean;
  icon: LessonWhyNahwOptionIcon;
};

export type LessonWhyNahwStep = {
  kind: 'whyNahw';
  id: string;
  progress?: number;
  question: string;
  questionEmoji?: string;
  options: [LessonWhyNahwOption, LessonWhyNahwOption, LessonWhyNahwOption, LessonWhyNahwOption];
  /** Quran.com verse key, e.g. `12:2` (Surah Yusuf). */
  ayahVerseKey: string;
  feedback: {
    titleAr: string;
    titleEn: string;
    message: string;
    rewardSeeds: number;
  };
};

export type LessonReflectStep = {
  kind: 'reflect';
  id: string;
  progress?: number;
  title: string;
  prompt: string;
  inputPlaceholder: string;
  /** Minimum characters before Continue unlocks (default 3). */
  minChars?: number;
  feedback: {
    titleAr: string;
    titleEn: string;
    message: string;
    rewardSeeds: number;
  };
};

export type LessonCompleteStep = {
  kind: 'lessonComplete';
  id: string;
  lessonNumber: number;
  title: string;
  subtitle: string;
  learnedTitle: string;
  learned: string[];
  canNowTitle: string;
  canNow: string[];
  rewards: {
    totalSeeds: number;
    reflectionsSaved: number;
    streakMaintained: boolean;
    streakMessageAr?: string;
  };
};

export type LessonStepJson =
  | LessonSentenceCompareStep
  | LessonEndingsRevealStep
  | LessonTapEndingsStep
  | LessonWhyNahwStep
  | LessonReflectStep
  | LessonCompleteStep;

export function isSentenceCompareStep(step: LessonStepJson): step is LessonSentenceCompareStep {
  return step.kind === 'sentenceCompare';
}

export function isEndingsRevealStep(step: LessonStepJson): step is LessonEndingsRevealStep {
  return step.kind === 'endingsReveal';
}

export function isTapEndingsStep(step: LessonStepJson): step is LessonTapEndingsStep {
  return step.kind === 'tapEndings';
}

export function isWhyNahwStep(step: LessonStepJson): step is LessonWhyNahwStep {
  return step.kind === 'whyNahw';
}

export function isReflectStep(step: LessonStepJson): step is LessonReflectStep {
  return step.kind === 'reflect';
}

export function isLessonCompleteStep(step: LessonStepJson): step is LessonCompleteStep {
  return step.kind === 'lessonComplete';
}
