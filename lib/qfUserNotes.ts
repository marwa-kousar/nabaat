/** Quran Foundation user `/auth/v1/notes` helpers (prelive = apis-prelive, prod = apis). */

export const QF_NOTE_BODY_MIN_LENGTH = 6;

export function verseKeyToNoteRange(verseKey: string): string | null {
  const [s, a] = verseKey.split(':');
  if (!s || !a || !/^\d+$/.test(s) || !/^\d+$/.test(a)) return null;
  return `${s}:${a}-${s}:${a}`;
}

function headersJson(accessToken: string, clientId: string): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-auth-token': accessToken,
    'x-client-id': clientId,
  };
}

function headersGet(accessToken: string, clientId: string): Record<string, string> {
  return {
    Accept: 'application/json',
    'x-auth-token': accessToken,
    'x-client-id': clientId,
  };
}

export type QfNoteRow = { id: string; body?: string };

function parseNoteId(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function qfJsonOk(httpOk: boolean, json: unknown): boolean {
  if (!httpOk) return false;
  if (!json || typeof json !== 'object') return true;
  const success = (json as { success?: boolean }).success;
  return success !== false;
}

function parseNoteIdFromBody(json: unknown): string | undefined {
  if (!json || typeof json !== 'object') return undefined;
  const data = (json as { data?: { id?: unknown } }).data;
  return parseNoteId(data?.id);
}

function parseNoteList(json: unknown): QfNoteRow[] {
  if (!json || typeof json !== 'object') return [];
  const rec = json as { data?: unknown };
  if (!Array.isArray(rec.data)) return [];
  const rows: QfNoteRow[] = [];
  for (const item of rec.data) {
    if (typeof item !== 'object' || item === null) continue;
    const id = parseNoteId((item as { id?: unknown }).id);
    if (!id) continue;
    const body = (item as { body?: unknown }).body;
    rows.push({ id, body: typeof body === 'string' ? body : undefined });
  }
  return rows;
}

export async function qfListNotesByVerse(
  apiBase: string,
  accessToken: string,
  clientId: string,
  verseKey: string,
): Promise<{ ok: boolean; status: number; notes: QfNoteRow[]; raw: string }> {
  const url = `${apiBase.replace(/\/$/, '')}/notes/by-verse/${encodeURIComponent(verseKey)}`;
  const res = await fetch(url, { method: 'GET', headers: headersGet(accessToken, clientId) });
  const raw = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return { ok: res.ok, status: res.status, notes: [], raw };
  }
  const ok = qfJsonOk(res.ok, json);
  return { ok, status: res.status, notes: ok ? parseNoteList(json) : [], raw };
}

export async function qfCreateNote(
  apiBase: string,
  accessToken: string,
  clientId: string,
  body: string,
  range: string,
): Promise<{ ok: boolean; status: number; noteId?: string; raw: string }> {
  const url = `${apiBase.replace(/\/$/, '')}/notes`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headersJson(accessToken, clientId),
    body: JSON.stringify({
      body,
      saveToQR: true,
      ranges: [range],
    }),
  });
  const raw = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return { ok: res.ok, status: res.status, raw };
  }
  const ok = qfJsonOk(res.ok, json);
  const noteId = ok ? parseNoteIdFromBody(json) : undefined;
  return { ok, status: res.status, noteId, raw };
}

export async function qfPatchNote(
  apiBase: string,
  accessToken: string,
  clientId: string,
  noteId: string,
  body: string,
  range: string,
): Promise<{ ok: boolean; status: number; raw: string }> {
  const url = `${apiBase.replace(/\/$/, '')}/notes/${encodeURIComponent(noteId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: headersJson(accessToken, clientId),
    body: JSON.stringify({
      body,
      saveToQR: true,
      ranges: [range],
    }),
  });
  const raw = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return { ok: res.ok, status: res.status, raw };
  }
  return { ok: qfJsonOk(res.ok, json), status: res.status, raw };
}

export async function qfDeleteNote(
  apiBase: string,
  accessToken: string,
  clientId: string,
  noteId: string,
): Promise<{ ok: boolean; status: number; raw: string }> {
  const url = `${apiBase.replace(/\/$/, '')}/notes/${encodeURIComponent(noteId)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: headersGet(accessToken, clientId),
  });
  const raw = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return { ok: res.ok, status: res.status, raw };
  }
  return { ok: qfJsonOk(res.ok, json), status: res.status, raw };
}
