import {
  DEFAULT_TRANSLATION_RESOURCE_ID,
  QURAN_API_V4,
  QURAN_AUDIO_CDN_BASE,
} from './quranCloudConstants';
import type { QuranVersePayload, QuranWordApi } from './quranCloudTypes';

export type AyahWord = {
  id: number;
  position: number;
  text: string;
  meaning: string;
  transliteration: string;
  /** Relative path from API, e.g. `wbw/002_183_004.mp3` */
  audioPath: string | null;
  charType: string;
};

export type AyahLabData = {
  verseKey: string;
  /** Full ayah Uthmani (joined words). */
  textUthmani: string;
  translation: string;
  translationAuthor: string;
  words: AyahWord[];
};

function buildWordAudioUrl(audioPath: string | null): string | null {
  if (!audioPath) return null;
  if (/^https?:\/\//i.test(audioPath)) return audioPath;
  return `${QURAN_AUDIO_CDN_BASE}/${audioPath.replace(/^\//, '')}`;
}

export function ayahRecitationUrlFromApiPath(relativePath: string): string {
  return `${QURAN_AUDIO_CDN_BASE}/${relativePath.replace(/^\//, '')}`;
}

/** Fetch verse + per-word fields from Quran.com public v4 API. */
export async function fetchAyahLabData(verseKey: string): Promise<AyahLabData> {
  const fields = 'text_uthmani';
  const wordFields = 'text_uthmani,translation,transliteration,audio_url,char_type_name,position';
  const verseUrl = `${QURAN_API_V4}/verses/by_key/${encodeURIComponent(verseKey)}?words=true&word_fields=${encodeURIComponent(wordFields)}&fields=${encodeURIComponent(fields)}`;
  const transUrl = `${QURAN_API_V4}/quran/translations/${DEFAULT_TRANSLATION_RESOURCE_ID}?verse_key=${encodeURIComponent(verseKey)}`;

  const [verseRes, transRes] = await Promise.all([fetch(verseUrl), fetch(transUrl)]);
  if (!verseRes.ok) {
    throw new Error(`Verse request failed (${verseRes.status})`);
  }
  const verseJson = (await verseRes.json()) as { verse: QuranVersePayload & { text_uthmani?: string } };
  const transJson = transRes.ok
    ? ((await transRes.json()) as {
        translations?: { text: string }[];
        meta?: { author_name?: string; translation_name?: string };
      })
    : { translations: [], meta: {} };

  const wordsRaw = verseJson.verse?.words ?? [];
  const words: AyahWord[] = wordsRaw
    .filter((w) => w.char_type_name === 'word')
    .map((w: QuranWordApi) => ({
      id: w.id,
      position: w.position,
      text: w.text_uthmani,
      meaning: w.translation?.text?.trim() ?? '—',
      transliteration: w.transliteration?.text?.trim() ?? '—',
      audioPath: w.audio_url,
      charType: w.char_type_name,
    }));

  const textUthmani =
    verseJson.verse?.text_uthmani?.trim() ||
    words.map((x) => x.text).join(' ').trim();

  const t0 = transJson.translations?.[0];
  const translation = (t0?.text ?? '').replace(/<[^>]+>/g, '').trim() || 'Translation unavailable offline.';
  const translationAuthor =
    transJson.meta?.author_name ?? transJson.meta?.translation_name ?? 'Translation';

  return {
    verseKey,
    textUthmani,
    translation,
    translationAuthor,
    words,
  };
}

/** Full-ayah MP3 path from recitations API (e.g. `Alafasy/mp3/002183.mp3`). */
export async function fetchAyahRecitationPath(
  verseKey: string,
  recitationId = 7,
): Promise<string | null> {
  const url = `${QURAN_API_V4}/recitations/${recitationId}/by_ayah/${encodeURIComponent(verseKey)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as { audio_files?: { url: string }[] };
  const rel = json.audio_files?.[0]?.url;
  return rel ? ayahRecitationUrlFromApiPath(rel) : null;
}

export { buildWordAudioUrl };
