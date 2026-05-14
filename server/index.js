/**
 * Minimal backend: OAuth2 authorization-code + PKCE exchange for Quran Foundation.
 * Keeps CLIENT_SECRET off the mobile app. See server/.env.example.
 *
 * POST /api/auth/qf/exchange
 *   body: { code, codeVerifier, redirectUri }
 *
 * POST /api/auth/qf/refresh
 *   body: { refreshToken }
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const PORT = Number(process.env.PORT || 8787);
const CLIENT_ID = process.env.QF_CLIENT_ID;
const CLIENT_SECRET = process.env.QF_CLIENT_SECRET;
const USE_PRELIVE = (process.env.QF_USE_PRELIVE ?? 'true').toLowerCase() === 'true';

const TOKEN_URL = USE_PRELIVE
  ? 'https://prelive-oauth2.quran.foundation/oauth2/token'
  : 'https://oauth2.quran.foundation/oauth2/token';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

function requireEnv(res) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    res.status(500).json({
      error: 'server_misconfigured',
      error_description: 'Set QF_CLIENT_ID and QF_CLIENT_SECRET in server/.env',
    });
    return false;
  }
  return true;
}

async function postToken(bodyParams) {
  const body = new URLSearchParams(bodyParams);
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { ok: r.ok, status: r.status, data };
}

app.post('/api/auth/qf/exchange', async (req, res) => {
  if (!requireEnv(res)) return;
  const { code, codeVerifier, redirectUri } = req.body ?? {};
  if (!code || !codeVerifier || !redirectUri) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'code, codeVerifier, redirectUri required' });
  }

  const { ok, status, data } = await postToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code_verifier: codeVerifier,
  });

  if (!ok) {
    return res.status(status >= 400 ? status : 400).json(data);
  }

  return res.json({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  });
});

app.post('/api/auth/qf/refresh', async (req, res) => {
  if (!requireEnv(res)) return;
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'refreshToken required' });
  }

  const { ok, status, data } = await postToken({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  if (!ok) {
    return res.status(status >= 400 ? status : 400).json(data);
  }

  return res.json({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    idToken: data.id_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, prelive: USE_PRELIVE });
});

app.listen(PORT, () => {
  console.log(`QF token helper listening on http://localhost:${PORT}`);
});
