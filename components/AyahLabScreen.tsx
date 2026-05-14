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
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LearningPathId } from './ChoosePathScreen';
import { recitationListenCue } from '../lib/ayahLabRecitationHints';
import { teachingForWord } from '../lib/ayahLabTeaching';
import { exchangeCodeOnBackend, refreshOnBackend } from '../lib/qfBackendExchange';
import { QF_CLIENT_ID, QF_OAUTH_SCOPES, QF_USER_API_BASE, qfDiscovery } from '../lib/qfEnv';
import { buildWordAudioUrl, fetchAyahLabData, fetchAyahRecitationPath, type AyahWord } from '../lib/quranCloudApi';
import { pathThemeOf } from '../lib/pathTheme';

WebBrowser.maybeCompleteAuthSession();

const FIGMA_W = 393;
const SECURE_REFRESH = 'qf_refresh_token';
const SECURE_ACCESS = 'qf_access_token';

const FOCUS_OPTIONS = [
  { id: 'reading' as const, label: 'Reading' },
  { id: 'meaning' as const, label: 'Meaning' },
  { id: 'recitation' as const, label: 'Recitation' },
];

export type FocusMode = (typeof FOCUS_OPTIONS)[number]['id'];

export type TodaysConnection = {
  lessonTitle: string;
  unitLabel?: string;
  /** Short line, e.g. “Surah 2 · 183” */
  ayahRef: string;
  onOpenLesson: () => void;
};

