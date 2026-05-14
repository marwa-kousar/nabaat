import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChooseDailyGoalScreen } from './components/ChooseDailyGoalScreen';
import { ChooseGoalScreen } from './components/ChooseGoalScreen';
import { ChoosePathScreen, type LearningPathId } from './components/ChoosePathScreen';
import { ExampleLessonFlowScreen } from './components/ExampleLessonFlowScreen';
import { HomeScreen } from './components/HomeScreen';
import { LessonIntroScreen } from './components/LessonIntroScreen';
import { ReminderScreen } from './components/ReminderScreen';
import { SplashLayout } from './components/SplashLayout';
import { StartScreen } from './components/StartScreen';
import { getLessonAtIndices } from './lib/loadUnits';

SplashScreen.preventAutoHideAsync().catch(() => {});

type AppScreen =
  | 'splash'
  | 'start'
  | 'choosePath'
  | 'chooseGoal'
  | 'chooseDailyGoal'
  | 'reminder'
  | 'home'
  | 'lessonIntro'
  | 'lessonFlow';

export default function App() {
  const didHideSplash = useRef(false);
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [selectedLearningPath, setSelectedLearningPath] = useState<LearningPathId>('nahw');
  const [lessonFocus, setLessonFocus] = useState({ unitIndex: 0, lessonIndex: 0 });
  const startOpacity = useRef(new Animated.Value(0)).current;
  const chooseOpacity = useRef(new Animated.Value(0)).current;
  const goalOpacity = useRef(new Animated.Value(0)).current;
  const dailyGoalOpacity = useRef(new Animated.Value(0)).current;
  const reminderOpacity = useRef(new Animated.Value(0)).current;
  const homeOpacity = useRef(new Animated.Value(0)).current;
  const lessonOpacity = useRef(new Animated.Value(0)).current;
  const lessonFlowOpacity = useRef(new Animated.Value(0)).current;

  const onRootLayout = useCallback(() => {
    if (didHideSplash.current) return;
    didHideSplash.current = true;
    void SplashScreen.hideAsync();
  }, []);

  const handleSplashDone = useCallback(() => {
    setScreen('start');
    Animated.timing(startOpacity, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
  }, [startOpacity]);

  const goToChoosePath = useCallback(() => {
    chooseOpacity.setValue(0);
    setScreen('choosePath');
    Animated.timing(chooseOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [chooseOpacity]);

  const goToChooseGoal = useCallback((path: LearningPathId) => {
    setSelectedLearningPath(path);
    goalOpacity.setValue(0);
    setScreen('chooseGoal');
    Animated.timing(goalOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [goalOpacity]);

  const goToChooseDailyGoal = useCallback(() => {
    dailyGoalOpacity.setValue(0);
    setScreen('chooseDailyGoal');
    Animated.timing(dailyGoalOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [dailyGoalOpacity]);

  const goToReminder = useCallback(() => {
    reminderOpacity.setValue(0);
    setScreen('reminder');
    Animated.timing(reminderOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [reminderOpacity]);

  const goToHome = useCallback(() => {
    homeOpacity.setValue(0);
    setScreen('home');
    Animated.timing(homeOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [homeOpacity]);

  const goToLessonFlow = useCallback(() => {
    lessonFlowOpacity.setValue(0);
    setScreen('lessonFlow');
    Animated.timing(lessonFlowOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [lessonFlowOpacity]);

  const goBackToLessonIntro = useCallback(() => {
    lessonOpacity.setValue(0);
    setScreen('lessonIntro');
    Animated.timing(lessonOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [lessonOpacity]);

  const goToLessonIntro = useCallback(
    (focus?: { unitIndex: number; lessonIndex: number }) => {
      if (focus) {
        setLessonFocus({ unitIndex: focus.unitIndex, lessonIndex: focus.lessonIndex });
      }
      lessonOpacity.setValue(0);
      setScreen('lessonIntro');
      Animated.timing(lessonOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    },
    [lessonOpacity],
  );

  const lessonFlowTitles = useMemo(() => {
    const hit = getLessonAtIndices(selectedLearningPath, lessonFocus.unitIndex, lessonFocus.lessonIndex);
    if (!hit?.lesson) return { titleEn: 'Lesson', titleAr: undefined as string | undefined };
    return { titleEn: hit.lesson.title, titleAr: hit.lesson.titleAr };
  }, [selectedLearningPath, lessonFocus.unitIndex, lessonFocus.lessonIndex]);

  const rootBg =
    screen === 'splash'
      ? '#e97714'
      : screen === 'start'
        ? '#dffaf6'
        : screen === 'chooseGoal'
          ? '#eefffc'
          : screen === 'chooseDailyGoal'
            ? '#fdf3e0'
            : screen === 'reminder'
              ? '#f1f4cb'
              : screen === 'home'
                ? '#fef9f5'
                : screen === 'lessonIntro' || screen === 'lessonFlow'
                  ? '#fff8e8'
                  : '#fff8e8';

  return (
    <SafeAreaProvider>
      <View style={[styles.root, { backgroundColor: rootBg }]} onLayout={onRootLayout}>
        {screen === 'splash' && <SplashLayout onAnimationComplete={handleSplashDone} />}
        {screen === 'start' && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: startOpacity }]}>
            <StartScreen onBismillah={goToChoosePath} />
          </Animated.View>
        )}
        {screen === 'choosePath' && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: chooseOpacity }]}>
            <ChoosePathScreen onContinue={goToChooseGoal} />
          </Animated.View>
        )}
        {screen === 'chooseGoal' && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: goalOpacity }]}>
            <ChooseGoalScreen
              onContinue={goToChooseDailyGoal}
              onSkip={goToChooseDailyGoal}
            />
          </Animated.View>
        )}
        {screen === 'chooseDailyGoal' && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: dailyGoalOpacity }]}>
            <ChooseDailyGoalScreen
              onContinue={goToReminder}
              onSkipForNow={goToReminder}
            />
          </Animated.View>
        )}
        {screen === 'reminder' && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: reminderOpacity }]}>
            <ReminderScreen onEnableNotifications={goToHome} onMaybeLater={goToHome} />
          </Animated.View>
        )}
        {screen === 'home' && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: homeOpacity }]}>
            <HomeScreen
              initialPath={selectedLearningPath}
              onActivePathChange={setSelectedLearningPath}
              isNewUser
              onBeginLesson={goToLessonIntro}
            />
          </Animated.View>
        )}
        {screen === 'lessonIntro' && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: lessonOpacity }]}>
            <LessonIntroScreen
              learningPath={selectedLearningPath}
              unitIndex={lessonFocus.unitIndex}
              lessonIndex={lessonFocus.lessonIndex}
              isNewUser
              onBack={goToHome}
              onBegin={goToLessonFlow}
            />
          </Animated.View>
        )}
        {screen === 'lessonFlow' && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: lessonFlowOpacity }]}>
            <ExampleLessonFlowScreen
              learningPath={selectedLearningPath}
              lessonTitleEn={lessonFlowTitles.titleEn}
              lessonTitleAr={lessonFlowTitles.titleAr}
              onExit={goBackToLessonIntro}
              onComplete={goToHome}
            />
          </Animated.View>
        )}
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
