/** Quran.com CDN (used by api.quran.com word/ayah audio paths). */
export const QURAN_AUDIO_CDN_BASE = 'https://audio.qurancdn.com';

/** Public Quran.com v4 HTTP API (verse + word-by-word + translations). */
export const QURAN_API_V4 = 'https://api.quran.com/api/v4';

/** Default recitation id (must match `chapter_recitations` for word-level timing). Mishari Rashid Alafasy — see `/api/v4/recitations`. */
export const DEFAULT_RECITATION_ID = 7;

/** Default translation resource (M.A.S. Abdel Haleem) — id from Quran.com API. */
export const DEFAULT_TRANSLATION_RESOURCE_ID = 85;

/**
 * Default tafsir resource (Ibn Kathir Abridged, English) — id from `/api/v4/resources/tafsirs`.
 * Override with `EXPO_PUBLIC_QURAN_TAFSIR_RESOURCE_ID` (e.g. 168 for Ma‘arif al-Qur’an).
 */
const envTafsirId = parseInt(process.env.EXPO_PUBLIC_QURAN_TAFSIR_RESOURCE_ID ?? '', 10);
export const DEFAULT_TAFSIR_RESOURCE_ID =
  Number.isFinite(envTafsirId) && envTafsirId > 0 ? envTafsirId : 169;
