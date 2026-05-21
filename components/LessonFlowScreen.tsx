import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import type { LearningPathId } from './ChoosePathScreen';
import { ExampleLessonFlowScreen } from './ExampleLessonFlowScreen';
import { LessonCompareStepScreen } from './LessonCompareStepScreen';
import { LessonCompleteScreen } from './LessonCompleteScreen';
import { LessonEndingsRevealScreen } from './LessonEndingsRevealScreen';
import { LessonTapEndingsScreen } from './LessonTapEndingsScreen';
import { LessonReflectStepScreen } from './LessonReflectStepScreen';
import { LessonWhyNahwScreen } from './LessonWhyNahwScreen';
import { lessonCompletionKey } from '../lib/growthPoints';
import { getLessonSteps } from '../lib/loadUnits';
import { stopLessonSentenceAudio } from '../lib/lessonSentenceAudio';
import {
  isEndingsRevealStep,
  isLessonCompleteStep,
  isReflectStep,
  isSentenceCompareStep,
  isTapEndingsStep,
  isWhyNahwStep,
} from '../lib/lessonSteps';

export type LessonFlowScreenProps = {
  learningPath: LearningPathId;
  unitIndex: number;
  lessonIndex: number;
  lessonTitleEn: string;
  lessonTitleAr?: string;
  onExit: () => void;
  /** Called when the learner finishes; receives total seeds and a stable lesson id. */
  onComplete: (totalSeeds: number, lessonKey: string) => void;
  onExploreAyahLab?: () => void;
};

export function LessonFlowScreen({
  learningPath,
  unitIndex,
  lessonIndex,
  lessonTitleEn,
  lessonTitleAr,
  onExit,
  onComplete,
  onExploreAyahLab,
}: LessonFlowScreenProps) {
  const steps = useMemo(() => getLessonSteps(learningPath, unitIndex, lessonIndex), [learningPath, unitIndex, lessonIndex]);
  const lessonKey = useMemo(
    () => lessonCompletionKey(learningPath, unitIndex, lessonIndex),
    [learningPath, unitIndex, lessonIndex],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [seedsEarned, setSeedsEarned] = useState(0);
  const finishedRef = useRef(false);

  const step = steps[stepIndex];

  const finishLesson = useCallback(
    (total: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onComplete(total, lessonKey);
    },
    [lessonKey, onComplete],
  );

  const advance = useCallback(
    (seedsDelta: number) => {
      stopLessonSentenceAudio();
      setSeedsEarned((n) => n + seedsDelta);
      if (stepIndex >= steps.length - 1) {
        finishLesson(seedsEarned + seedsDelta);
        return;
      }
      setStepIndex((i) => i + 1);
    },
    [stepIndex, steps.length, finishLesson, seedsEarned],
  );

  const handleReviewLesson = useCallback(() => {
    stopLessonSentenceAudio();
    finishedRef.current = false;
    setStepIndex(0);
    setSeedsEarned(0);
  }, []);

  const handleExit = useCallback(() => {
    stopLessonSentenceAudio();
    onExit();
  }, [onExit]);

  if (!steps.length) {
    return (
      <ExampleLessonFlowScreen
        learningPath={learningPath}
        lessonTitleEn={lessonTitleEn}
        lessonTitleAr={lessonTitleAr}
        onExit={handleExit}
        onComplete={finishLesson}
      />
    );
  }

  if (step && isSentenceCompareStep(step)) {
    return (
      <LessonCompareStepScreen
        learningPath={learningPath}
        step={step}
        seedsEarned={seedsEarned}
        onExit={handleExit}
        onContinue={advance}
      />
    );
  }

  if (step && isEndingsRevealStep(step)) {
    return (
      <LessonEndingsRevealScreen
        learningPath={learningPath}
        step={step}
        seedsEarned={seedsEarned}
        onExit={handleExit}
        onContinue={advance}
      />
    );
  }

  if (step && isTapEndingsStep(step)) {
    return (
      <LessonTapEndingsScreen
        learningPath={learningPath}
        step={step}
        seedsEarned={seedsEarned}
        onExit={handleExit}
        onContinue={advance}
      />
    );
  }

  if (step && isWhyNahwStep(step)) {
    return (
      <LessonWhyNahwScreen
        learningPath={learningPath}
        step={step}
        seedsEarned={seedsEarned}
        onExit={handleExit}
        onContinue={advance}
      />
    );
  }

  if (step && isReflectStep(step)) {
    return (
      <LessonReflectStepScreen
        learningPath={learningPath}
        step={step}
        seedsEarned={seedsEarned}
        onExit={handleExit}
        onContinue={advance}
      />
    );
  }

  if (step && isLessonCompleteStep(step)) {
    const totalSeeds = step.rewards.totalSeeds ?? seedsEarned;
    return (
      <LessonCompleteScreen
        learningPath={learningPath}
        step={step}
        seedsEarned={seedsEarned}
        onContinueLearning={() => finishLesson(totalSeeds)}
        onReviewLesson={handleReviewLesson}
        onExploreAyahLab={() => onExploreAyahLab?.()}
      />
    );
  }

  return <View />;
}
