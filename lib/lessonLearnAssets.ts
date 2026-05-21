import type { ImageSourcePropType } from 'react-native';

import LessonLearnCloseCircle from '../assets/lesson-learn/close-circle.svg';
import LessonLearnIconClose from '../assets/lesson-learn/icon-close.svg';
import LessonLearnIconStar from '../assets/lesson-learn/icon-star.svg';
import LessonLearnIconStarSmall from '../assets/lesson-learn/icon-star-small.svg';
import LessonLearnSoundCircle from '../assets/lesson-learn/sound-circle.svg';
import LessonLearnIconArrowDown from '../assets/lesson-learn/icon-arrow-down.svg';
import LessonLearnIconRestart from '../assets/lesson-learn/icon-restart.svg';
import LessonLearnIconSound from '../assets/lesson-learn/icon-sound.svg';
import LessonLearnVsCircle from '../assets/lesson-learn/vs-circle.svg';
import LessonLearnIconCheckmarkFilled from '../assets/lesson-learn/icon-checkmark-filled.svg';
import LessonLearnWhyLightbulb from '../assets/lesson-learn/icon-why-lightbulb.svg';
import LessonLearnWhyPlant from '../assets/lesson-learn/icon-why-plant.svg';
import LessonLearnWhyShield from '../assets/lesson-learn/icon-why-shield.svg';
import LessonLearnIconCheckmarkOutline from '../assets/lesson-learn/icon-checkmark-outline.svg';
import LessonLearnIconRedo from '../assets/lesson-learn/icon-redo.svg';
import LessonLearnIconRewardBook from '../assets/lesson-learn/icon-reward-book.svg';
import LessonLearnIconRewardStreak from '../assets/lesson-learn/icon-reward-streak.svg';

export const lessonLearnIcons = {
  closeCircle: LessonLearnCloseCircle,
  close: LessonLearnIconClose,
  star: LessonLearnIconStar,
  starSmall: LessonLearnIconStarSmall,
  arrowDown: LessonLearnIconArrowDown,
  restart: LessonLearnIconRestart,
  sound: LessonLearnIconSound,
  soundCircle: LessonLearnSoundCircle,
  vsCircle: LessonLearnVsCircle,
  checkmarkFilled: LessonLearnIconCheckmarkFilled,
  whyLightbulb: LessonLearnWhyLightbulb,
  whyPlant: LessonLearnWhyPlant,
  whyShield: LessonLearnWhyShield,
} as const;

export const lessonLearnFeedbackMascot: ImageSourcePropType = require('../assets/lesson-learn/feedback-mascot.png');
export const lessonLearnLantern: ImageSourcePropType = require('../assets/lesson-learn/lantern.png');
export const lessonLearnSprout: ImageSourcePropType = require('../assets/lesson-learn/sprout.png');
export const lessonLearnWhyQuran: ImageSourcePropType = require('../assets/lesson-learn/icon-why-quran.png');
export const lessonLearnReflectionMascot: ImageSourcePropType = require('../assets/lesson-learn/reflection-mascot-rug.png');
export const lessonLearnCompleteMascot: ImageSourcePropType = require('../assets/lesson-learn/lesson-complete-mascot.png');

export const lessonLearnCompleteIcons = {
  checkmarkOutline: LessonLearnIconCheckmarkOutline,
  redo: LessonLearnIconRedo,
  rewardBook: LessonLearnIconRewardBook,
  rewardStreak: LessonLearnIconRewardStreak,
} as const;
