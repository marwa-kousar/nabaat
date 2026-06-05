import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  useFonts as useFredoka,
} from '@expo-google-fonts/fredoka';
import {
  NotoSansArabic_500Medium,
  NotoSansArabic_700Bold,
  useFonts as useNotoArabic,
} from '@expo-google-fonts/noto-sans-arabic';
import { Nunito_700Bold, Nunito_800ExtraBold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useAuthRequest, makeRedirectUri, ResponseType } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppDimensions } from '../lib/useAppDimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LearningPathId } from './ChoosePathScreen';
import { UiTapPressable } from './UiTapPressable';
import { pathThemeOf } from '../lib/pathTheme';
import { ayahLabIcons } from '../lib/ayahLabAssets';
import { recitationListenCue } from '../lib/ayahLabRecitationHints';
import { teachingForWord } from '../lib/ayahLabTeaching';
import { exchangeCodeOnBackend, refreshOnBackend } from '../lib/qfBackendExchange';
import { qfAddCollectionBookmark, qfDeleteCollectionBookmarkByDetails } from '../lib/qfBookmarks';
import { QF_CLIENT_ID, QF_OAUTH_SCOPES, QF_USER_API_BASE, qfDiscovery } from '../lib/qfEnv';
import {
  QF_NOTE_BODY_MIN_LENGTH,
  qfCreateNote,
  qfDeleteNote,
  qfListNotesByVerse,
  qfPatchNote,
  verseKeyToNoteRange,
} from '../lib/qfUserNotes';
import { safeAudioPlayUri } from '../lib/safeExpoAudio';
import {
  buildWordAudioUrl,
  fetchAyahLabData,
  fetchAyahRecitationPath,
  fetchAyahRecitationWordTimings,
  fetchTafsirForAyah,
  type AyahWord,
} from '../lib/quranCloudApi';

WebBrowser.maybeCompleteAuthSession();

const FIGMA_W = 393;
const SECURE_REFRESH = 'qf_refresh_token';
const SECURE_ACCESS = 'qf_access_token';

/** Verse keys synced via Quran Foundation collections API on this device (cleared on sign-out). */
const QF_BOOKMARKED_VERSE_KEYS = 'qf_bookmarked_verse_keys_json';

