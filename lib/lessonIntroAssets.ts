import type { ImageSourcePropType } from 'react-native';

import type { LearningPathId } from '../components/ChoosePathScreen';

/** Default hero art per path (swap per-lesson later via `heroBackground` prop). */
export function defaultLessonHeroBackground(path: LearningPathId): ImageSourcePropType {
  switch (path) {
    case 'nahw':
      return require('../assets/lesson-intro/hero-default.png');
    case 'sarf':
      return require('../assets/start-mosque.png');
    case 'tajweed':
      return require('../assets/goal-bg.png');
    case 'qaida':
      return require('../assets/daily-goal-bg.png');
    default:
      return require('../assets/lesson-intro/hero-default.png');
  }
}
