/** Quran Foundation OAuth2 / OIDC (prelive vs prod). */
export const QF_USE_PRELIVE = (process.env.EXPO_PUBLIC_QF_USE_PRELIVE ?? 'true') === 'true';

export const QF_AUTH_BASE = QF_USE_PRELIVE
  ? 'https://prelive-oauth2.quran.foundation'
  : 'https://oauth2.quran.foundation';

export const qfDiscovery = {
  authorizationEndpoint: `${QF_AUTH_BASE}/oauth2/auth`,
  tokenEndpoint: `${QF_AUTH_BASE}/oauth2/token`,
  revocationEndpoint: `${QF_AUTH_BASE}/oauth2/revoke`,
};

/** User APIs (bookmarks, etc.) — use prelive base when testing prelive login. */
export const QF_USER_API_BASE =
  process.env.EXPO_PUBLIC_QF_USER_API_BASE ??
  (QF_USE_PRELIVE ? 'https://apis-prelive.quran.foundation/auth/v1' : 'https://apis.quran.foundation/auth/v1');

export const QF_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_QF_BACKEND_URL ?? 'http://localhost:8787';

export const QF_CLIENT_ID = process.env.EXPO_PUBLIC_QF_CLIENT_ID ?? '';

export const QF_OAUTH_SCOPES = ['openid', 'offline_access', 'bookmark', 'collection', 'note', 'user'] as const;
