import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';

import IconAudio from '../assets/ayah-lab/icon-audio.svg';
import IconBookmark from '../assets/ayah-lab/icon-bookmark.svg';
import IconGrammar from '../assets/ayah-lab/icon-grammar.svg';
import IconReflection from '../assets/ayah-lab/icon-reflection.svg';
import IconSun from '../assets/ayah-lab/icon-sun.svg';
import IconTafsir from '../assets/ayah-lab/icon-tafsir.svg';
import IconTajweed from '../assets/ayah-lab/icon-tajweed.svg';
import IconTap from '../assets/ayah-lab/icon-tap.svg';
import IconWordByWord from '../assets/ayah-lab/icon-word-by-word.svg';

/** Figma exports (node 1401:5871) — SVG files; use as <Component width={…} height={…} />. */
export type AyahLabSvg = FC<SvgProps>;

export const ayahLabIcons = {
  tafsir: IconTafsir,
  wordByWord: IconWordByWord,
  grammar: IconGrammar,
  tajweed: IconTajweed,
  reflection: IconReflection,
  audio: IconAudio,
  bookmark: IconBookmark,
  sun: IconSun,
  tap: IconTap,
} as const;
