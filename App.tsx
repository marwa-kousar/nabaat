import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChooseDailyGoalScreen } from './components/ChooseDailyGoalScreen';
import { ChooseGoalScreen } from './components/ChooseGoalScreen';
import { ChoosePathScreen, type LearningPathId } from './components/ChoosePathScreen';
import { LessonFlowScreen } from './components/LessonFlowScreen';
import { HomeScreen, type HomeTabKey } from './components/HomeScreen';
import { LessonIntroScreen } from './components/LessonIntroScreen';
import { ReminderScreen } from './components/ReminderScreen';
import { SplashLayout } from './components/SplashLayout';
import { StartScreen } from './components/StartScreen';
import { getLessonAtIndices } from './lib/loadUnits';
import { awardLessonSeedsFirstTime, initializeGrowthPoints } from './lib/growthPoints';
import { ensureAppImagesPreloaded } from './lib/preloadAppImages';

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
  const [homeInitialTab, setHomeInitialTab] = useState<HomeTabKey>('home');
  const [growthPoints, setGrowthPoints] = useState(0);
  const [growthPointsReady, setGrowthPointsReady] = useState(false);
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
    void ensureAppImagesPreloaded();
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

  const goToHome = useCallback(
    (tab: HomeTabKey = 'home') => {
      const nextTab: HomeTabKey =
        tab === 'home' || tab === 'bolt' || tab === 'seed' || tab === 'chat' || tab === 'user' ? tab : 'home';
      setHomeInitialTab(nextTab);
      homeOpacity.setValue(0);
      setScreen('home');
      Animated.timing(homeOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    },
    [homeOpacity],
  );

  const goToHomeFromLesson = useCallback(
    (lessonSeeds: number, lessonKey: string) => {
      void awardLessonSeedsFirstTime(lessonKey, lessonSeeds).then(({ total }) => setGrowthPoints(total));
      goToHome('home');
    },
    [goToHome],
  );

  useEffect(() => {
    void initializeGrowthPoints().then((total) => {
      setGrowthPoints(total);
      setGrowthPointsReady(true);
    });
  }, []);

  const goToAyahLabFromLesson = useCallback(() => {
    goToHome('seed');
  }, [goToHome]);

  const goToLessonFlow = useCallback(() => {
    lessonFlowOpacity.setValue(0);
    setScreen('lessonFlow');
    Animated.timing(lessonFlowOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [lessonFlowOpacity]);

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
                : screen === 'lessonFlow'
                  ? '#dcfff9'
                  : screen === 'lessonIntro'
                    ? '#fff8e8'
                    : '#fff8e8';

  const inner = (
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
            <ReminderScreen
              onEnableNotifications={() => goToHome('home')}
              onMaybeLater={() => goToHome('home')}
            />
          </Animated.View>
        )}
        {screen === 'home' && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: homeOpacity }]}>
            <HomeScreen
              initialPath={selectedLearningPath}
              onActivePathChange={setSelectedLearningPath}
              isNewUser
              growthPoints={growthPointsReady ? growthPoints : 0}
              initialTab={homeInitialTab}
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
              onBack={() => goToHome('home')}
              onBegin={goToLessonFlow}
            />
          </Animated.View>
        )}
        {screen === 'lessonFlow' && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: lessonFlowOpacity }]}>
            <LessonFlowScreen
              learningPath={selectedLearningPath}
              unitIndex={lessonFocus.unitIndex}
              lessonIndex={lessonFocus.lessonIndex}
              lessonTitleEn={lessonFlowTitles.titleEn}
              lessonTitleAr={lessonFlowTitles.titleAr}
              onExit={() => goToHome('home')}
              onComplete={goToHomeFromLesson}
              onExploreAyahLab={goToAyahLabFromLesson}
            />
          </Animated.View>
        )}
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );

  if (Platform.OS !== 'web') return inner;

  return (
    <View style={styles.webOuter}>
      <View style={styles.webFrame}>{inner}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  webOuter: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  webFrame: {
    width: 393,
    flex: 1,
    overflow: 'hidden',
  },
});
