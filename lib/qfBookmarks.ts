/** Quran Foundation `/collections/__default__/bookmarks` helpers. */

export const QF_DEFAULT_COLLECTION = '__default__';
/** Mushaf ID: 4 = Uthmani Hafs (Quran.com default). */
export const QF_BOOKMARK_MUSHAF = 4;

export type AyahBookmarkBody = {
  type: 'ayah';
  key: number;
  verseNumber: number;
  mushaf: number;
};

/** Parse `2:183` for bookmark create/delete body (surah + ayah). */
export function verseKeyToBookmarkAyah(verseKey: string): Omit<AyahBookmarkBody, 'type' | 'mushaf'> | null {
  const parts = verseKey.split(':');
  if (parts.length !== 2) return null;
  const key = Number(parts[0]);
  const verseNumber = Number(parts[1]);
  if (!Number.isInteger(key) || !Number.isInteger(verseNumber) || key < 1 || verseNumber < 1) return null;
  return { key, verseNumber };
}

function bookmarkPayload(verseKey: string): AyahBookmarkBody | null {
  const ids = verseKeyToBookmarkAyah(verseKey);
  if (!ids) return null;
  return { type: 'ayah', ...ids, mushaf: QF_BOOKMARK_MUSHAF };
}

function headersJson(accessToken: string, clientId: string): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-auth-token': accessToken,
    'x-client-id': clientId,
  };
}

function collectionBookmarksUrl(apiBase: string, collectionId: string): string {
  return `${apiBase.replace(/\/$/, '')}/collections/${encodeURIComponent(collectionId)}/bookmarks`;
}

export async function qfAddCollectionBookmark(
  apiBase: string,
  accessToken: string,
  clientId: string,
  verseKey: string,
): Promise<{ ok: boolean; status: number; raw: string }> {
  const body = bookmarkPayload(verseKey);
  if (!body) return { ok: false, status: 0, raw: 'invalid verse key' };
  const res = await fetch(collectionBookmarksUrl(apiBase, QF_DEFAULT_COLLECTION), {
    method: 'POST',
    headers: headersJson(accessToken, clientId),
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  return { ok: res.ok, status: res.status, raw };
}

/** Delete bookmark from Favorites by ayah details (QF delete-collection-bookmark-by-details). */
export async function qfDeleteCollectionBookmarkByDetails(
  apiBase: string,
  accessToken: string,
  clientId: string,
  verseKey: string,
): Promise<{ ok: boolean; status: number; raw: string }> {
  const body = bookmarkPayload(verseKey);
  if (!body) return { ok: false, status: 0, raw: 'invalid verse key' };
  const res = await fetch(collectionBookmarksUrl(apiBase, QF_DEFAULT_COLLECTION), {
    method: 'DELETE',
    headers: headersJson(accessToken, clientId),
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  return { ok: res.ok, status: res.status, raw };
}
