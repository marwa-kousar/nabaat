import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

import type { ArabicTextSegment } from './lessonSteps';
import { buildWordAudioUrl } from './quranCloudApi';
import { safeAudioPause, safeAudioPlayUri } from './safeExpoAudio';

export type LessonSentenceAudioInput = {
  arabic: string;
  audioKey?: string;
  arabicSegments?: ArabicTextSegment[];
  /** Remote or file URI — overrides `audioKey` map when set. */
  audioUri?: string | null;
};

export type LessonListenState = {
  sourceId: string;
  wordIndex: number | null;
};

export type LessonAudioTrackCallbacks = {
  /** Id of the sentence card that started playback (e.g. `sentence.id`). */
  sourceId: string;
  /** Active word index while playing, or `null` when idle. */
  onListeningWordIndex?: (index: number | null) => void;
};

type ListenSubscriber = (state: LessonListenState | null) => void;

let listenState: LessonListenState | null = null;
const listenSubscribers = new Set<ListenSubscriber>();

function publishListenState(state: LessonListenState | null): void {
  listenState = state;
  listenSubscribers.forEach((fn) => fn(listenState));
}

export function subscribeLessonListenState(fn: ListenSubscriber): () => void {
  listenSubscribers.add(fn);
  fn(listenState);
  return () => listenSubscribers.delete(fn);
}

function emitListening(sourceId: string, wordIndex: number | null, callbacks: LessonAudioTrackCallbacks): void {
  if (wordIndex === null) {
    if (listenState?.sourceId === sourceId) publishListenState(null);
  } else {
    publishListenState({ sourceId, wordIndex });
  }
  if (callbacks.sourceId === sourceId) {
    callbacks.onListeningWordIndex?.(wordIndex);
  }
}

export type ArabicWordSpan = {
  index: number;
  text: string;
  start: number;
  end: number;
};

/** Orange listen-along highlight (matches lesson `highlight` segments). */
export const LESSON_LISTENING_COLOR = '#ff8c1a';

let audioModePrimed = false;
let filePlayer: AudioPlayer | null = null;
let playSession = 0;

async function primeAudioMode(): Promise<void> {
  if (audioModePrimed) return;
  audioModePrimed = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {
    audioModePrimed = false;
  }
}

/** Optional Quran.com CDN paths keyed from lesson JSON (`audioKey`). */
const AUDIO_KEY_PATHS: Record<string, string> = {};

function resolveRecordedUri(input: LessonSentenceAudioInput): string | null {
  if (input.audioUri) return input.audioUri;
  const path = input.audioKey ? AUDIO_KEY_PATHS[input.audioKey] : undefined;
  if (!path) return null;
  return buildWordAudioUrl(path);
}

/** Word spans in visual order (RTL string positions). */
export function buildArabicWordSpans(arabic: string): ArabicWordSpan[] {
  const spans: ArabicWordSpan[] = [];
  const re = /\S+/g;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = re.exec(arabic)) !== null) {
    spans.push({
      index,
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
    index += 1;
  }
  return spans;
}

/** Which segment indices overlap the active spoken word. */
export function segmentListeningFlags(
  segments: ArabicTextSegment[],
  fullArabic: string,
  activeWordIndex: number | null,
): boolean[] {
  if (activeWordIndex == null) return segments.map(() => false);
  const word = buildArabicWordSpans(fullArabic)[activeWordIndex];
  if (!word) return segments.map(() => false);

  let pos = 0;
  return segments.map((seg) => {
    const segStart = pos;
    const segEnd = pos + seg.text.length;
    pos = segEnd;
    return segEnd > word.start && segStart < word.end;
  });
}

function speakArabicWord(text: string): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: 'ar',
      rate: 0.78,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

async function playRecordedUri(
  uri: string,
  words: ArabicWordSpan[],
  callbacks: LessonAudioTrackCallbacks,
  session: number,
): Promise<void> {
  await primeAudioMode();
  Speech.stop();
  if (!filePlayer) {
    filePlayer = createAudioPlayer(null, { updateInterval: 80 });
  }
  const started = await safeAudioPlayUri(filePlayer, uri);
  if (!started) return;

  const weights = words.map((w) => Math.max(1, w.text.length));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  await new Promise<void>((resolve) => {
    const tick = () => {
      if (session !== playSession) {
        resolve();
        return;
      }
      const dur = filePlayer?.duration ?? 0;
      const t = filePlayer?.currentTime ?? 0;
      if (dur <= 0) return;

      const ratio = Math.min(1, Math.max(0, t / dur));
      let acc = 0;
      let wordIndex = words.length - 1;
      for (let i = 0; i < words.length; i += 1) {
        acc += weights[i] / totalWeight;
        if (ratio <= acc) {
          wordIndex = i;
          break;
        }
      }
      emitListening(callbacks.sourceId, wordIndex, callbacks);

      if (!filePlayer?.playing && t >= dur - 0.08) {
        emitListening(callbacks.sourceId, null, callbacks);
        resolve();
      }
    };

    const interval = setInterval(tick, 80);
    tick();
    const stopPoll = setTimeout(() => {
      clearInterval(interval);
      if (session === playSession) {
        emitListening(callbacks.sourceId, null, callbacks);
      }
      resolve();
    }, 120_000);

    const checkDone = setInterval(() => {
      if (session !== playSession) {
        clearInterval(interval);
        clearInterval(checkDone);
        clearTimeout(stopPoll);
        resolve();
        return;
      }
      const dur = filePlayer?.duration ?? 0;
      const t = filePlayer?.currentTime ?? 0;
      if (dur > 0 && !filePlayer?.playing && t >= dur - 0.1) {
        clearInterval(interval);
        clearInterval(checkDone);
        clearTimeout(stopPoll);
        emitListening(callbacks.sourceId, null, callbacks);
        resolve();
      }
    }, 120);
  });
}

async function playWordsWithTts(
  words: ArabicWordSpan[],
  callbacks: LessonAudioTrackCallbacks,
  session: number,
): Promise<void> {
  await primeAudioMode();
  for (const word of words) {
    if (session !== playSession) break;
    emitListening(callbacks.sourceId, word.index, callbacks);
    await speakArabicWord(word.text);
  }
  if (session === playSession) {
    emitListening(callbacks.sourceId, null, callbacks);
  }
}

/** Stops lesson sentence playback (TTS or file) and clears listen highlight. */
export function stopLessonSentenceAudio(callbacks?: Pick<LessonAudioTrackCallbacks, 'sourceId' | 'onListeningWordIndex'>): void {
  playSession += 1;
  Speech.stop();
  safeAudioPause(filePlayer);
  publishListenState(null);
  callbacks?.onListeningWordIndex?.(null);
}

/**
 * Plays a lesson example sentence with per-word Arabic highlight.
 * Uses recorded audio when configured; otherwise speaks word-by-word via TTS.
 */
export async function playLessonSentenceAudio(
  input: LessonSentenceAudioInput,
  callbacks: LessonAudioTrackCallbacks,
): Promise<void> {
  const arabic = input.arabic?.trim();
  if (!arabic) return;

  const session = ++playSession;
  Speech.stop();
  safeAudioPause(filePlayer);

  const words = buildArabicWordSpans(arabic);
  if (!words.length) return;

  emitListening(callbacks.sourceId, null, callbacks);

  const recorded = resolveRecordedUri(input);
  if (recorded) {
    try {
      await playRecordedUri(recorded, words, callbacks, session);
      return;
    } catch {
      /* fall through to TTS */
    }
  }

  if (session !== playSession) return;
  await playWordsWithTts(words, callbacks, session);
}
