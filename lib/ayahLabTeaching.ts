import type { AyahWord } from './quranCloudApi';

export type WordTeaching = {
  /** Friendly label shown in the sheet (Nahw / Sarf / general). */
  type: string;
  /** Arabic root letters with spaces, when we can infer for teaching. */
  root: string | null;
  /** Short line connecting the ayah to your course themes. */
  teachingNote: string;
};

const KTB = 'ك ت ب';

/** Heuristic + curated notes — extend per lesson or from CMS later. */
export function teachingForWord(word: AyahWord, verseKey: string): WordTeaching {
  const t = word.text.replace(/\u0640/g, '').trim();
  const trans = word.meaning.toLowerCase();
  const translit = word.transliteration.toLowerCase();

  // كُتِبَ (passive verb, root k-t-b)
  if (t === 'كُتِبَ' || translit.includes('kutib')) {
    return {
      type: 'Verb (passive)',
      root: KTB,
      teachingNote: 'Nahw tracks how the verb shows “it was written / prescribed” without naming who did it — passive voice in one word.',
    };
  }

  if (t.includes('صِّيَام') || trans.includes('fast')) {
    return {
      type: 'Noun (masdar / noun of action context)',
      root: 'ص و م',
      teachingNote: 'Here الصِّيَامُ names the practice itself — watch how definite الْ ties the sentence together in later lessons.',
    };
  }

  if (t === 'ءَامَنُوا۟' || translit.includes('āman')) {
    return {
      type: 'Verb (perfect, plural)',
      root: 'أ م ن',
      teachingNote: 'A whole group “believed” — plural shape on the verb matches يَـٰٓأَيُّهَا ٱلَّذِينَ آمَنُوا (O you who believe).',
    };
  }

  if (t === 'عَلَيْكُمُ' || t === 'عَلَى') {
    return {
      type: 'Preposition + pronoun',
      root: null,
      teachingNote: 'عَلَى often sets “upon / on” relationships — Nahw will label what each word depends on.',
    };
  }

  if (verseKey === '2:183' && (t === 'ٱلَّذِينَ' || translit.includes('alladh'))) {
    return {
      type: 'Relative noun (ism mawṣūl)',
      root: null,
      teachingNote: 'الَّذِينَ pulls the description back to “those who…” — a classic Nahw connector in Qur’anic style.',
    };
  }

  return {
    type: 'Word',
    root: null,
    teachingNote: 'Keep tapping: patterns repeat across the Qur’an, and Nahw names each pattern so you read with confidence.',
  };
}
