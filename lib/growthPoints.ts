import * as SecureStore from 'expo-secure-store';

const GROWTH_POINTS_KEY = 'nabaat_growth_points';
const AWARDS_STATE_KEY = 'nabaat_lesson_awards_v1';
const COMPLETED_LESSONS_KEY = 'nabaat_completed_lessons_json';
const GROWTH_RESET_APPLIED_KEY = 'nabaat_growth_reset_applied_v3';

/** Prevents double-award when SecureStore is slow and the user finishes twice in one session. */
const sessionAwardedLessons = new Set<string>();

type AwardsState = {
  version: 1;
  byLesson: Record<string, number>;
};

function sumAwards(byLesson: Record<string, number>): number {
  return Object.values(byLesson).reduce((sum, n) => sum + (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0), 0);
}

export function lessonCompletionKey(
  learningPath: string,
  unitIndex: number,
  lessonIndex: number,
): string {
  return `${learningPath}:${unitIndex}:${lessonIndex}`;
}

async function readAwardsState(): Promise<AwardsState> {
  try {
    const raw = await SecureStore.getItemAsync(AWARDS_STATE_KEY);
    if (!raw) return { version: 1, byLesson: {} };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { version: 1, byLesson: {} };
    }
    const byLesson = (parsed as { byLesson?: unknown }).byLesson;
    if (!byLesson || typeof byLesson !== 'object' || Array.isArray(byLesson)) {
      return { version: 1, byLesson: {} };
    }
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(byLesson)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) clean[k] = Math.floor(v);
    }
    return { version: 1, byLesson: clean };
  } catch {
    return { version: 1, byLesson: {} };
  }
}

async function writeAwardsState(state: AwardsState): Promise<void> {
  const total = sumAwards(state.byLesson);
  await SecureStore.setItemAsync(AWARDS_STATE_KEY, JSON.stringify(state));
  await SecureStore.setItemAsync(GROWTH_POINTS_KEY, String(total));
  await SecureStore.setItemAsync(
    COMPLETED_LESSONS_KEY,
    JSON.stringify(Object.keys(state.byLesson)),
  );
}

let persistQueue: Promise<void> = Promise.resolve();

function enqueueAward<T>(fn: () => Promise<T>): Promise<T> {
  const run = persistQueue.then(fn);
  persistQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function loadGrowthPoints(): Promise<number> {
  const state = await readAwardsState();
  return sumAwards(state.byLesson);
}

/** Returns the set of lesson keys (e.g. "nahw:0:0") that have been awarded. */
export async function loadCompletedLessonKeys(): Promise<Set<string>> {
  const state = await readAwardsState();
  const keys = new Set(Object.keys(state.byLesson).filter((k) => k !== '__legacy__'));
  return keys;
}

/** Clears all lesson awards and session bookkeeping; home total becomes 0. */
export async function resetGrowthPoints(): Promise<void> {
  sessionAwardedLessons.clear();
  await SecureStore.deleteItemAsync(AWARDS_STATE_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(GROWTH_POINTS_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(COMPLETED_LESSONS_KEY).catch(() => {});
  await writeAwardsState({ version: 1, byLesson: {} });
}

/** Call once when the app boots — loads stored total or applies the pending zero reset. */
export async function initializeGrowthPoints(): Promise<number> {
  if (__DEV__) {
    await resetGrowthPoints();
    return 0;
  }

  const flag = await SecureStore.getItemAsync(GROWTH_RESET_APPLIED_KEY);
  if (flag === 'v3_zero') {
    return loadGrowthPoints();
  }

  await resetGrowthPoints();
  await SecureStore.setItemAsync(GROWTH_RESET_APPLIED_KEY, 'v3_zero');
  return 0;
}

export async function saveGrowthPoints(total: number): Promise<void> {
  const safe = Math.max(0, Math.floor(total));
  await SecureStore.setItemAsync(GROWTH_POINTS_KEY, String(safe));
}

/** @deprecated Use awardLessonSeedsFirstTime — kept for any legacy callers. */
export async function addGrowthPoints(delta: number): Promise<number> {
  const add = Math.max(0, Math.floor(delta));
  if (add === 0) return loadGrowthPoints();
  const state = await readAwardsState();
  state.byLesson.__legacy__ = (state.byLesson.__legacy__ ?? 0) + add;
  await writeAwardsState(state);
  return sumAwards(state.byLesson);
}

/** Banks seeds once per lesson (first finish only). Safe to call on every completion. */
export async function awardLessonSeedsFirstTime(
  lessonKey: string,
  seeds: number,
): Promise<{ total: number; seedsAdded: number }> {
  return enqueueAward(async () => {
    const add = Math.max(0, Math.floor(seeds));
    const state = await readAwardsState();

    if (sessionAwardedLessons.has(lessonKey) || state.byLesson[lessonKey] != null) {
      return { total: sumAwards(state.byLesson), seedsAdded: 0 };
    }

    if (add === 0) {
      return { total: sumAwards(state.byLesson), seedsAdded: 0 };
    }

    state.byLesson[lessonKey] = add;
    sessionAwardedLessons.add(lessonKey);
    await writeAwardsState(state);
    return { total: sumAwards(state.byLesson), seedsAdded: add };
  });
}
