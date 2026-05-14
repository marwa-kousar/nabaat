/**
 * Example in-app lesson content — rich examples, Nabaat rewards per part.
 * Swap for JSON/CMS later; rewards can sync to profile/Firestore.
 */

export type ReadExample = {
  label: string;
  ar: string;
  en: string;
  /** One-line “why it’s fun / what to notice” */
  note: string;
};

export type ReadScrollStep = {
  kind: 'readScroll';
  id: string;
  title: string;
  titleAr?: string;
  paragraphs: string[];
  examples?: ReadExample[];
};

export type TapRevealCard = {
  id: string;
  headline: string;
  detail: string;
};

export type TapRevealStep = {
  kind: 'tapReveal';
  id: string;
  title: string;
  intro: string;
  cards: TapRevealCard[];
};

export type TrueFalseStep = {
  kind: 'trueFalse';
  id: string;
  title: string;
  statement: string;
  correctIsTrue: boolean;
  wrongHint?: string;
};

export type QuizStep = {
  kind: 'quiz';
  id: string;
  title: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  wrongHint?: string;
};

export type CompleteStep = {
  kind: 'complete';
  id: string;
  title: string;
  body: string;
  doneLabel: string;
};

export type ExampleLessonStep = ReadScrollStep | TapRevealStep | TrueFalseStep | QuizStep | CompleteStep;

/** Nabaat earned when the learner taps Next after finishing each gated part (indices 0..3). */
export const NABAAT_REWARD_ON_NEXT = [18, 14, 12, 22] as const;

/** Extra Nabaat when leaving the completion screen for home. */
export const NABAAT_COMPLETION_BONUS = 28;

export function getExampleLessonSteps(): ExampleLessonStep[] {
  return [
    {
      kind: 'readScroll',
      id: 'intro',
      title: 'Big picture',
      titleAr: 'نَظْرَةٌ عَامَّةٌ',
      paragraphs: [
        'Nahw (النَّحْو) is the grammar of Arabic: how words sit in a sentence and which endings (إعراب) tell you if something is the doer, the object, after a preposition, and so on.',
        'Think of it like sentence detective work: you are not memorising random rules first—you are learning how Arabic signals meaning with tiny changes at the end of words.',
        'Scroll through the bite-sized examples below, then keep going to the bottom to unlock the next part.',
      ],
      examples: [
        {
          label: 'Warm-up 1 · a simple sentence',
          ar: 'الْمُدَرِّسُ مُجْتَهِدٌ',
          en: '“The teacher is diligent.”',
          note: 'Here Nahw asks: who is the sentence about? What is being said about them? (We’ll name those pieces formally in later lessons.)',
        },
        {
          label: 'Warm-up 2 · same idea, new word',
          ar: 'الطَّالِبُ مُبْتَسِمٌ',
          en: '“The student is smiling.”',
          note: 'Same pattern, different vocabulary—Nahw cares about the roles and endings, not the topic of the sentence.',
        },
        {
          label: 'Tiny taste of endings',
          ar: 'رَأَيْتُ طَالِبًا',
          en: '“I saw a student.”',
          note: 'The ending on طالبًا hints it is the “seen thing” here. You do not need the rule name yet—just notice that the ending carries information.',
        },
      ],
    },
    {
      kind: 'tapReveal',
      id: 'ideas',
      title: 'Three “aha!” moments',
      intro: 'Tap each card—little surprises about how Nahw shows up in real Arabic.',
      cards: [
        {
          id: 'c1',
          headline: 'Arabic loves short words, big jobs',
          detail:
            'Particles like قد or سوف can squeeze a lot of tense or aspect into one syllable. Nahw tells you what job that syllable is doing so you do not misread a verse.',
        },
        {
          id: 'c2',
          headline: 'Same letters, different story',
          detail:
            'Compare الْمُدَرِّسُ (subject-ish spotlight) with seeing the same noun after a verb with a different ending. Nahw is the toolkit for explaining why the ending changed.',
        },
        {
          id: 'c3',
          headline: 'Why it feels like a game',
          detail:
            'Each lesson will mix real phrases, quick checks, and silly distractors on purpose—like spotting which ending is “lying” about the role of the word.',
        },
      ],
    },
    {
      kind: 'trueFalse',
      id: 'tf1',
      title: 'Lightning round',
      statement: 'If you only change tashkīl (vowel marks) on a word but keep the letters the same, Nahw never cares.',
      correctIsTrue: false,
      wrongHint: 'Harakat can change how we read roles and even word boundaries—Nahw absolutely cares about that.',
    },
    {
      kind: 'quiz',
      id: 'mcq1',
      title: 'Spot the Nahw question',
      prompt:
        'You see الْبَيْتُ كَبِيرٌ (“The house is big.”). Which question is most “Nahw-style”?',
      options: [
        { id: 'a', label: 'Which syllable should be sung louder?' },
        { id: 'b', label: 'How do we know who the sentence is about and what is being said about them?' },
        { id: 'c', label: 'What is the three-letter root of this verb?' },
      ],
      correctOptionId: 'b',
      wrongHint: 'Nahw starts with structure and roles in the sentence—volume is Tajweed territory; roots are Sarf.',
    },
    {
      kind: 'complete',
      id: 'done',
      title: 'You levelled up!',
      body:
        'You read real snippets, flipped the “aha!” cards, dodged a trick statement, and nailed a Nahw-style question—and you stacked Nabaat points every time you cleared a part. Next up: saving those points to your profile, streaks, and friend challenges.',
      doneLabel: 'Back to home',
    },
  ];
}
