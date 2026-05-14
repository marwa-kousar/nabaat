import type { AyahWord } from './quranCloudApi';

/** Soft listening cues for Recitation focus — not full tajwīd markup (API-dependent later). */
export function recitationListenCue(word: AyahWord): string {
  const t = word.text;
  const tr = word.transliteration.toLowerCase();

  if (t.includes('ٱل') || t.includes('اللَّه')) {
    return 'Notice the light lam on alif–lām (الـ) before Allah’s name — keep the flow smooth into the next syllable.';
  }
  if (t.includes('ّ')) {
    return 'Shaddah doubles the letter: hold the consonant slightly longer before moving on.';
  }
  if (t.includes('ٱ') || t.includes('أ')) {
    return 'Hamza entries often carry a crisp catch in the throat; match the reciter’s pause, not a hard stop.';
  }
  if (tr.includes('kutib') || t === 'كُتِبَ') {
    return 'Passive verb: let the “i” vowel stay light so the line stays gentle, like the reciter’s fall on the last syllable.';
  }
  if (t.includes('و') && word.meaning.toLowerCase().includes('and')) {
    return 'Waaw as “and”: connect breath into the next word without clipping the vowel before it.';
  }
  return 'Follow the reciter’s timing: repeat the word audio, then the full ayah, until your mouth matches the melody.';
}
