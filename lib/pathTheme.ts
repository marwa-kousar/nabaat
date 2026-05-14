import type { LearningPathId } from '../components/ChoosePathScreen';

/** Design tokens that follow the active learning path (Flutter `PathTheme.of` analogue). */
export type PathTheme = {
  id: LearningPathId;
  /** Header / path title (English) */
  titleEn: string;
  /** Primary brand (buttons, progress fill, key accents) */
  primary: string;
  /** Darker shade for borders and depth */
  primaryDark: string;
  /** Header title & chevron on cream */
  headerText: string;
  /** “Continue learning” label */
  continueLabel: string;
  /** Arabic lesson title on resume card */
  lessonTitleAr: string;
  /** Progress track tint */
  progressTrack: string;
  /** Progress highlight sheen */
  progressSheen: string;
  /** Nun / swatch key background behind letter glyph */
  swatchBg: string;
};

const THEMES: Record<LearningPathId, PathTheme> = {
  nahw: {
    id: 'nahw',
    titleEn: 'Nahw',
    primary: '#24c1a4',
    primaryDark: '#006052',
    headerText: '#006052',
    continueLabel: '#006052',
    lessonTitleAr: '#006052',
    progressTrack: '#d2efea',
    progressSheen: '#23d6b5',
    swatchBg: '#006052',
  },
  sarf: {
    id: 'sarf',
    titleEn: 'Sarf',
    primary: '#d76700',
    primaryDark: '#7c4718',
    headerText: '#7c4718',
    continueLabel: '#7c4718',
    lessonTitleAr: '#7c4718',
    progressTrack: '#ffe3c9',
    progressSheen: '#ffb347',
    swatchBg: '#7c4718',
  },
  tajweed: {
    id: 'tajweed',
    titleEn: 'Tajweed',
    primary: '#9a69fe',
    primaryDark: '#5b3d9e',
    headerText: '#5b3d9e',
    continueLabel: '#5b3d9e',
    lessonTitleAr: '#5b3d9e',
    progressTrack: '#e8deff',
    progressSheen: '#c4b5fc',
    swatchBg: '#5b3d9e',
  },
  qaida: {
    id: 'qaida',
    titleEn: 'Qa’ida',
    primary: '#e3c802',
    primaryDark: '#7c6a00',
    headerText: '#5c4f00',
    continueLabel: '#5c4f00',
    lessonTitleAr: '#5c4f00',
    progressTrack: '#faf0b8',
    progressSheen: '#f5e066',
    swatchBg: '#7c6a00',
  },
};

export function pathThemeOf(path: LearningPathId): PathTheme {
  return THEMES[path];
}
