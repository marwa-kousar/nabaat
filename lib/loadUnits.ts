import type { LearningPathId } from '../components/ChoosePathScreen';
import type { LessonStepJson } from './lessonSteps';

export type LessonJson = {
  num: number;
  title: string;
  titleAr?: string;
  done?: boolean;
  /** Estimated minutes for intro stats; optional for older bundles. */
  estMinutes?: number;
  /** Concept count for intro stats; optional for older bundles. */
  conceptsCount?: number;
  /** Plain-text lesson intro body for the intro sheet (optional → code fallback). */
  introDescription?: string;
  /** In-lesson screens (Figma learn flow); when empty, app may use a demo flow. */
  steps?: LessonStepJson[];
};

export type UnitJson = {
  num: string;
  titleEn: string;
  titleAr: string;
  tag: string;
  tagColor: string;
  leafIntermediate: boolean;
  iconBg: string;
  iconRadius: number;
  numColor: string;
  arabicColor: string;
  locked: boolean;
  active: boolean;
  lessons: LessonJson[];
};

export type UnitsFileJson = {
  meta?: { completedUnitCount?: number; totalUnitCount?: number };
  units: UnitJson[];
};

const BUNDLES: Record<LearningPathId, UnitsFileJson> = {
  nahw: require('../assets/data/nahw_units.json') as UnitsFileJson,
  sarf: require('../assets/data/sarf_units.json') as UnitsFileJson,
  tajweed: require('../assets/data/tajweed_units.json') as UnitsFileJson,
  qaida: require('../assets/data/qaida_units.json') as UnitsFileJson,
};

function normalize(file: UnitsFileJson): UnitJson[] {
  if (!file?.units || !Array.isArray(file.units)) return [];
  return file.units.map((u) => ({
    ...u,
    lessons: (u.lessons ?? []).map((l) => ({
      ...l,
      done: l.done ?? false,
    })),
  }));
}

/**
 * Loads unit rows for the active path from bundled JSON.
 * Swap this implementation for Firestore / API later; callers stay the same.
 */
export async function loadUnitsForPath(path: LearningPathId): Promise<UnitJson[]> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  const raw = BUNDLES[path];
  if (!raw) return [];
  return normalize(raw);
}

/** Same rows as `loadUnitsForPath`, synchronously from bundled JSON. */
export function getUnitsForPathSync(path: LearningPathId): UnitJson[] {
  const raw = BUNDLES[path];
  if (!raw) return [];
  return normalize(raw);
}

export function getLessonAtIndices(
  path: LearningPathId,
  unitIndex: number,
  lessonIndex: number,
): { unit: UnitJson; lesson: LessonJson } | null {
  const units = getUnitsForPathSync(path);
  const unit = units[unitIndex] ?? units[0];
  if (!unit) return null;
  const lesson = unit.lessons?.[lessonIndex] ?? unit.lessons?.[0];
  if (!lesson) return null;
  return { unit, lesson };
}

export function getLessonSteps(
  path: LearningPathId,
  unitIndex: number,
  lessonIndex: number,
): LessonStepJson[] {
  const hit = getLessonAtIndices(path, unitIndex, lessonIndex);
  return hit?.lesson.steps ?? [];
}

export function getUnitsMeta(path: LearningPathId): { completed: number; total: number } {
  const file = BUNDLES[path];
  const unitCount = file?.units?.length ?? 0;
  const total = file?.meta?.totalUnitCount ?? Math.max(unitCount, 1);
  const completed = file?.meta?.completedUnitCount ?? 0;
  return { completed, total };
}
