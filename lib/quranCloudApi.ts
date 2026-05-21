import {
  DEFAULT_RECITATION_ID,
  DEFAULT_TAFSIR_RESOURCE_ID,
  DEFAULT_TRANSLATION_RESOURCE_ID,
  QURAN_API_V4,
  QURAN_AUDIO_CDN_BASE,
} from './quranCloudConstants';
import { tafsirHtmlToPlain } from './quranHtmlPlain';
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
      text: (w.text_uthmani ?? '').trim(),
      meaning: (w.translation?.text ?? '').trim() || '—',
      transliteration: (w.transliteration?.text ?? '').trim() || '—',
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

export type TafsirForAyah = {
  textPlain: string;
  resourceName: string;
  verseKey: string;
  resourceId: number;
};

/**
 * Tafsīr for one ayah from Quran.com v4 (Quran Foundation content API).
 * @see https://api.quran.com/api/v4/tafsirs/{resource_id}/by_ayah/{verse_key}
 */
export async function fetchTafsirForAyah(
  verseKey: string,
  resourceId: number = DEFAULT_TAFSIR_RESOURCE_ID,
): Promise<TafsirForAyah> {
  const url = `${QURAN_API_V4}/tafsirs/${resourceId}/by_ayah/${encodeURIComponent(verseKey)}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    tafsir?: { text?: string; resource_name?: string };
    message?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(json.message ?? json.error ?? `Tafsir request failed (${res.status})`);
  }
  const raw = json.tafsir?.text?.trim() ?? '';
  if (!raw) {
    throw new Error('No tafsir text returned for this verse.');
  }
  return {
    verseKey,
    resourceId,
    resourceName: json.tafsir?.resource_name?.trim() || 'Tafsir',
    textPlain: tafsirHtmlToPlain(raw),
  };
}

/** Full-ayah MP3 path from recitations API (e.g. `Alafasy/mp3/002183.mp3`). */

/** One word’s start/end (seconds) within the per-ayah MP3 for the default reciter. */
export type AyahWordTiming = {
  position: number;
  startSec: number;
  endSec: number;
};

type ChapterTimestampRow = {
  verse_key: string;
  segments?: [number, number, number][];
};

const chapterVerseTimingsCache = new Map<string, Map<string, AyahWordTiming[]>>();

function verseTimingsFromSegments(segments: [number, number, number][]): AyahWordTiming[] {
  if (!segments.length) return [];
  const t0 = segments[0]![1];
  return segments.map(([position, startMs, endMs]) => ({
    position,
    startSec: (startMs - t0) / 1000,
    endSec: (endMs - t0) / 1000,
  }));
}

/**
 * Word-level timestamps for full-ayah audio (same recitation as `fetchAyahRecitationPath`).
 * Pulled from `chapter_recitations/{id}/{chapter}?segments=true` and aligned to the ayah clip.
 */
export async function fetchAyahRecitationWordTimings(
  verseKey: string,
  recitationId: number = DEFAULT_RECITATION_ID,
): Promise<AyahWordTiming[] | null> {
  const parts = verseKey.split(':');
  if (parts.length < 2) return null;
  const chapter = parseInt(parts[0]!, 10);
  if (!Number.isFinite(chapter) || chapter < 1) return null;

  const cacheKey = `${recitationId}:${chapter}`;
  let verseMap = chapterVerseTimingsCache.get(cacheKey);
  if (!verseMap) {
    const url = `${QURAN_API_V4}/chapter_recitations/${recitationId}/${chapter}?segments=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      audio_file?: { timestamps?: ChapterTimestampRow[] };
    };
    const rows = json.audio_file?.timestamps;
    if (!rows?.length) return null;

    verseMap = new Map<string, AyahWordTiming[]>();
    for (const row of rows) {
      const segs = row.segments;
      if (!segs?.length) continue;
      verseMap.set(row.verse_key, verseTimingsFromSegments(segs));
    }
    chapterVerseTimingsCache.set(cacheKey, verseMap);
  }

  return verseMap.get(verseKey) ?? null;
}

export async function fetchAyahRecitationPath(
  verseKey: string,
  recitationId: number = DEFAULT_RECITATION_ID,
): Promise<string | null> {
  const url = `${QURAN_API_V4}/recitations/${recitationId}/by_ayah/${encodeURIComponent(verseKey)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as { audio_files?: { url: string }[] };
  const rel = json.audio_files?.[0]?.url;
  return rel ? ayahRecitationUrlFromApiPath(rel) : null;
}

export type LessonAyahWord = {
  id: number;
  position: number;
  text: string;
};

export type LessonAyahData = {
  verseKey: string;
  textUthmani: string;
  transliteration: string;
  translation: string;
  /** e.g. `-Qur'an 12:2` */
  referenceLabel: string;
  /** Full-ayah MP3 from Quran.com recitations API. */
  audioUri: string | null;
  words: LessonAyahWord[];
};

function verseKeyToReferenceLabel(verseKey: string): string {
  const [surah, ayah] = verseKey.split(':');
  if (!surah || !ayah) return verseKey;
  return `-Qur'an ${surah}:${ayah}`;
}

/** Verse text + recitation audio for lesson screens (Quran.com v4). */
export async function fetchLessonAyah(verseKey: string): Promise<LessonAyahData> {
  const [data, audioUri] = await Promise.all([fetchAyahLabData(verseKey), fetchAyahRecitationPath(verseKey)]);
  const transliteration = data.words
    .map((w) => w.transliteration)
    .filter((t) => t && t !== '—')
    .join(' ')
    .trim();
  return {
    verseKey: data.verseKey,
    textUthmani: data.textUthmani,
    transliteration: transliteration || '—',
    translation: data.translation.startsWith('"') ? data.translation : `“${data.translation}”`,
    referenceLabel: verseKeyToReferenceLabel(verseKey),
    audioUri,
    words: data.words.map((w) => ({ id: w.id, position: w.position, text: w.text })),
  };
}

export { buildWordAudioUrl };
