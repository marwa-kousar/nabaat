import type { ReactNode } from 'react';
import { Text } from 'react-native';

import type { LearningPathId } from '../components/ChoosePathScreen';
import { getLessonAtIndices, type LessonJson, type UnitJson } from './loadUnits';

export type LessonIntroModel = {
  unitDisplay: string;
  lessonDisplay: string;
  titleEn: string;
  titleAr: string;
  /** Intro body: from JSON when `introDescription` is set; otherwise code fallback. */
  description: ReactNode;
  levelLabel: string;
  estTimeLabel: string;
  conceptsLabel: string;
};

type DescColors = { muted: string; accent: string };

const DEFAULT_EST_MINUTES = 5;
const DEFAULT_CONCEPTS_COUNT = 3;

export function formatEstMinutesLabel(minutes: number): string {
  return `${minutes} min`;
}

export function formatConceptsCountLabel(count: number): string {
  return `${count} Concept${count === 1 ? '' : 's'}`;
}

/** Renders bundled `introDescription` as a single plain-text block. */
export function introDescriptionFromJson(body: string, muted: string): ReactNode {
  return (
    <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 15, lineHeight: 22, color: muted }}>{body}</Text>
  );
}

function genericLessonDescription(colors: DescColors) {
  return (
    <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 15, lineHeight: 22, color: colors.muted }}>
      Work through guided steps and short checks to reinforce what you learn in this lesson.
    </Text>
  );
}

/** Used only when a lesson row has no `introDescription` in JSON. */
export function getLessonIntroDescriptionFallback(colors: DescColors): ReactNode {
  return genericLessonDescription(colors);
}

/** Build intro copy from bundled unit/lesson JSON; description prefers `lesson.introDescription`. */
export function buildLessonIntroModel(
  _path: LearningPathId,
  _unitIndex: number,
  _lessonIndex: number,
  unit: UnitJson,
  lesson: LessonJson,
  colors: DescColors,
): LessonIntroModel {
  const est = lesson.estMinutes ?? DEFAULT_EST_MINUTES;
  const concepts = lesson.conceptsCount ?? DEFAULT_CONCEPTS_COUNT;

  const trimmedIntro = typeof lesson.introDescription === 'string' ? lesson.introDescription.trim() : '';
  const description =
    trimmedIntro.length > 0
      ? introDescriptionFromJson(trimmedIntro, colors.muted)
      : getLessonIntroDescriptionFallback(colors);

  return {
    unitDisplay: `Unit ${unit.num}`,
    lessonDisplay: `Lesson ${lesson.num}`,
    titleEn: lesson.title,
    titleAr: lesson.titleAr ?? '',
    description,
    levelLabel: unit.tag,
    estTimeLabel: formatEstMinutesLabel(est),
    conceptsLabel: formatConceptsCountLabel(concepts),
  };
}

/**
 * Fallback when indices are unavailable: first lesson of the path.
 * Prefer `buildLessonIntroModel` with JSON-backed unit/lesson rows.
 */
export function getDefaultLessonIntro(path: LearningPathId, colors: DescColors): LessonIntroModel {
  const hit = getLessonAtIndices(path, 0, 0);
  if (hit) {
    return buildLessonIntroModel(path, 0, 0, hit.unit, hit.lesson, colors);
  }
  return {
    unitDisplay: 'Unit 0',
    lessonDisplay: 'Lesson 1',
    titleEn: '',
    titleAr: '',
    description: getLessonIntroDescriptionFallback(colors),
    levelLabel: 'Beginner',
    estTimeLabel: formatEstMinutesLabel(DEFAULT_EST_MINUTES),
    conceptsLabel: formatConceptsCountLabel(DEFAULT_CONCEPTS_COUNT),
  };
}
