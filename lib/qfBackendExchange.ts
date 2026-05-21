import { QF_BACKEND_BASE_URL } from './qfEnv';

export type QfTokenBundle = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
};

function tokenBackendHint(): string {
  const base = QF_BACKEND_BASE_URL.replace(/\/$/, '');
  if (base.includes('localhost') || base.includes('127.0.0.1')) {
    return ` The app is set to reach ${base}. On a physical phone, "localhost" is the phone — not your computer. Set EXPO_PUBLIC_QF_BACKEND_URL to http://YOUR_COMPUTER_LAN_IP:8787 (same Wi‑Fi), restart Expo, and keep \`node server/index.js\` running. Android emulator: try http://10.0.2.2:8787.`;
  }
  return ` Could not reach ${base}. Check the URL, HTTPS, and that the token server is running.`;
}

async function postExchange(url: string, body: object): Promise<Response> {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    throw new Error(`${msg}.${tokenBackendHint()}`);
  }
}

export async function exchangeCodeOnBackend(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<QfTokenBundle> {
  const url = `${QF_BACKEND_BASE_URL.replace(/\/$/, '')}/api/auth/qf/exchange`;
  const res = await postExchange(url, {
    code: params.code,
    codeVerifier: params.codeVerifier,
    redirectUri: params.redirectUri,
  });
  const payload = (await res.json()) as QfTokenBundle & { error?: string; error_description?: string };
  if (!res.ok) {
    throw new Error(payload.error_description ?? payload.error ?? 'Token exchange failed');
  }
  if (!payload.accessToken) {
    throw new Error('Missing accessToken from backend');
  }
  return payload;
}

export async function refreshOnBackend(refreshToken: string): Promise<QfTokenBundle> {
  const url = `${QF_BACKEND_BASE_URL.replace(/\/$/, '')}/api/auth/qf/refresh`;
  const res = await postExchange(url, { refreshToken });
  const payload = (await res.json()) as QfTokenBundle & { error?: string; error_description?: string };
  if (!res.ok) {
    throw new Error(payload.error_description ?? payload.error ?? 'Refresh failed');
  }
  if (!payload.accessToken) {
    throw new Error('Missing accessToken from refresh');
  }
  return payload;
}