export type AyahLabScreenProps = {
  learningPath: LearningPathId;
  verseKey?: string;
  /** `tab` = embedded under home (Grow); `stack` = full screen with optional back. */
  variant?: 'stack' | 'tab';
  onBack?: () => void;
  /** Extra bottom padding so content clears the floating tab bar (tab variant). */
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

export function AyahLabScreen({
  learningPath,
  verseKey = '2:183',
  variant = 'stack',
  onBack,
  tabBarBottomInset = 0,
  todaysConnection,
}: AyahLabScreenProps) {
  const { width: W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const s = W / FIGMA_W;
  const isTab = variant === 'tab';

  const [fredokaLoaded] = useFredoka({ Fredoka_500Medium, Fredoka_600SemiBold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_500Medium, NotoSansArabic_700Bold });

  const theme = useMemo(() => pathThemeOf(learningPath), [learningPath]);

  const [ayah, setAyah] = useState<Awaited<ReturnType<typeof fetchAyahLabData>> | null>(null);
  const [ayahAudioUri, setAyahAudioUri] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [focusMode, setFocusMode] = useState<FocusMode>('meaning');
  const [selected, setSelected] = useState<AyahWord | null>(null);

  const [reflectionText, setReflectionText] = useState('');
  const [reflectionNote, setReflectionNote] = useState<string | null>(null);

  const oauthPromptLockRef = useRef(false);
  const [oauthPromptOpen, setOauthPromptOpen] = useState(false);

  const audioPlayer = useAudioPlayer(null);

  const redirectUri = useMemo(() => makeRedirectUri({ scheme: 'nabaat', path: 'oauth' }), []);
  const oauthClientId = QF_CLIENT_ID.trim() || '__CONFIGURE_EXPO_PUBLIC_QF_CLIENT_ID__';

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: oauthClientId,
      scopes: [...QF_OAUTH_SCOPES],
      redirectUri,
      usePKCE: true,
      responseType: ResponseType.Code,
    },
    qfDiscovery,
  );

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [idSummary, setIdSummary] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bookmarkMsg, setBookmarkMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const [data, ayahUri] = await Promise.all([fetchAyahLabData(verseKey), fetchAyahRecitationPath(verseKey)]);
        if (cancelled) return;
        setAyah(data);
        setAyahAudioUri(ayahUri);
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
    void (async () => {
      try {
        const stored = await SecureStore.getItemAsync(reflectionKey(verseKey));
        if (stored) setReflectionText(stored);
      } catch {
        /* ignore */
      }
    })();
  }, [verseKey]);

  useEffect(() => {
    void (async () => {
      try {
        const rt = await SecureStore.getItemAsync(SECURE_REFRESH);
        const at = await SecureStore.getItemAsync(SECURE_ACCESS);
        if (at) setAccessToken(at);
        if (rt) setRefreshToken(rt);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (!response || !request?.codeVerifier) return;
    if (response.type === 'error') {
      setAuthError(response.error?.message ?? 'Login error');
      return;
    }
    if (response.type !== 'success' || !response.params?.code) return;
    const codeVerifier = request.codeVerifier;
    if (!codeVerifier) return;

    let cancelled = false;
    void (async () => {
      setAuthBusy(true);
      setAuthError(null);
      try {
        const tokens = await exchangeCodeOnBackend({
          code: response.params.code,
          codeVerifier,
          redirectUri,
        });
        if (cancelled) return;
        setAccessToken(tokens.accessToken);
        if (tokens.refreshToken) {
          setRefreshToken(tokens.refreshToken);
          await SecureStore.setItemAsync(SECURE_REFRESH, tokens.refreshToken);
        }
        await SecureStore.setItemAsync(SECURE_ACCESS, tokens.accessToken);
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
      } catch (e) {
        if (!cancelled) setAuthError(e instanceof Error ? e.message : 'Exchange failed');
      } finally {
        if (!cancelled) setAuthBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [response, request, redirectUri]);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  const playUri = useCallback(
    async (uri: string) => {
      try {
        audioPlayer.pause();
        audioPlayer.replace(uri);
        await audioPlayer.seekTo(0);
        audioPlayer.play();
      } catch {
        /* ignore */
      }
    },
    [audioPlayer],
  );

  const startQuranLogin = useCallback(async () => {
    if (!request || !QF_CLIENT_ID.trim() || authBusy || oauthPromptOpen) return;
    if (oauthPromptLockRef.current) return;
    oauthPromptLockRef.current = true;
    setOauthPromptOpen(true);
    try {
      await promptAsync();
    } catch {
      /* dismissed */
    } finally {
      oauthPromptLockRef.current = false;
      setOauthPromptOpen(false);
    }
  }, [request, authBusy, oauthPromptOpen, promptAsync]);

  const onPlayAyah = useCallback(async () => {
    if (!ayahAudioUri) return;
    try {
      await playUri(ayahAudioUri);
    } catch {
      /* ignore */
    }
  }, [ayahAudioUri, playUri]);

  const onPlayWord = useCallback(
    async (w: AyahWord) => {
      const uri = buildWordAudioUrl(w.audioPath);
      if (!uri) return;
      try {
        await playUri(uri);
      } catch {
        /* ignore */
      }
    },
    [playUri],
  );

  const logout = useCallback(async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setIdSummary(null);
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

  const bookmarkAyah = useCallback(async () => {
    setBookmarkMsg(null);
    if (!accessToken) {
      setBookmarkMsg('Sign in with Quran.com to sync bookmarks.');
      return;
    }
    if (!QF_CLIENT_ID.trim()) {
      setBookmarkMsg('Missing EXPO_PUBLIC_QF_CLIENT_ID.');
      return;
    }
    try {
      const res = await fetch(`${QF_USER_API_BASE.replace(/\/$/, '')}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': accessToken,
          'x-client-id': QF_CLIENT_ID,
        },
        body: JSON.stringify({ verse_key: verseKey }),
      });
      const body = await res.text();
      if (!res.ok) {
        if (res.status === 401) {
          await tryRefresh().catch(() => {});
        }
        setBookmarkMsg(`Bookmark API: ${res.status} ${body.slice(0, 120)}`);
        return;
      }
      setBookmarkMsg('Saved to your Quran.com bookmarks.');
    } catch (e) {
      setBookmarkMsg(e instanceof Error ? e.message : 'Bookmark failed');
    }
  }, [accessToken, verseKey, tryRefresh]);

  const saveReflection = useCallback(async () => {
    const trimmed = reflectionText.trim();
    try {
      await SecureStore.setItemAsync(reflectionKey(verseKey), trimmed);
      setReflectionNote(trimmed ? 'Saved on this device.' : 'Cleared.');
    } catch {
      setReflectionNote('Could not save — try again.');
    }
  }, [reflectionText, verseKey]);

  const transliterationLine = useMemo(() => {
    if (!ayah?.words.length) return '';
    return ayah.words.map((w) => w.transliteration).join(' · ');
  }, [ayah]);

  const padH = r(22, s);
  const bottomPad = Math.max(r(24, s), insets.bottom);
  const scrollPadBottom = (isTab ? tabBarBottomInset : bottomPad) + r(28, s);

  if (!fredokaLoaded || !nunitoLoaded || !notoArLoaded) {
    return <View style={styles.root} />;
  }

  const teaching = selected ? teachingForWord(selected, verseKey) : null;
  const showTranslation = focusMode !== 'reading';
  const showTransliterationBlock = focusMode === 'meaning' || focusMode === 'recitation';
  const recitationVisual = focusMode === 'recitation';

  const sheet = (
    <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
      <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
        <Pressable style={[styles.sheet, { paddingBottom: bottomPad + r(12, s), paddingHorizontal: padH }]} onPress={(e) => e.stopPropagation()}>
          {selected && teaching ? (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text
                style={[
                  styles.sheetWord,
                  {
                    fontSize: r(28, s),
                    lineHeight: r(44, s),
                    fontFamily: 'NotoSansArabic_700Bold',
                    color: theme.primaryDark,
                    ...textPad,
                  },
                ]}
              >
                {selected.text}
              </Text>
              <Text style={[styles.sheetLabel, { fontSize: r(12, s), marginTop: r(10, s), color: '#737373' }]}>Meaning</Text>
              <Text style={[styles.sheetBody, { fontSize: r(16, s), color: '#111' }]}>{selected.meaning}</Text>
              <Text style={[styles.sheetLabel, { fontSize: r(12, s), marginTop: r(10, s), color: '#737373' }]}>Transliteration</Text>
              <Text style={[styles.sheetBody, { fontSize: r(15, s), color: '#334155' }]}>{selected.transliteration}</Text>
              {focusMode === 'recitation' ? (
                <>
                  <Text style={[styles.sheetLabel, { fontSize: r(12, s), marginTop: r(12, s), color: '#5a7d5a' }]}>Listening cue</Text>
                  <Text style={[styles.sheetBody, { fontSize: r(14, s), lineHeight: r(21, s), color: '#3d5c3d' }]}>
                    {recitationListenCue(selected)}
                  </Text>
                </>
              ) : null}
              <Text style={[styles.sheetLabel, { fontSize: r(12, s), marginTop: r(10, s), color: '#737373' }]}>Grammar snapshot</Text>
              <Text style={[styles.sheetBody, { fontSize: r(15, s), color: '#334155' }]}>{teaching.type}</Text>
              <Text style={[styles.sheetLabel, { fontSize: r(12, s), marginTop: r(10, s), color: '#737373' }]}>Root letters</Text>
              <Text style={[styles.sheetBody, { fontSize: r(16, s), color: '#334155' }]}>{teaching.root ?? '—'}</Text>
              <Text style={[styles.sheetLabel, { fontSize: r(12, s), marginTop: r(10, s), color: '#737373' }]}>Teaching note</Text>
              <Text style={[styles.sheetBody, { fontSize: r(14, s), lineHeight: r(21, s), color: '#475569' }]}>{teaching.teachingNote}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void onPlayWord(selected)}
                style={({ pressed }) => [
                  styles.smallBtn,
                  {
                    marginTop: r(16, s),
                    alignSelf: 'flex-start',
                    borderColor: theme.primaryDark,
                    backgroundColor: theme.primary,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Text style={[styles.smallBtnText, { fontSize: r(14, s), color: '#fff' }]}>Play word audio</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setSelected(null)} style={{ marginTop: r(14, s), alignSelf: 'center' }}>
                <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: r(14, s), color: theme.primaryDark }}>Close</Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );

  const body = (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={isTab ? r(80, s) : r(48, s)}
    >
      {!isTab ? (
        <View style={[styles.header, { paddingTop: insets.top + r(8, s), paddingHorizontal: padH }]}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              hitSlop={12}
              style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.75 : 1 }]}
            >
              <Text style={[styles.headerBtnText, { fontSize: r(18, s), color: theme.primaryDark }]}>‹</Text>
            </Pressable>
          ) : (
            <View style={{ width: 44 }} />
          )}
          <Text style={[styles.headerTitle, { fontSize: r(20, s), color: theme.primaryDark }]}>Ayah Lab</Text>
          <View style={{ width: 44 }} />
        </View>
      ) : (
        <View style={{ paddingHorizontal: padH, paddingTop: r(12, s), paddingBottom: r(6, s) }}>
          <Text style={[styles.heroEyebrow, { fontSize: r(11, s), color: '#8a8a8a' }]}>Grow · Ayah Lab</Text>
          <Text style={[styles.heroTitle, { fontSize: r(22, s), color: theme.primaryDark }]}>Explore a living ayah</Text>
          <Text style={[styles.heroSub, { fontSize: r(13, s), lineHeight: r(19, s), marginTop: r(6, s), color: '#5c5c5c' }]}>
            Calm space to connect your course to real Qur’an text — tap words, listen, and bookmark with your Quran.com account.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingHorizontal: padH, paddingBottom: scrollPadBottom, paddingTop: isTab ? r(4, s) : r(8, s) }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.focusRow, { marginBottom: r(14, s) }]}>
          {FOCUS_OPTIONS.map((opt) => {
            const on = focusMode === opt.id;
            return (
              <Pressable
                key={opt.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setFocusMode(opt.id)}
                style={[
                  styles.focusPill,
                  {
                    paddingVertical: r(8, s),
                    paddingHorizontal: r(12, s),
                    marginRight: r(6, s),
                    borderColor: on ? theme.primaryDark : 'rgba(0,0,0,0.12)',
                    backgroundColor: on ? theme.primary : '#fff',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.focusPillText,
                    { fontSize: r(13, s), color: on ? '#fff' : '#334155' },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {todaysConnection ? (
          <Pressable
            onPress={todaysConnection.onOpenLesson}
            accessibilityRole="button"
            accessibilityLabel="Open today’s lesson from connection card"
            style={({ pressed }) => [
              styles.connectionCard,
              {
                padding: r(14, s),
                borderColor: theme.primaryDark,
                opacity: pressed ? 0.92 : 1,
                marginBottom: r(14, s),
              },
            ]}
          >
            <Text style={[styles.connectionKicker, { fontSize: r(11, s), color: '#6b7280' }]}>Today’s connection</Text>
            <Text style={[styles.connectionTitle, { fontSize: r(16, s), marginTop: r(6, s), color: '#111827' }]}>
              {todaysConnection.lessonTitle}
            </Text>
            {todaysConnection.unitLabel ? (
              <Text style={[styles.connectionMeta, { fontSize: r(12, s), marginTop: r(4, s), color: '#6b7280' }]}>
                {todaysConnection.unitLabel} · {todaysConnection.ayahRef}
              </Text>
            ) : (
              <Text style={[styles.connectionMeta, { fontSize: r(12, s), marginTop: r(4, s), color: '#6b7280' }]}>
                {todaysConnection.ayahRef}
              </Text>
            )}
            <Text style={[styles.connectionCta, { fontSize: r(12, s), marginTop: r(10, s), color: theme.primaryDark }]}>
              Jump to lesson →
            </Text>
          </Pressable>
        ) : null}

        {!QF_CLIENT_ID.trim() ? (
          <View style={[styles.warnBox, { marginBottom: r(12, s), padding: r(12, s) }]}>
            <Text style={[styles.warnText, { fontSize: r(12, s) }]}>
              Set EXPO_PUBLIC_QF_CLIENT_ID and run the token server (see server/) to enable Quran.com sign-in.
            </Text>
          </View>
        ) : null}

        <View style={[styles.authCard, { marginBottom: r(14, s), padding: r(14, s), borderColor: 'rgba(0,0,0,0.1)' }]}>
          <Text style={[styles.authTitle, { fontSize: r(13, s), color: theme.primaryDark }]}>Account & bookmark</Text>
          {idSummary ? (
            <Text style={[styles.authSub, { fontSize: r(12, s), marginTop: r(4, s) }]}>{idSummary}</Text>
          ) : (
            <Text style={[styles.authSub, { fontSize: r(11, s), marginTop: r(4, s), color: '#6b7280' }]}>
              Sign in to sync bookmarks via Quran Foundation APIs.
            </Text>
          )}
          <View style={[styles.authRow, { marginTop: r(10, s) }]}>
            {!accessToken ? (
              <Pressable
                accessibilityRole="button"
                disabled={authBusy || oauthPromptOpen || !request || !QF_CLIENT_ID.trim()}
                onPress={() => void startQuranLogin()}
                style={({ pressed }) => [
                  styles.authBtn,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.primaryDark,
                    opacity: pressed ? 0.9 : authBusy || oauthPromptOpen || !request || !QF_CLIENT_ID.trim() ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={[styles.authBtnText, { fontSize: r(13, s) }]}>
                  {authBusy || oauthPromptOpen ? '…' : 'Login with Quran.com'}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => void logout()}
                style={({ pressed }) => [
                  styles.authBtn,
                  { backgroundColor: '#fff', borderColor: theme.primaryDark, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <Text style={[styles.authBtnText, { fontSize: r(13, s), color: theme.primaryDark }]}>Sign out</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => void bookmarkAyah()}
              style={({ pressed }) => [
                styles.authBtn,
                {
                  marginLeft: r(8, s),
                  backgroundColor: '#f3f4f6',
                  borderColor: 'rgba(0,0,0,0.12)',
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text style={[styles.authBtnText, { fontSize: r(13, s), color: '#111827' }]}>Bookmark ayah</Text>
            </Pressable>
          </View>
          {authError ? <Text style={[styles.errText, { marginTop: r(8, s), fontSize: r(11, s) }]}>{authError}</Text> : null}
          {bookmarkMsg ? <Text style={[styles.hintText, { marginTop: r(6, s), fontSize: r(11, s) }]}>{bookmarkMsg}</Text> : null}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: r(16, s) }} color={theme.primary} />
        ) : loadError ? (
          <Text style={[styles.errText, { marginTop: r(12, s), fontSize: r(14, s) }]}>{loadError}</Text>
        ) : ayah ? (
          <>
            <View style={[styles.heroAyahCard, { padding: r(18, s), borderColor: theme.primaryDark }]}>
              <Text style={[styles.ayahRefPill, { fontSize: r(11, s), color: '#6b7280', marginBottom: r(10, s) }]}>
                Surah {verseKey.replace(':', ' · ')}
              </Text>
              <Text
                style={[
                  styles.ayahArabicHero,
                  {
                    fontSize: focusMode === 'reading' ? r(26, s) : r(22, s),
                    lineHeight: focusMode === 'reading' ? r(48, s) : r(40, s),
                    color: '#0f172a',
                    fontFamily: 'NotoSansArabic_700Bold',
                    ...textPad,
                  },
                ]}
              >
                {ayah.textUthmani}
              </Text>

              {showTransliterationBlock ? (
                <Text
                  style={[
                    styles.translitRibbon,
                    {
                      fontSize: r(13, s),
                      lineHeight: r(20, s),
                      marginTop: r(12, s),
                      color: recitationVisual ? '#2f4f4f' : '#64748b',
                      fontFamily: 'Nunito_700Bold',
                    },
                  ]}
                >
                  {transliterationLine}
                </Text>
              ) : (
                <Text style={[styles.readingHint, { fontSize: r(12, s), marginTop: r(12, s), color: '#94a3b8' }]}>
                  Reading focus: Arabic only here — switch to Meaning for English, or Recitation for audio cues.
                </Text>
              )}

              {showTranslation ? (
                <>
                  <Text style={[styles.transAuthor, { fontSize: r(10, s), marginTop: r(14, s), color: '#9ca3af' }]}>
                    {ayah.translationAuthor}
                  </Text>
                  <Text
                    style={[
                      styles.translationHero,
                      {
                        fontSize: focusMode === 'meaning' ? r(16, s) : r(14, s),
                        lineHeight: focusMode === 'meaning' ? r(24, s) : r(21, s),
                        marginTop: r(4, s),
                        color: '#334155',
                      },
                    ]}
                  >
                    {ayah.translation}
                  </Text>
                </>
              ) : null}

              <View style={[styles.wordWrap, { marginTop: r(16, s) }]}>
                {ayah.words.map((w) => (
                  <Pressable
                    key={w.id}
                    accessibilityRole="button"
                    onPress={() => setSelected(w)}
                    style={({ pressed }) => [
                      styles.wordChip,
                      {
                        borderColor: recitationVisual ? '#7c9e7c' : theme.primaryDark,
                        borderLeftWidth: recitationVisual ? 3 : 1,
                        backgroundColor: recitationVisual ? '#f4faf4' : '#f8fafc',
                        opacity: pressed ? 0.85 : 1,
                        marginRight: r(6, s),
                        marginBottom: r(6, s),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.wordChipText,
                        {
                          fontSize: r(17, s),
                          lineHeight: r(28, s),
                          fontFamily: 'NotoSansArabic_700Bold',
                          ...textPad,
                        },
                      ]}
                    >
                      {w.text}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={[styles.audioRow, { marginTop: r(16, s), flexWrap: 'wrap', gap: r(8, s) }]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void onPlayAyah()}
                  disabled={!ayahAudioUri}
                  style={({ pressed }) => [
                    styles.smallBtn,
                    {
                      borderColor: theme.primaryDark,
                      backgroundColor: ayahAudioUri ? theme.primary : '#e5e7eb',
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.smallBtnText, { fontSize: r(13, s), color: ayahAudioUri ? '#fff' : '#9ca3af' }]}>
                    {focusMode === 'recitation' ? 'Play ayah (recitation)' : 'Play ayah audio'}
                  </Text>
                </Pressable>
                {focusMode === 'recitation' ? (
                  <Text style={[styles.recitationHint, { fontSize: r(11, s), color: '#5a7d5a', flex: 1, minWidth: r(120, s) }]}>
                    Tajwīd overlays can plug in here when your data source exposes rules; for now, use word audio + these cues.
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={[styles.reflectionCard, { marginTop: r(16, s), padding: r(14, s), borderColor: 'rgba(0,0,0,0.08)' }]}>
              <Text style={[styles.reflectionTitle, { fontSize: r(14, s), color: theme.primaryDark }]}>Reflection</Text>
              <Text style={[styles.reflectionSub, { fontSize: r(11, s), marginTop: r(4, s), color: '#6b7280' }]}>
                A few lines for yourself — stored on this device until you wire Firebase or Quran.com notes.
              </Text>
              <TextInput
                value={reflectionText}
                onChangeText={(t) => {
                  setReflectionText(t);
                  setReflectionNote(null);
                }}
                placeholder="What stands out to you in this ayah today?"
                placeholderTextColor="#9ca3af"
                multiline
                style={[
                  styles.reflectionInput,
                  {
                    marginTop: r(10, s),
                    minHeight: r(88, s),
                    padding: r(12, s),
                    fontSize: r(14, s),
                    borderColor: 'rgba(0,0,0,0.12)',
                  },
                ]}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => void saveReflection()}
                style={({ pressed }) => [
                  styles.saveReflectionBtn,
                  {
                    marginTop: r(10, s),
                    backgroundColor: theme.primary,
                    borderColor: theme.primaryDark,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Text style={[styles.saveReflectionText, { fontSize: r(13, s) }]}>Save reflection</Text>
              </Pressable>
              {reflectionNote ? (
                <Text style={[styles.hintText, { fontSize: r(11, s), marginTop: r(8, s) }]}>{reflectionNote}</Text>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
      {sheet}
    </KeyboardAvoidingView>
  );

  return <View style={[styles.root, isTab && styles.rootTab]}>{body}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff8e8' },
  rootTab: { backgroundColor: '#faf8f4' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontFamily: 'Fredoka_600SemiBold' },
  headerTitle: { fontFamily: 'Fredoka_600SemiBold', ...textPad },
  heroEyebrow: { fontFamily: 'Nunito_800ExtraBold', letterSpacing: 0.6, textTransform: 'uppercase' },
  heroTitle: { fontFamily: 'Fredoka_600SemiBold', ...textPad },
  heroSub: { fontFamily: 'Nunito_700Bold' },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  focusPill: { borderRadius: 999, borderWidth: 1.5 },
  focusPillText: { fontFamily: 'Nunito_800ExtraBold' },
  connectionCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  connectionKicker: { fontFamily: 'Nunito_800ExtraBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  connectionTitle: { fontFamily: 'Fredoka_600SemiBold', ...textPad },
  connectionMeta: { fontFamily: 'Nunito_700Bold' },
  connectionCta: { fontFamily: 'Nunito_800ExtraBold' },
  warnBox: { backgroundColor: '#fffbeb', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  warnText: { fontFamily: 'Nunito_700Bold', color: '#92400e' },
  authCard: { borderRadius: 14, borderWidth: 1, backgroundColor: '#fff' },
  authTitle: { fontFamily: 'Fredoka_600SemiBold' },
  authSub: { fontFamily: 'Nunito_700Bold', color: '#334155' },
  authRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  authBtn: { borderRadius: 10, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 12 },
  authBtnText: { fontFamily: 'Nunito_800ExtraBold', color: '#fff' },
  errText: { fontFamily: 'Nunito_700Bold', color: '#b00020' },
  hintText: { fontFamily: 'Nunito_700Bold', color: '#475569' },
  heroAyahCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  ayahRefPill: { fontFamily: 'Nunito_800ExtraBold', alignSelf: 'flex-start' },
  ayahArabicHero: { textAlign: 'right' },
  translitRibbon: { textAlign: 'center' },
  readingHint: { fontFamily: 'Nunito_700Bold', textAlign: 'center' },
  transAuthor: { fontFamily: 'Nunito_700Bold' },
  translationHero: { fontFamily: 'Nunito_700Bold' },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' },
  wordChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  wordChipText: { color: '#0f172a' },
  audioRow: { flexDirection: 'row', alignItems: 'center' },
  recitationHint: { fontFamily: 'Nunito_700Bold' },
  smallBtn: { borderRadius: 10, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12 },
  smallBtnText: { fontFamily: 'Nunito_800ExtraBold' },
  reflectionCard: { borderRadius: 16, borderWidth: 1, backgroundColor: '#fff' },
  reflectionTitle: { fontFamily: 'Fredoka_600SemiBold' },
  reflectionSub: { fontFamily: 'Nunito_700Bold' },
  reflectionInput: {
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fafafa',
    textAlignVertical: 'top',
    fontFamily: 'Nunito_700Bold',
    color: '#111827',
  },
  saveReflectionBtn: { alignSelf: 'flex-start', borderRadius: 10, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 14 },
  saveReflectionText: { fontFamily: 'Nunito_800ExtraBold', color: '#fff' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '88%',
  },
  sheetWord: { textAlign: 'center' },
  sheetLabel: { fontFamily: 'Nunito_800ExtraBold' },
  sheetBody: { fontFamily: 'Nunito_700Bold' },
});
