export type QuranWordApi = {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string;
  text_uthmani: string;
  translation?: { text: string; language_name?: string };
  transliteration?: { text: string | null; language_name?: string };
};

export type QuranVersePayload = {
  verse_key: string;
  words: QuranWordApi[];
};