async function readBookmarkedVerseKeySet(): Promise<Set<string>> {
  try {
    const raw = await SecureStore.getItemAsync(QF_BOOKMARKED_VERSE_KEYS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

async function persistBookmarkedVerseKeySet(next: Set<string>) {
  await SecureStore.setItemAsync(QF_BOOKMARKED_VERSE_KEYS, JSON.stringify([...next]));
}

async function markVerseBookmarkSynced(verseKey: string) {
  const s = await readBookmarkedVerseKeySet();
  s.add(verseKey);
  await persistBookmarkedVerseKeySet(s);
}

async function unmarkVerseBookmarkSynced(verseKey: string) {
  const s = await readBookmarkedVerseKeySet();
  s.delete(verseKey);
  await persistBookmarkedVerseKeySet(s);
}

async function clearBookmarkedVerseKeyStore() {
  await SecureStore.deleteItemAsync(QF_BOOKMARKED_VERSE_KEYS).catch(() => {});
}

/** Maps `verseKey` → Quran Foundation note id for last create/update (cleared on sign-out). */
const QF_REFLECTION_NOTE_IDS = 'qf_reflection_note_ids_json';

async function readReflectionNoteIdMap(): Promise<Record<string, string>> {
  try {
    const raw = await SecureStore.getItemAsync(QF_REFLECTION_NOTE_IDS);
    if (!raw) return {};
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== 'object' || Array.isArray(o)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && v.length > 0) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

async function setReflectionNoteIdForVerse(verseKey: string, noteId: string | null) {
  const m = await readReflectionNoteIdMap();
  if (noteId) m[verseKey] = noteId;
  else delete m[verseKey];
  await SecureStore.setItemAsync(QF_REFLECTION_NOTE_IDS, JSON.stringify(m));
}

async function clearReflectionNoteIdStore() {
  await SecureStore.deleteItemAsync(QF_REFLECTION_NOTE_IDS).catch(() => {});
}

/** Quranic Arabic — same face as the original Ayah Lab (Noto Sans Arabic Bold). */
const QURAN_ARABIC_FONT = 'NotoSansArabic_700Bold';

/** Shared neutrals (path accents come from `pathThemeOf`). */
const NEUTRAL = {
  pageBg: '#fef9f5',
  muted: '#737373',
  muted2: '#949494',
  inputBg: '#eaeaea',
  cardBorder: 'rgba(0,0,0,0.1)',
} as const;

const INSIGHT_TABS = [
  { id: 'tafsir' as const, label: 'Tafsir', Icon: ayahLabIcons.tafsir },
  { id: 'wordByWord' as const, label: 'Word by Word', Icon: ayahLabIcons.wordByWord },
  { id: 'grammar' as const, label: 'Grammar', Icon: ayahLabIcons.grammar },
  { id: 'tajweed' as const, label: 'Tajweed', Icon: ayahLabIcons.tajweed },
  { id: 'reflection' as const, label: 'Reflection', Icon: ayahLabIcons.reflection },
] as const;

export type InsightTabId = (typeof INSIGHT_TABS)[number]['id'];

function defaultInsightTabForPath(path: LearningPathId): InsightTabId {
  if (path === 'nahw') return 'grammar';
  return 'wordByWord';
}

const TapGlyph = ayahLabIcons.tap;
const SunGlyph = ayahLabIcons.sun;
const AudioGlyph = ayahLabIcons.audio;
const BookmarkGlyph = ayahLabIcons.bookmark;
const BookmarkFilledGlyph = ayahLabIcons.bookmarkFilled;

export type TodaysConnection = {
  lessonTitle: string;
  unitLabel?: string;
  ayahRef: string;
  onOpenLesson: () => void;
};

export type AyahLabScreenProps = {
  learningPath: LearningPathId;
  verseKey?: string;
  variant?: 'stack' | 'tab';
  onBack?: () => void;
  tabBarBottomInset?: number;
  todaysConnection?: TodaysConnection;
};

function r(n: number, s: number) {
  return Math.round(n * s);
}

const textPad = Platform.select({ android: { includeFontPadding: false as const }, default: {} });

function reflectionKey(verseKey: string) {
  return `ayah_lab_reflect_${verseKey.replace(':', '_')}`;
}

function surahAyahLabel(verseKey: string) {
  const [s, a] = verseKey.split(':');
  return `(Qur’an ${s}:${a})`;
}

export function AyahLabScreen({
  learningPath = 'nahw',
  verseKey = '2:183',
  variant = 'stack',
  onBack,
  tabBarBottomInset = 0,
  todaysConnection,
}: AyahLabScreenProps) {
  const { width: W } = useAppDimensions();
  const insets = useSafeAreaInsets();
  const s = W / FIGMA_W;
  const isTab = variant === 'tab';

  const theme = useMemo(() => pathThemeOf(learningPath), [learningPath]);

  const [fredokaLoaded] = useFredoka({ Fredoka_500Medium, Fredoka_600SemiBold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_500Medium, NotoSansArabic_700Bold });

  const [ayah, setAyah] = useState<Awaited<ReturnType<typeof fetchAyahLabData>> | null>(null);
  const [ayahAudioUri, setAyahAudioUri] = useState<string | null>(null);
  const [ayahWordTimings, setAyahWordTimings] = useState<Awaited<ReturnType<typeof fetchAyahRecitationWordTimings>>>(null);
  const [syncAyahWordHighlight, setSyncAyahWordHighlight] = useState(false);
  /** Word highlighted after “tap to hear” (per-word clip); cleared when clip ends. */
  const [hearTapWordPosition, setHearTapWordPosition] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [insightTab, setInsightTab] = useState<InsightTabId>(() =>
    defaultInsightTabForPath(learningPath),
  );
  const [selected, setSelected] = useState<AyahWord | null>(null);

  useEffect(() => {
    setInsightTab(defaultInsightTabForPath(learningPath));
  }, [learningPath]);

  const [reflectionText, setReflectionText] = useState('');
  const [reflectionNote, setReflectionNote] = useState<string | null>(null);
  const [reflectionSaving, setReflectionSaving] = useState(false);

  const oauthPromptLockRef = useRef(false);
  /** PKCE verifier captured when the browser login opens (stable for the redirect round-trip). */
  const pkceVerifierRef = useRef<string | null>(null);
  /** Auth codes we already exchanged or are exchanging (blocks Strict Mode double-calls). */
  const oauthCodeHandledRef = useRef<string | null>(null);
  const oauthExchangeInFlightRef = useRef<string | null>(null);
  const [oauthPromptOpen, setOauthPromptOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  /** True only after word `playUri` finishes; prevents highlight clear on stale status before the new clip loads. */
  const hearTapArmedRef = useRef(false);
  const prevPlayingForHearTapRef = useRef(false);

  const audioPlayer = useAudioPlayer(null, { updateInterval: 70 });
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  const redirectUri = useMemo(() => makeRedirectUri({ scheme: 'nabaat', path: 'oauth' }), []);
  const oauthClientId = QF_CLIENT_ID.trim() || '__CONFIGURE_EXPO_PUBLIC_QF_CLIENT_ID__';

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: oauthClientId,
      scopes: [...QF_OAUTH_SCOPES],
      redirectUri,
      usePKCE: true,
      responseType: ResponseType.Code,
      extraParams: { prompt: 'login' },
    },
    qfDiscovery,
  );

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [idSummary, setIdSummary] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bookmarkMsg, setBookmarkMsg] = useState<string | null>(null);
  const [ayahBookmarked, setAyahBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const [tafsirPlain, setTafsirPlain] = useState<string | null>(null);
  const [tafsirResourceName, setTafsirResourceName] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setAyahWordTimings(null);
    setSyncAyahWordHighlight(false);
    setHearTapWordPosition(null);
    void (async () => {
      try {
        const [data, ayahUri, timings] = await Promise.all([
          fetchAyahLabData(verseKey),
          fetchAyahRecitationPath(verseKey),
          fetchAyahRecitationWordTimings(verseKey),
        ]);
        if (cancelled) return;
        setAyah(data);
        setAyahAudioUri(ayahUri);
        setAyahWordTimings(timings);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load ayah');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [verseKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const s = await readBookmarkedVerseKeySet();
      if (!cancelled) setAyahBookmarked(s.has(verseKey));
    })();
    return () => {
      cancelled = true;
    };
  }, [verseKey]);

  const ayahHighlightPosition = useMemo(() => {
    if (!syncAyahWordHighlight || !ayahWordTimings?.length) return null;
    const t = audioStatus.currentTime;
    const dur = audioStatus.duration;
    const playing = audioStatus.playing;
    if (dur <= 0) return null;
    if (t >= dur - 0.08) return null;
    if (!playing && t <= 0) return null;
    for (const seg of ayahWordTimings) {
      if (t >= seg.startSec && t < seg.endSec) return seg.position;
    }
    const last = ayahWordTimings[ayahWordTimings.length - 1]!;
    if (t >= last.startSec && t <= dur + 0.15) return last.position;
    return null;
  }, [
    syncAyahWordHighlight,
    ayahWordTimings,
    audioStatus.currentTime,
    audioStatus.duration,
    audioStatus.playing,
  ]);

  const activeWordPosition = useMemo(
    () => ayahHighlightPosition ?? hearTapWordPosition,
    [ayahHighlightPosition, hearTapWordPosition],
  );

  useEffect(() => {
    if (!syncAyahWordHighlight) return;
    const dur = audioStatus.duration;
    const t = audioStatus.currentTime;
    if (dur > 0 && !audioStatus.playing && t >= dur - 0.12) {
      setSyncAyahWordHighlight(false);
    }
  }, [syncAyahWordHighlight, audioStatus.playing, audioStatus.duration, audioStatus.currentTime]);

  useEffect(() => {
    if (syncAyahWordHighlight) {
      hearTapArmedRef.current = false;
      prevPlayingForHearTapRef.current = audioStatus.playing;
      return;
    }
    if (hearTapWordPosition == null) {
      hearTapArmedRef.current = false;
      prevPlayingForHearTapRef.current = audioStatus.playing;
      return;
    }

    const prev = prevPlayingForHearTapRef.current;
    const playing = audioStatus.playing;

    if (hearTapArmedRef.current && prev && !playing) {
      const dur = audioStatus.duration;
      const t = audioStatus.currentTime;
      if (dur > 0 && t >= dur - 0.15) {
        setHearTapWordPosition(null);
        hearTapArmedRef.current = false;
        prevPlayingForHearTapRef.current = false;
        return;
      }
    }

    prevPlayingForHearTapRef.current = playing;
  }, [syncAyahWordHighlight, hearTapWordPosition, audioStatus.playing, audioStatus.duration, audioStatus.currentTime]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await SecureStore.getItemAsync(reflectionKey(verseKey));
        if (cancelled) return;
        if (stored) {
          setReflectionText(stored);
          return;
        }
        setReflectionText('');
        const at = accessToken ?? (await SecureStore.getItemAsync(SECURE_ACCESS));
        if (!at || !QF_CLIENT_ID.trim()) {
          return;
        }
        const list = await qfListNotesByVerse(QF_USER_API_BASE, at, QF_CLIENT_ID, verseKey);
        if (cancelled || !list.ok) return;
        const row = list.notes[0];
        const body = row?.body;
        if (typeof body === 'string' && body.trim()) {
          setReflectionText(body);
          await SecureStore.setItemAsync(reflectionKey(verseKey), body);
          if (row.id) await setReflectionNoteIdForVerse(verseKey, row.id);
        } else {
          setReflectionText('');
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [verseKey, accessToken]);

  useEffect(() => {
    void (async () => {
      try {
        const rt = await SecureStore.getItemAsync(SECURE_REFRESH);
        const at = await SecureStore.getItemAsync(SECURE_ACCESS);
        if (at) {
          setAccessToken(at);
          setAuthError(null);
        }
        if (rt) setRefreshToken(rt);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const applyQfTokens = useCallback(async (tokens: Awaited<ReturnType<typeof exchangeCodeOnBackend>>) => {
    await SecureStore.setItemAsync(SECURE_ACCESS, tokens.accessToken);
    if (tokens.refreshToken) {
      await SecureStore.setItemAsync(SECURE_REFRESH, tokens.refreshToken);
    }
    setAccessToken(tokens.accessToken);
    if (tokens.refreshToken) setRefreshToken(tokens.refreshToken);
    setAuthError(null);
    if (tokens.idToken) {
      try {
        const claims = jwtDecode<{ sub?: string; email?: string; name?: string }>(tokens.idToken);
        setIdSummary(claims.email ?? claims.name ?? claims.sub ?? 'Signed in');
      } catch {
        setIdSummary('Signed in');
      }
    } else {
      setIdSummary('Signed in');
    }
  }, []);

  /** One auth code → one exchange (OAuth codes are single-use). */
  const exchangeAuthCode = useCallback(
    async (authCode: string, codeVerifier: string): Promise<void> => {
      if (oauthCodeHandledRef.current === authCode) return;
      if (oauthExchangeInFlightRef.current === authCode) return;
      oauthCodeHandledRef.current = authCode;
      oauthExchangeInFlightRef.current = authCode;
      setAuthBusy(true);
      setAuthError(null);
      try {
        const tokens = await exchangeCodeOnBackend({
          code: authCode,
          codeVerifier,
          redirectUri,
        });
        await applyQfTokens(tokens);
      } catch (e) {
        oauthCodeHandledRef.current = null;
        setAuthError(e instanceof Error ? e.message : 'Exchange failed');
        throw e;
      } finally {
        oauthExchangeInFlightRef.current = null;
        setAuthBusy(false);
      }
    },
    [applyQfTokens, redirectUri],
  );

  useEffect(() => {
    if (!response) return;
    if (response.type === 'dismiss' || response.type === 'cancel') {
      setAuthBusy(false);
      return;
    }
    if (response.type === 'error') {
      setAuthError(response.error?.message ?? 'Login error');
      setAuthBusy(false);
      return;
    }
    if (response.type !== 'success' || !response.params?.code) return;
    if (oauthPromptLockRef.current) return;

    const authCode = response.params.code;
    const codeVerifier = pkceVerifierRef.current ?? request?.codeVerifier;
    if (!codeVerifier) return;

    void exchangeAuthCode(authCode, codeVerifier).catch(() => {});
  }, [response, request?.codeVerifier, exchangeAuthCode]);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (insightTab === 'reflection') {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 180);
    }
  }, [insightTab]);

  useEffect(() => {
    if (insightTab !== 'tafsir') return;
    let cancelled = false;
    setTafsirLoading(true);
    setTafsirError(null);
    void (async () => {
      try {
        const result = await fetchTafsirForAyah(verseKey);
        if (cancelled) return;
        setTafsirPlain(result.textPlain);
        setTafsirResourceName(result.resourceName);
      } catch (e) {
        if (!cancelled) {
          setTafsirError(e instanceof Error ? e.message : 'Failed to load tafsir');
          setTafsirPlain(null);
          setTafsirResourceName(null);
        }
      } finally {
        if (!cancelled) setTafsirLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [insightTab, verseKey]);

  const playUri = useCallback(
    async (uri: string) => {
      await safeAudioPlayUri(audioPlayer, uri);
    },
    [audioPlayer],
  );

  const startQuranLogin = useCallback(async () => {
    const codeVerifier = request?.codeVerifier;
    if (!request || !codeVerifier || !QF_CLIENT_ID.trim() || authBusy || oauthPromptOpen) return;
    if (oauthPromptLockRef.current) return;
    oauthPromptLockRef.current = true;
    setOauthPromptOpen(true);
    setAuthError(null);
    pkceVerifierRef.current = codeVerifier;
    try {
      const result = await promptAsync();
      if (result.type === 'dismiss' || result.type === 'cancel') {
        setAuthBusy(false);
        return;
      }
      if (result.type === 'error') {
        setAuthError(result.error?.message ?? 'Login error');
        setAuthBusy(false);
        return;
      }
      if (result.type === 'success' && result.params?.code) {
        const verifier = pkceVerifierRef.current ?? codeVerifier;
        await exchangeAuthCode(result.params.code, verifier);
      }
    } catch {
      /* exchangeAuthCode sets authError */
    } finally {
      oauthPromptLockRef.current = false;
      setOauthPromptOpen(false);
      pkceVerifierRef.current = null;
    }
  }, [request, authBusy, oauthPromptOpen, promptAsync, exchangeAuthCode]);

  const onPlayAyah = useCallback(async () => {
    if (!ayahAudioUri) return;
    hearTapArmedRef.current = false;
    setHearTapWordPosition(null);
    setSyncAyahWordHighlight(true);
    await playUri(ayahAudioUri);
  }, [ayahAudioUri, playUri]);

  const onPlayWord = useCallback(
    async (w: AyahWord) => {
      setSyncAyahWordHighlight(false);
      hearTapArmedRef.current = false;
      const uri = buildWordAudioUrl(w.audioPath);
      if (!uri) {
        setHearTapWordPosition(null);
        return;
      }
      setHearTapWordPosition(w.position);
      try {
        await playUri(uri);
        hearTapArmedRef.current = true;
      } catch {
        hearTapArmedRef.current = false;
        setHearTapWordPosition(null);
      }
    },
    [playUri],
  );

  const logout = useCallback(async () => {
    oauthCodeHandledRef.current = null;
    oauthExchangeInFlightRef.current = null;
    pkceVerifierRef.current = null;
    setAccessToken(null);
    setRefreshToken(null);
    setIdSummary(null);
    setAuthError(null);
    setAyahBookmarked(false);
    await clearBookmarkedVerseKeyStore();
    await clearReflectionNoteIdStore();
    await SecureStore.deleteItemAsync(SECURE_ACCESS).catch(() => {});
    await SecureStore.deleteItemAsync(SECURE_REFRESH).catch(() => {});
  }, []);

  const tryRefresh = useCallback(async () => {
    const rt = refreshToken ?? (await SecureStore.getItemAsync(SECURE_REFRESH));
    if (!rt) return;
    const tokens = await refreshOnBackend(rt);
    setAccessToken(tokens.accessToken);
    if (tokens.refreshToken) {
      setRefreshToken(tokens.refreshToken);
      await SecureStore.setItemAsync(SECURE_REFRESH, tokens.refreshToken);
    }
    await SecureStore.setItemAsync(SECURE_ACCESS, tokens.accessToken);
  }, [refreshToken]);

  const readAccessToken = useCallback(
    async () => accessToken ?? (await SecureStore.getItemAsync(SECURE_ACCESS)),
    [accessToken],
  );

  const toggleBookmarkAyah = useCallback(async () => {
    setBookmarkMsg(null);
    const tokenNow = await readAccessToken();
    if (!tokenNow) {
      if (ayahBookmarked) {
        await unmarkVerseBookmarkSynced(verseKey);
        setAyahBookmarked(false);
        setBookmarkMsg('Removed on this device. Sign in to sync with Quran.com.');
        return;
      }
      setBookmarkMsg('Sign in to sync this ayah to Quran.com bookmarks.');
      return;
    }
    if (!QF_CLIENT_ID.trim()) {
      setBookmarkMsg('Missing EXPO_PUBLIC_QF_CLIENT_ID.');
      return;
    }
    if (bookmarkBusy) return;

    const apiBase = QF_USER_API_BASE;
    const clientId = QF_CLIENT_ID;
    const removing = ayahBookmarked;

    const run = async (token: string) => {
      if (removing) {
        return qfDeleteCollectionBookmarkByDetails(apiBase, token, clientId, verseKey);
      }
      return qfAddCollectionBookmark(apiBase, token, clientId, verseKey);
    };

    setBookmarkBusy(true);
    try {
      let token = tokenNow;
      let result = await run(token);
      if (result.status === 401) {
        await tryRefresh().catch(() => {});
        const next = await readAccessToken();
        if (!next) {
          setBookmarkMsg('Session expired. Sign in again to sync bookmarks.');
          return;
        }
        token = next;
        result = await run(token);
      }

      if (!result.ok && !(removing && result.status === 404)) {
        setBookmarkMsg(
          removing
            ? `Remove bookmark: ${result.status} ${result.raw.slice(0, 80)}`
            : `Bookmark: ${result.status} ${result.raw.slice(0, 80)}`,
        );
        return;
      }

      if (removing) {
        await unmarkVerseBookmarkSynced(verseKey);
        setAyahBookmarked(false);
        setBookmarkMsg('Removed from your Quran.com bookmarks.');
      } else {
        await markVerseBookmarkSynced(verseKey);
        setAyahBookmarked(true);
        setBookmarkMsg('Saved to your Quran.com bookmarks.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : removing ? 'Remove bookmark failed' : 'Bookmark failed';
      setBookmarkMsg(
        msg === 'Network request failed'
          ? `${msg} (bookmarks API). Check Wi‑Fi / VPN, or confirm EXPO_PUBLIC_QF_USER_API_BASE is not set to a local URL.`
          : `Bookmarks: ${msg}`,
      );
    } finally {
      setBookmarkBusy(false);
    }
  }, [readAccessToken, ayahBookmarked, bookmarkBusy, verseKey, tryRefresh]);

  const saveReflection = useCallback(async () => {
    if (reflectionSaving) return;
    const trimmed = reflectionText.trim();
    const readAuth = async () => (await SecureStore.getItemAsync(SECURE_ACCESS)) ?? accessToken;

    setReflectionSaving(true);
    setReflectionNote(null);

    try {
      await SecureStore.setItemAsync(reflectionKey(verseKey), trimmed);

      if (!trimmed) {
        const auth = await readAuth();
        if (!auth || !QF_CLIENT_ID.trim()) {
          setReflectionNote('Cleared on this device.');
          return;
        }
        let noteId = (await readReflectionNoteIdMap())[verseKey];
        let list = await qfListNotesByVerse(QF_USER_API_BASE, auth, QF_CLIENT_ID, verseKey);
        if (list.status === 401) {
          await tryRefresh().catch(() => {});
          const auth2 = await readAuth();
          if (auth2) list = await qfListNotesByVerse(QF_USER_API_BASE, auth2, QF_CLIENT_ID, verseKey);
        }
        if (!noteId && list.ok && list.notes[0]?.id) noteId = list.notes[0].id;
        if (!noteId) {
          setReflectionNote('Cleared on this device.');
          return;
        }
        let authDel = await readAuth();
        if (!authDel) {
          setReflectionNote('Cleared on this device.');
          return;
        }
        let del = await qfDeleteNote(QF_USER_API_BASE, authDel, QF_CLIENT_ID, noteId);
        if (del.status === 401) {
          await tryRefresh().catch(() => {});
          authDel = await readAuth();
          if (authDel) del = await qfDeleteNote(QF_USER_API_BASE, authDel, QF_CLIENT_ID, noteId);
        }
        if (del.ok) {
          await setReflectionNoteIdForVerse(verseKey, null);
          setReflectionNote('Cleared on this device and removed from Quran.com notes.');
        } else {
          setReflectionNote('Cleared on this device.');
        }
        return;
      }

      const range = verseKeyToNoteRange(verseKey);
      if (!QF_CLIENT_ID.trim()) {
        setReflectionNote('Saved on this device.');
        return;
      }

      if (!(await readAuth())) {
        setReflectionNote('Saved on this device.');
        return;
      }
      if (!range) {
        setReflectionNote('Saved on this device.');
        return;
      }
      if (trimmed.length < QF_NOTE_BODY_MIN_LENGTH) {
        setReflectionNote(
          `Saved on this device. Add at least ${QF_NOTE_BODY_MIN_LENGTH} characters to sync to Quran.com.`,
        );
        return;
      }

      const withAuthRetry = async <T extends { status: number }>(
        call: (t: string) => Promise<T>,
      ): Promise<T | null> => {
        let t = await readAuth();
        if (!t) return null;
        let result = await call(t);
        if (result.status === 401) {
          await tryRefresh().catch(() => {});
          t = await readAuth();
          if (t) result = await call(t);
        }
        return result;
      };

      let noteId: string | undefined = (await readReflectionNoteIdMap())[verseKey];
      if (!noteId) {
        const list = await withAuthRetry((t) =>
          qfListNotesByVerse(QF_USER_API_BASE, t, QF_CLIENT_ID, verseKey),
        );
        if (list?.ok && list.notes[0]?.id) noteId = list.notes[0].id;
      }

      if (noteId) {
        const patch = await withAuthRetry((t) =>
          qfPatchNote(QF_USER_API_BASE, t, QF_CLIENT_ID, noteId!, trimmed, range),
        );
        if (patch?.ok) {
          await setReflectionNoteIdForVerse(verseKey, noteId);
          setReflectionNote('Saved on this device and synced to Quran.com notes.');
          return;
        }
        await setReflectionNoteIdForVerse(verseKey, null);
      }

      const created = await withAuthRetry((t) =>
        qfCreateNote(QF_USER_API_BASE, t, QF_CLIENT_ID, trimmed, range),
      );
      if (!created) {
        setReflectionNote('Saved on this device.');
        return;
      }

      if (created.ok) {
        let syncedId = created.noteId;
        if (!syncedId) {
          const list = await withAuthRetry((t) =>
            qfListNotesByVerse(QF_USER_API_BASE, t, QF_CLIENT_ID, verseKey),
          );
          syncedId = list?.ok ? list.notes[0]?.id : undefined;
        }
        if (syncedId) await setReflectionNoteIdForVerse(verseKey, syncedId);
        setReflectionNote('Saved on this device and synced to Quran.com notes.');
        return;
      }

      if (created.status === 403) {
        setReflectionNote('Saved on this device. Sign out and sign in again to allow note sync.');
        return;
      }

      if (created.status === 422) {
        const list = await withAuthRetry((t) =>
          qfListNotesByVerse(QF_USER_API_BASE, t, QF_CLIENT_ID, verseKey),
        );
        const existingId = list?.ok ? list.notes[0]?.id : undefined;
        if (existingId) {
          const patch = await withAuthRetry((t) =>
            qfPatchNote(QF_USER_API_BASE, t, QF_CLIENT_ID, existingId, trimmed, range),
          );
          if (patch?.ok) {
            await setReflectionNoteIdForVerse(verseKey, existingId);
            setReflectionNote('Saved on this device and synced to Quran.com notes.');
            return;
          }
        }
      }

      setReflectionNote('Could not sync to Quran.com. Saved on this device.');
    } catch (e) {
      setReflectionNote(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setReflectionSaving(false);
    }
  }, [accessToken, reflectionSaving, reflectionText, tryRefresh, verseKey]);

  const padH = r(21, s);
  const bottomPad = Math.max(r(24, s), insets.bottom);
  const scrollPadBottom = (isTab ? tabBarBottomInset : bottomPad) + r(28, s);

  const teaching = selected ? teachingForWord(selected, verseKey) : null;

  if (!fredokaLoaded || !nunitoLoaded || !notoArLoaded) {
    return <View style={[styles.root, { backgroundColor: NEUTRAL.pageBg }]} />;
  }

  const insightBody = (() => {
    if (!ayah) return null;
    if (insightTab === 'wordByWord') {
      return (
        <View style={[styles.panelCard, { marginTop: r(12, s), padding: r(14, s) }]}>
          <View style={[styles.panelHead, { marginBottom: r(10, s) }]}>
            <Text style={[styles.panelTitle, { fontSize: r(15, s), color: theme.headerText }]}>Word by Word</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TapGlyph width={r(17, s)} height={r(17, s)} style={{ marginRight: r(4, s) }} />
              <Text style={[styles.tapHear, { fontSize: r(12, s), color: NEUTRAL.muted }]}>(Tap to hear)</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wbwScroll}>
            <View style={[styles.wbwRow, { direction: 'rtl' }]}>
              {ayah.words.map((w, idx) => (
                <View
                  key={w.id}
                  style={[
                    styles.wbwCol,
                    idx > 0 ? { borderLeftWidth: 1, borderLeftColor: 'rgba(0,0,0,0.12)' } : undefined,
                    activeWordPosition === w.position
                      ? {
                          backgroundColor: theme.progressTrack,
                          borderRadius: r(8, s),
                          paddingVertical: r(2, s),
                        }
                      : null,
                  ]}
                >
                  <UiTapPressable
                    accessibilityRole="button"
                    accessibilityLabel={`Play ${w.text}`}
                    onPress={() => void onPlayWord(w)}
                    onLongPress={() => setSelected(w)}
                    delayLongPress={280}
                    style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, alignItems: 'center' })}
                  >
                  <Text
                    style={[
                      styles.wbwAr,
                      {
                        fontFamily: QURAN_ARABIC_FONT,
                        fontSize: r(24, s),
                        lineHeight: r(-38, s),
                        color: '#000',
                        ...(activeWordPosition === w.position
                          ? { backgroundColor: theme.progressTrack, borderRadius: r(6, s), paddingHorizontal: r(4, s) }
                          : {}),
                        ...textPad,
                      },
                    ]}
                  >
                    {w.text}
                  </Text>
                    <Text style={[styles.wbwTr, { fontSize: r(10, s), marginTop: r(4, s), color: NEUTRAL.muted }]}>{w.transliteration}</Text>
                    <Text style={[styles.wbwEn, { fontSize: r(12, s), marginTop: r(6, s), color: '#000' }]}>{w.meaning}</Text>
                  </UiTapPressable>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      );
    }
    if (insightTab === 'tafsir') {
      return (
        <View style={[styles.panelCard, { marginTop: r(12, s), padding: r(14, s) }]}>
          <Text style={[styles.panelTitle, { fontSize: r(15, s), color: theme.headerText, marginBottom: r(6, s) }]}>Tafsir</Text>
          {tafsirResourceName ? (
            <Text style={[styles.tafsirSource, { fontSize: r(12, s), marginBottom: r(10, s) }]}>
              {tafsirResourceName} · Quran.com v4 (Quran Foundation)
            </Text>
          ) : null}
          {tafsirLoading ? <ActivityIndicator color={theme.primary} style={{ marginVertical: r(16, s) }} /> : null}
          {tafsirError ? <Text style={[styles.errMini, { fontSize: r(13, s), marginBottom: r(8, s) }]}>{tafsirError}</Text> : null}
          {tafsirPlain && !tafsirLoading ? (
            <Text style={[styles.bodyMuted, { fontSize: r(14, s), lineHeight: r(22, s), color: '#334155' }]}>{tafsirPlain}</Text>
          ) : null}
        </View>
      );
    }
    if (insightTab === 'grammar') {
      return (
        <View style={[styles.panelCard, { marginTop: r(12, s), padding: r(14, s) }]}>
          <Text style={[styles.panelTitle, { fontSize: r(15, s), color: theme.headerText, marginBottom: r(8, s) }]}>Grammar</Text>
          {ayah.words.map((w, i, arr) => {
            const g = teachingForWord(w, verseKey);
            return (
              <View
                key={w.id}
                style={{
                  marginBottom: r(10, s),
                  paddingBottom: r(10, s),
                  borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: 'rgba(0,0,0,0.08)',
                }}
              >
                <Text
                  style={[
                    styles.wbwAr,
                    {
                      fontFamily: QURAN_ARABIC_FONT,
                      fontSize: r(18, s),
                      color: '#000',
                      ...(activeWordPosition === w.position
                        ? { backgroundColor: theme.progressTrack, borderRadius: r(6, s), paddingHorizontal: r(4, s) }
                        : {}),
                      ...textPad,
                    },
                  ]}
                >
                  {w.text}
                </Text>
                <Text style={{ fontSize: r(12, s), marginTop: r(4, s), color: theme.primary, fontFamily: 'Nunito_800ExtraBold' }}>{g.type}</Text>
                <Text style={{ fontSize: r(13, s), marginTop: r(4, s), color: '#475569', fontFamily: 'Nunito_700Bold' }}>{g.teachingNote}</Text>
              </View>
            );
          })}
        </View>
      );
    }
    if (insightTab === 'tajweed') {
      return (
        <View style={[styles.panelCard, { marginTop: r(12, s), padding: r(14, s) }]}>
          <Text style={[styles.panelTitle, { fontSize: r(15, s), color: theme.headerText, marginBottom: r(8, s) }]}>Tajweed</Text>
          {ayah.words.map((w) => (
            <View key={w.id} style={{ marginBottom: r(10, s) }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text
                  style={[
                    styles.wbwAr,
                    {
                      fontFamily: QURAN_ARABIC_FONT,
                      fontSize: r(18, s),
                      color: '#000',
                      ...(activeWordPosition === w.position
                        ? { backgroundColor: theme.progressTrack, borderRadius: r(6, s), paddingHorizontal: r(4, s) }
                        : {}),
                      ...textPad,
                    },
                  ]}
                >
                  {w.text}
                </Text>
                <UiTapPressable onPress={() => void onPlayWord(w)} style={styles.miniPlay}>
                  <Text style={{ color: theme.primary, fontFamily: 'Nunito_800ExtraBold', fontSize: r(11, s) }}>▶</Text>
                </UiTapPressable>
              </View>
              <Text style={{ fontSize: r(12, s), marginTop: r(4, s), color: theme.primaryDark, fontFamily: 'Nunito_700Bold' }}>{recitationListenCue(w)}</Text>
            </View>
          ))}
        </View>
      );
    }
    return (
      <View style={[styles.panelCard, { marginTop: r(12, s), padding: r(14, s) }]}>
        <Text style={[styles.bodyMuted, { fontSize: r(13, s), color: NEUTRAL.muted }]}>
          Use the Reflection card below — this tab highlights listening and personal notes for this ayah.
        </Text>
      </View>
    );
  })();

  const sheet = (
    <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
      <UiTapPressable disableUiTapSound style={styles.modalBackdrop} onPress={() => setSelected(null)}>
        <UiTapPressable
          disableUiTapSound
          style={[styles.sheet, { paddingBottom: bottomPad + r(12, s), paddingHorizontal: padH }]}
          onPress={(e) => e.stopPropagation()}
        >
          {selected && teaching ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={[styles.sheetWord, { fontSize: r(26, s), fontFamily: QURAN_ARABIC_FONT, color: theme.headerText, ...textPad }]}
              >
                {selected.text}
              </Text>
              <Text style={[styles.sheetLabel, { color: NEUTRAL.muted }]}>Meaning</Text>
              <Text style={[styles.sheetBody, { color: '#111' }]}>{selected.meaning}</Text>
              <Text style={[styles.sheetLabel, { color: NEUTRAL.muted }]}>Transliteration</Text>
              <Text style={[styles.sheetBody, { color: '#334155' }]}>{selected.transliteration}</Text>
              <Text style={[styles.sheetLabel, { color: NEUTRAL.muted }]}>Listening cue</Text>
              <Text style={[styles.sheetBody, { color: theme.primaryDark }]}>{recitationListenCue(selected)}</Text>
              <Text style={[styles.sheetLabel, { color: NEUTRAL.muted }]}>Grammar snapshot</Text>
              <Text style={[styles.sheetBody]}>{teaching.type}</Text>
              <Text style={[styles.sheetLabel, { color: NEUTRAL.muted }]}>Root</Text>
              <Text style={[styles.sheetBody]}>{teaching.root ?? '—'}</Text>
              <Text style={[styles.sheetLabel, { color: NEUTRAL.muted }]}>Note</Text>
              <Text style={[styles.sheetBody, { lineHeight: r(21, s) }]}>{teaching.teachingNote}</Text>
              <UiTapPressable
                onPress={() => void onPlayWord(selected)}
                style={[styles.saveBtn, { marginTop: r(14, s), alignSelf: 'flex-start', backgroundColor: theme.primary, borderColor: theme.primaryDark }]}
              >
                <Text style={styles.saveBtnText}>Play word audio</Text>
              </UiTapPressable>
              <UiTapPressable onPress={() => setSelected(null)} style={{ marginTop: r(12, s), alignSelf: 'center' }}>
                <Text style={{ fontFamily: 'Nunito_700Bold', color: theme.headerText }}>Close</Text>
              </UiTapPressable>
            </ScrollView>
          ) : null}
        </UiTapPressable>
      </UiTapPressable>
    </Modal>
  );

  return (
    <View style={[styles.root, { backgroundColor: NEUTRAL.pageBg }]}>
      {!isTab ? (
        <View style={[styles.stackHeader, { paddingTop: insets.top + r(6, s), paddingHorizontal: padH }]}>
          {onBack ? (
            <UiTapPressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} hitSlop={12} style={styles.backHit}>
              <Text style={[styles.backChevron, { fontSize: r(20, s), color: theme.headerText }]}>‹</Text>
            </UiTapPressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <View style={{ flex: 1 }} />
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={isTab ? r(24, s) : r(40, s)}
      >
        <View style={[styles.stickyTitleBar, { paddingTop: isTab ? insets.top : 0 }]}>
          <View
            style={[
              styles.stickyTitleRow,
              {
                paddingHorizontal: isTab ? r(22, s) : padH,
                paddingTop: r(10, s),
                paddingBottom: r(8, s),
              },
            ]}
          >
            <View style={{ height: r(40, s), justifyContent: 'center' }}>
              <Text style={[styles.screenTitle, { fontSize: r(24, s), lineHeight: r(28, s), color: theme.headerText }]}>Ayah Lab</Text>
            </View>
          </View>
        </View>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={{
            paddingHorizontal: isTab ? r(22, s) : padH,
            paddingBottom: scrollPadBottom,
            paddingTop: r(4, s),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {todaysConnection ? (
            <UiTapPressable
              onPress={todaysConnection.onOpenLesson}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.connPill,
                {
                  backgroundColor: theme.progressTrack,
                  paddingVertical: r(10, s),
                  paddingHorizontal: r(14, s),
                  marginBottom: r(12, s),
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <SunGlyph width={r(28, s)} height={r(28, s)} style={{ marginRight: r(8, s) }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.connPillText, { fontSize: r(16, s), color: theme.headerText }]}>Today&apos;s Connection</Text>
                <Text style={[styles.connSub, { fontSize: r(12, s), marginTop: r(2, s), color: theme.headerText }]}>
                  {todaysConnection.unitLabel ? `${todaysConnection.unitLabel} · ` : ''}
                  {todaysConnection.lessonTitle}
                </Text>
                <Text style={[styles.connAyah, { fontSize: r(11, s), marginTop: r(4, s), color: NEUTRAL.muted }]}>{todaysConnection.ayahRef}</Text>
              </View>
              <Text style={{ fontSize: r(16, s), color: theme.headerText }}>›</Text>
            </UiTapPressable>
          ) : null}

          <View style={[styles.authRowMini, { marginBottom: r(10, s) }]}>
            {!accessToken ? (
              <UiTapPressable
                disabled={authBusy || oauthPromptOpen || !request || !QF_CLIENT_ID.trim()}
                onPress={() => void startQuranLogin()}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <Text style={[styles.linkMini, { color: theme.headerText, fontSize: r(12, s) }]}>
                  {authBusy || oauthPromptOpen ? 'Signing in…' : 'Sign in to sync bookmarks'}
                </Text>
              </UiTapPressable>
            ) : (
              <UiTapPressable onPress={() => void logout()}>
                <Text style={[styles.linkMini, { color: NEUTRAL.muted, fontSize: r(12, s) }]}>Sign out ({idSummary})</Text>
              </UiTapPressable>
            )}
            {authError ? <Text style={[styles.errMini, { fontSize: r(11, s) }]}>{authError}</Text> : null}
            {bookmarkMsg ? <Text style={[styles.hintMini, { fontSize: r(11, s) }]}>{bookmarkMsg}</Text> : null}
          </View>

          {loading ? <ActivityIndicator color={theme.primary} style={{ marginVertical: r(20, s) }} /> : null}
          {loadError ? <Text style={styles.errMini}>{loadError}</Text> : null}

          {ayah ? (
            <>
              <View
                style={[
                  styles.heroCard,
                  {
                    borderRadius: r(15, s),
                    padding: r(16, s),
                    borderColor: NEUTRAL.cardBorder,
                    overflow: 'hidden',
                  },
                ]}
              >
                <View style={styles.heroInner}>
                  <View style={[styles.heroTools, { marginBottom: r(8, s) }]}>
                    <UiTapPressable accessibilityLabel="Play ayah audio" hitSlop={10} onPress={() => void onPlayAyah()} disabled={!ayahAudioUri}>
                      <AudioGlyph width={r(24, s)} height={r(24, s)} style={{ opacity: ayahAudioUri ? 1 : 0.35 }} />
                    </UiTapPressable>
                    <UiTapPressable
                      accessibilityLabel={
                        ayahBookmarked
                          ? 'Remove ayah from Quran.com bookmarks'
                          : 'Bookmark ayah on Quran.com'
                      }
                      hitSlop={10}
                      disabled={bookmarkBusy}
                      onPress={() => void toggleBookmarkAyah()}
                    >
                      {ayahBookmarked ? (
                        <BookmarkFilledGlyph width={r(24, s)} height={r(24, s)} fill={theme.primary} />
                      ) : (
                        <BookmarkGlyph width={r(24, s)} height={r(24, s)} />
                      )}
                    </UiTapPressable>
                  </View>

                  <Text
                    style={[
                      styles.heroArabic,
                      {
                        writingDirection: 'rtl' as const,
                        fontFamily: QURAN_ARABIC_FONT,
                        fontSize: r(32, s),
                        lineHeight: r(-58, s),
                        color: theme.headerText,
                        ...textPad,
                      },
                    ]}
                  >
                    {ayah.words.map((w, i) => (
                      <Text
                        key={w.id}
                        style={
                          activeWordPosition === w.position
                            ? {
                                backgroundColor: theme.progressTrack,
                                borderRadius: r(5, s),
                                paddingHorizontal: r(3, s),
                              }
                            : undefined
                        }
                      >
                        {w.text}
                        {i < ayah.words.length - 1 ? '\u00A0' : ''}
                      </Text>
                    ))}
                  </Text>

                  <Text style={[styles.heroTranslit, { fontSize: r(12, s), marginTop: r(8, s), color: NEUTRAL.muted, textAlign: 'center' }]}>
                    {ayah.words.map((w) => w.transliteration).join(' · ')}
                  </Text>

                  <Text style={[styles.heroTranslation, { fontSize: r(16, s), lineHeight: r(25, s), marginTop: r(14, s), color: '#000', textAlign: 'center' }]}>
                    {ayah.translation.replace(/<[^>]+>/g, '')}
                  </Text>

                  <Text style={[styles.heroRef, { fontSize: r(12, s), marginTop: r(8, s), color: NEUTRAL.muted, textAlign: 'center' }]}>
                    {surahAyahLabel(verseKey)}
                  </Text>

                  <View style={[styles.tabIconRow, { marginTop: r(18, s), paddingTop: r(4, s) }]}>
                    {INSIGHT_TABS.map((tab) => {
                      const on = insightTab === tab.id;
                      const TabIcon = tab.Icon;
                      const tabInk = on ? theme.primary : NEUTRAL.muted;
                      return (
                        <UiTapPressable
                          key={tab.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                          onPress={() => setInsightTab(tab.id)}
                          style={styles.tabIconCell}
                        >
                          <TabIcon width={r(25, s)} height={r(25, s)} color={tabInk} style={{ marginBottom: r(4, s) }} />
                          <Text style={[styles.tabIconLabel, { color: tabInk, fontSize: r(10, s) }]}>{tab.label}</Text>
                          <View
                            style={{
                              marginTop: r(4, s),
                              height: r(2, s),
                              width: r(36, s),
                              borderRadius: 1,
                              backgroundColor: on ? theme.primary : 'transparent',
                            }}
                          />
                        </UiTapPressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              {insightBody}

              <View style={[styles.panelCard, { marginTop: r(12, s), padding: r(14, s), borderColor: NEUTRAL.cardBorder }]}>
                <Text style={[styles.panelTitle, { fontSize: r(15, s), color: theme.headerText }]}>Reflection</Text>
                <Text style={[styles.refPrompt, { fontSize: r(13, s), marginTop: r(6, s), color: NEUTRAL.muted }]}>What does this ayah teach you today?</Text>
                <TextInput
                  value={reflectionText}
                  onChangeText={(t) => {
                    setReflectionText(t);
                    setReflectionNote(null);
                  }}
                  placeholder="Write your reflection..."
                  placeholderTextColor={NEUTRAL.muted2}
                  multiline
                  style={[
                    styles.refInput,
                    {
                      marginTop: r(10, s),
                      minHeight: r(72, s),
                      padding: r(10, s),
                      fontSize: r(12, s),
                      borderRadius: r(10, s),
                      backgroundColor: NEUTRAL.inputBg,
                      borderColor: NEUTRAL.cardBorder,
                    },
                  ]}
                />
                <UiTapPressable
                  onPress={() => void saveReflection()}
                  disabled={reflectionSaving}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    {
                      marginTop: r(10, s),
                      backgroundColor: theme.primary,
                      borderColor: theme.primaryDark,
                      opacity: reflectionSaving ? 0.6 : pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.saveBtnText, { fontSize: r(12, s) }]}>
                    {reflectionSaving ? 'Saving…' : 'Save Reflection'}
                  </Text>
                </UiTapPressable>
                {reflectionNote ? <Text style={[styles.hintMini, { marginTop: r(8, s) }]}>{reflectionNote}</Text> : null}
              </View>
            </>
          ) : null}
        </ScrollView>
        {sheet}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  stickyTitleBar: {
    backgroundColor: NEUTRAL.pageBg,
    zIndex: 10,
  },
  stickyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  stackHeader: { flexDirection: 'row', alignItems: 'center' },
  backHit: { width: 40, height: 40, justifyContent: 'center' },
  backChevron: { fontFamily: 'Fredoka_600SemiBold' },
  screenTitle: { fontFamily: 'Fredoka_600SemiBold', ...textPad },
  connPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 25,
  },
  connPillText: { fontFamily: 'Fredoka_500Medium', ...textPad },
  connSub: { fontFamily: 'Nunito_700Bold', ...textPad },
  connAyah: { fontFamily: 'Nunito_700Bold' },
  authRowMini: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  linkMini: { fontFamily: 'Nunito_700Bold' },
  errMini: { fontFamily: 'Nunito_700Bold', color: '#b00020' },
  hintMini: { fontFamily: 'Nunito_700Bold', color: '#64748b' },
  heroCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroInner: { position: 'relative' },
  heroTools: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroArabic: { textAlign: 'center' },
  heroTranslit: { fontFamily: 'NotoSansArabic_500Medium' },
  heroTranslation: { fontFamily: 'NotoSansArabic_500Medium', ...textPad },
  heroRef: { fontFamily: 'NotoSansArabic_500Medium' },
  tabIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tabIconCell: { flex: 1, alignItems: 'center', minWidth: 52 },
  tabIconLabel: { fontFamily: 'NotoSansArabic_500Medium', textAlign: 'center', ...textPad },
  panelCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: NEUTRAL.cardBorder,
    borderRadius: 15,
  },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { fontFamily: 'Fredoka_500Medium', ...textPad },
  tafsirSource: { fontFamily: 'Nunito_700Bold', color: NEUTRAL.muted },
  tapHear: { fontFamily: 'Fredoka_500Medium' },
  wbwScroll: { flexDirection: 'row', alignItems: 'stretch' },
  wbwRow: { flexDirection: 'row', alignItems: 'flex-start' },
  wbwCol: { paddingHorizontal: 12, paddingVertical: 4, minWidth: 72, alignItems: 'center' },
  wbwAr: { textAlign: 'center' },
  wbwTr: { fontFamily: 'NotoSansArabic_500Medium', textAlign: 'center', ...textPad },
  wbwEn: { fontFamily: 'NotoSansArabic_500Medium', textAlign: 'center' },
  bodyMuted: { fontFamily: 'Nunito_700Bold' },
  miniPlay: { paddingHorizontal: 8, paddingVertical: 4 },
  refPrompt: { fontFamily: 'Nunito_700Bold' },
  refInput: { borderWidth: 1, fontFamily: 'Nunito_700Bold', color: '#111' },
  saveBtn: { alignSelf: 'flex-start', borderRadius: 6, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 14 },
  saveBtnText: { fontFamily: 'Fredoka_500Medium', color: '#fff' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '88%',
  },
  sheetWord: { textAlign: 'center', ...textPad },
  sheetLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, marginTop: 10 },
  sheetBody: { fontFamily: 'Nunito_700Bold', fontSize: 14, marginTop: 2, color: '#334155' },
});
