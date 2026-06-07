import type { ImageSourcePropType } from 'react-native';

import type { LearningPathId } from '../components/ChoosePathScreen';

const HERO_POOL: ImageSourcePropType[] = [
  require('../assets/lesson-intro/hero-default.png'),
  require('../assets/lesson-intro/hero-courtyard.png'),
  require('../assets/lesson-intro/hero-river.png'),
  require('../assets/lesson-intro/hero-field.png'),
  require('../assets/lesson-intro/hero-dome.png'),
  require('../assets/lesson-intro/hero-kaaba.png'),
  require('../assets/lesson-intro/hero-mosque.png'),
];

/** Deterministic hash so each lesson always gets the same background, but it feels random. */
function lessonHash(path: string, unitIndex: number, lessonIndex: number): number {
  const key = `${path}:${unitIndex}:${lessonIndex}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(31, h) + key.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function defaultLessonHeroBackground(
  path: LearningPathId,
  unitIndex = 0,
  lessonIndex = 0,
): ImageSourcePropType {
  return HERO_POOL[lessonHash(path, unitIndex, lessonIndex) % HERO_POOL.length];
}
