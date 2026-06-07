import type { ImageSourcePropType } from 'react-native';

import type { LearningPathId } from '../components/ChoosePathScreen';

/** All hero backgrounds, cycled per lesson. Order determines rotation. */
const HERO_POOL: ImageSourcePropType[] = [
  require('../assets/lesson-intro/hero-default.png'),
  require('../assets/lesson-intro/hero-courtyard.png'),
  require('../assets/lesson-intro/hero-river.png'),
  require('../assets/lesson-intro/hero-field.png'),
  require('../assets/lesson-intro/hero-dome.png'),
  require('../assets/lesson-intro/hero-kaaba.png'),
  require('../assets/lesson-intro/hero-mosque.png'),
];

/**
 * Returns a hero background for the given path + lesson position.
 * Cycles through the pool so each lesson gets a different image.
 */
export function defaultLessonHeroBackground(
  path: LearningPathId,
  unitIndex = 0,
  lessonIndex = 0,
): ImageSourcePropType {
  // Give each path a different starting offset so paths don't all show the same image for lesson 1
  const pathOffset: Record<LearningPathId, number> = { nahw: 0, sarf: 2, tajweed: 4, qaida: 6 };
  const offset = pathOffset[path] ?? 0;
  const index = (offset + unitIndex * 3 + lessonIndex) % HERO_POOL.length;
  return HERO_POOL[index];
}
