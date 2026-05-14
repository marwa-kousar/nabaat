import { QF_BACKEND_BASE_URL } from './qfEnv';

export type QfTokenBundle = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
};

export async function exchangeCodeOnBackend(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<QfTokenBundle> {
  const res = await fetch(`${QF_BACKEND_BASE_URL.replace(/\/$/, '')}/api/auth/qf/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: params.code,
      codeVerifier: params.codeVerifier,
      redirectUri: params.redirectUri,
    }),
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
  const res = await fetch(`${QF_BACKEND_BASE_URL.replace(/\/$/, '')}/api/auth/qf/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const payload = (await res.json()) as QfTokenBundle & { error?: string; error_description?: string };
  if (!res.ok) {
    throw new Error(payload.error_description ?? payload.error ?? 'Refresh failed');
  }
  if (!payload.accessToken) {
    throw new Error('Missing accessToken from refresh');
  }
  return payload;
}
