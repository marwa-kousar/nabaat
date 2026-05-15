import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  useFonts as useFredoka,
} from '@expo-google-fonts/fredoka';
import {
  NotoSansArabic_500Medium,
  NotoSansArabic_700Bold,
  useFonts as useNotoArabic,
} from '@expo-google-fonts/noto-sans-arabic';
import { Nunito_700Bold, Nunito_800ExtraBold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeDotActive from '../assets/home-dot-active.svg';
import HomeDotInactive from '../assets/home-dot-inactive.svg';
import HomeLeaf from '../assets/home-leaf.svg';
import HomeLeafIntermediate from '../assets/home-leaf-intermediate.svg';
import HomeLock from '../assets/home-lock.svg';
import HomePointsLeaf from '../assets/home-points-leaf.svg';
import HomeStreakFlame from '../assets/home-streak-flame.svg';
import HomeTakrarrPlant from '../assets/home-takrarr-plant.svg';
import { getUnitsMeta, loadUnitsForPath, type UnitJson } from '../lib/loadUnits';
import { lessonFlowCtaA11yLabel, lessonFlowCtaLabel } from '../lib/lessonCopy';
import { pathThemeOf } from '../lib/pathTheme';

import { LearningPathId, PATH_OPTIONS } from './ChoosePathScreen';
import {
  TabBoltIcon,
  TabChatIcon,
  TabHomeIcon,
  TabSeedlingIcon,
  TabUserIcon,
  type TabBarIconProps,
} from './homeTabBarIcons';
import { AyahLabScreen } from './AyahLabScreen';
import { PathSwatchLetter } from './PathSwatchLetter';

const FIGMA_W = 393;
const HEADER_LETTER_SCALE = 0.55;

function r(n: number, s: number) {
  return Math.round(n * s);
}

const textPad = Platform.select({ android: { includeFontPadding: false as const }, default: {} });

export type UserResumeSnapshot = {
  unitIndex: number;
  lessonIndex: number;
  progressPercent: number;
};

type TabKey = 'home' | 'bolt' | 'seed' | 'chat' | 'user';

export type HomeScreenProps = {
  /** Path chosen during onboarding; home can switch locally without mutating this. */
  initialPath?: LearningPathId;
  /** Called when the user picks a different path from the home header (keeps app state in sync). */
  onActivePathChange?: (path: LearningPathId) => void;
  /** First open vs returning — drives resume CTA, zeros stats when true. */
  isNewUser?: boolean;
  /** Current-lesson snapshot from Firestore (ignored for `progressPercent` when `isNewUser`). */
  userResume?: UserResumeSnapshot;
  /** Learning-day streak; omit to use 0 for new users, demo values when returning. */
  streakCount?: number;
  /** Nabaat / growth points from profile; omit for same rule as streak. */
  growthPoints?: number;
  /** Opens lesson intro; passes the same unit/lesson indices as the resume card. */
  onBeginLesson?: (focus: { unitIndex: number; lessonIndex: number }) => void;
};

const DEFAULT_RESUME: UserResumeSnapshot = {
  unitIndex: 0,
  lessonIndex: 0,
  progressPercent: 0,
};

function resolveResume(units: UnitJson[], snap: UserResumeSnapshot) {
  const unit = units[snap.unitIndex] ?? units[0];
  const lesson = unit?.lessons?.[snap.lessonIndex] ?? unit?.lessons?.[0];
  const pct = Math.max(0, Math.min(100, snap.progressPercent));
  return { unit, lesson, pct };
}

export function HomeScreen({
  initialPath = 'nahw',
  onActivePathChange,
  isNewUser = true,
  userResume,
  streakCount,
  growthPoints,
  onBeginLesson,
}: HomeScreenProps) {
  const { width: W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const s = W / FIGMA_W;
  const [activePath, setActivePath] = useState<LearningPathId>(initialPath);
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [expandedUnit, setExpandedUnit] = useState<string | null>('0');
  /** When false, path card lists only the first unit; "View all units" reveals the rest. */
  const [showFullUnitList, setShowFullUnitList] = useState(false);
  const [units, setUnits] = useState<UnitJson[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(true);

  const [fredokaLoaded] = useFredoka({ Fredoka_500Medium, Fredoka_600SemiBold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_500Medium, NotoSansArabic_700Bold });

  const theme = useMemo(() => pathThemeOf(activePath), [activePath]);
  const pathMeta = useMemo(() => getUnitsMeta(activePath), [activePath]);
  const pathOption = useMemo(() => PATH_OPTIONS.find((p) => p.id === activePath), [activePath]);
  const resumeSnapshot = useMemo((): UserResumeSnapshot => {
    if (isNewUser) {
      return { unitIndex: 0, lessonIndex: 0, progressPercent: 0 };
    }
    return {
      unitIndex: userResume?.unitIndex ?? DEFAULT_RESUME.unitIndex,
      lessonIndex: userResume?.lessonIndex ?? DEFAULT_RESUME.lessonIndex,
      progressPercent: userResume?.progressPercent ?? 30,
    };
  }, [isNewUser, userResume]);

  const displayStreak = streakCount ?? (isNewUser ? 0 : 3);
  const displayGrowthPoints = growthPoints ?? (isNewUser ? 0 : 126);

  const visibleUnits = useMemo(
    () => (showFullUnitList ? units : units.slice(0, 1)),
    [showFullUnitList, units],
  );
  const hasMultipleUnits = units.length > 1;

  useEffect(() => {
    setActivePath(initialPath);
  }, [initialPath]);

  useEffect(() => {
    let cancelled = false;
    setUnitsLoading(true);
    void loadUnitsForPath(activePath)
      .then((list) => {
        if (cancelled) return;
        setUnits(list);
        setExpandedUnit(list[0]?.num ?? null);
        setShowFullUnitList(false);
        setUnitsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setUnits([]);
        setShowFullUnitList(false);
        setUnitsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activePath]);

  const onPathChanged = useCallback(
    (next: LearningPathId) => {
      setActivePath(next);
      setPathModalOpen(false);
      setShowFullUnitList(false);
      onActivePathChange?.(next);
    },
    [onActivePathChange],
  );

  const toggleViewAllUnits = useCallback(() => {
    if (showFullUnitList) {
      setShowFullUnitList(false);
      setExpandedUnit(units[0]?.num ?? null);
    } else {
      setShowFullUnitList(true);
    }
  }, [showFullUnitList, units]);

  const tabBarH = r(61, s);
  const tabBarBottom = Math.max(r(16, s), insets.bottom);
  const scrollBottomPad = tabBarBottom + tabBarH + r(24, s);

  const cardShadow: ViewStyle =
    Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
      default: {},
    }) ?? {};

  const { unit: resumeUnit, lesson: resumeLesson, pct: resumePct } = resolveResume(units, resumeSnapshot);
  const resumeCta = lessonFlowCtaLabel(isNewUser);
  const resumeA11y = lessonFlowCtaA11yLabel(isNewUser);

  const letterBox = r(40, s);
  const letterIconSize = letterBox * HEADER_LETTER_SCALE;

  if (!fredokaLoaded || !nunitoLoaded || !notoArLoaded) {
    return <View style={styles.root} />;
  }

  const hidePathwayHeader = activeTab === 'seed' || activeTab === 'user';

  return (
    <View style={styles.root}>
      {unitsLoading && activeTab === 'home' && (
        <View style={[styles.loadingOverlay, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={theme.primary} accessibilityLabel="Loading units" />
        </View>
      )}

      {!hidePathwayHeader ? (
        <View
          style={[
            styles.stickyTopBar,
            {
              paddingTop: insets.top,
            },
          ]}
        >
          <View style={[styles.header, { paddingHorizontal: r(22, s), paddingTop: r(10, s), paddingBottom: r(8, s) }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Active path: ${theme.titleEn}. Tap to switch course`}
              style={styles.headerLeft}
              onPress={() => setPathModalOpen(true)}
            >
              <View
                style={[
                  styles.nunBox,
                  { width: letterBox, height: letterBox, borderRadius: r(13, s), backgroundColor: theme.swatchBg },
                ]}
              >
                <PathSwatchLetter
                  letterIcon={pathOption?.letterIcon}
                  letter={pathOption?.letter}
                  width={letterIconSize}
                  height={letterIconSize}
                />
              </View>
              <Text
                style={[styles.pathTitle, { fontSize: r(24, s), lineHeight: r(28, s), marginLeft: r(10, s), color: theme.headerText }]}
              >
                {theme.titleEn}
              </Text>
              <Text style={[styles.chevronPath, { fontSize: r(18, s), marginLeft: r(2, s), color: theme.headerText }]}>⌄</Text>
            </Pressable>

            <View style={styles.headerRight}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Current streak, ${displayStreak} days`}
                style={[styles.statPill, { gap: r(4, s) }]}
              >
                <HomeStreakFlame width={r(20, s)} height={r(20, s)} />
                <Text style={[styles.streakNum, { fontSize: r(16, s) }]}>{displayStreak}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Nabaat points, ${displayGrowthPoints}`}
                style={[styles.statPill, { gap: r(4, s) }]}
              >
                <HomePointsLeaf width={r(20, s)} height={r(20, s)} />
                <Text style={[styles.pointsNum, { fontSize: r(16, s) }]}>{displayGrowthPoints}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.mainPane}>
        {activeTab === 'home' ? (
          <ScrollView
            style={styles.scrollMain}
            contentContainerStyle={{ paddingBottom: scrollBottomPad, opacity: unitsLoading ? 0.35 : 1 }}
            showsVerticalScrollIndicator={false}
            bounces
          >
        {/* ── Hero / Welcome section ── */}
        <View style={{ height: r(190, s), overflow: 'hidden', position: 'relative' }}>
          <Image
            source={require('../assets/home-hero-desert.png')}
            style={{ position: 'absolute', left: r(-5, s), top: 0, width: r(530, s), height: r(238, s) }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={{ position: 'absolute', left: r(22, s), top: r(16, s), width: r(215, s) }}>
            <Text style={[styles.greeting, { fontSize: r(16, s), lineHeight: r(22, s) }]}>
              Assalamu &apos;Alaykum, Marwa!
            </Text>
            <Text style={[styles.greetingSub, { fontSize: r(12, s), lineHeight: r(18, s), marginTop: r(4, s) }]}>
              Your journey begins today
            </Text>
          </View>
          <View style={{ position: 'absolute', right: r(18, s), top: r(8, s), width: r(97, s), height: r(132, s), overflow: 'hidden' }}>
            <Image
              source={require('../assets/home-nabta-hero.png')}
              style={{
                position: 'absolute',
                width: r(151, s),
                height: r(227, s),
                left: r(-27, s),
                top: r(-40, s),
              }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          </View>
        </View>

        {/* ── Resume Learning card ── */}
        <View
          style={[
            styles.card,
            { marginHorizontal: r(22, s), borderRadius: r(21, s), padding: r(20, s), marginTop: r(4, s), ...cardShadow },
          ]}
        >
          <Text style={[styles.continueLabel, { fontSize: r(12, s), marginBottom: r(4, s), color: theme.continueLabel }]}>
            Continue learning
          </Text>
          <Text style={[styles.unitMeta, { fontSize: r(13, s), marginBottom: r(6, s) }]}>
            {resumeUnit ? `Unit ${resumeUnit.num} · Lesson ${resumeLesson?.num ?? 1}` : '—'}
          </Text>
          <Text
            style={[
              styles.lessonTitleEn,
              { fontSize: r(20, s), lineHeight: r(26, s) },
              !resumeLesson?.titleAr ? { marginBottom: r(10, s) } : null,
            ]}
          >
            {resumeLesson?.title ?? 'Loading…'}
          </Text>
          {!!resumeLesson?.titleAr && (
            <Text
              style={[
                styles.lessonTitleAr,
                { fontSize: r(18, s), lineHeight: r(-1, s), marginBottom: r(10, s), color: theme.lessonTitleAr },
              ]}
            >
              {resumeLesson.titleAr}
            </Text>
          )}

          <Text style={[styles.progressLabel, { fontSize: r(11, s), marginBottom: r(6, s) }]}>
            {resumePct}% complete
          </Text>
          <View
            style={[styles.progressTrack, { height: r(11, s), borderRadius: r(20, s), marginBottom: r(14, s), backgroundColor: theme.progressTrack }]}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: resumePct }}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${resumePct}%`, borderRadius: r(20, s), backgroundColor: theme.primary },
              ]}
            />
            {resumePct > 0 ? (
              <View
                style={[
                  styles.progressSheen,
                  {
                    width: '22%',
                    height: r(2, s),
                    top: r(2, s),
                    left: r(2, s),
                    borderRadius: r(3, s),
                    backgroundColor: theme.progressSheen,
                  },
                ]}
              />
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={resumeA11y}
            onPress={() =>
              onBeginLesson?.({ unitIndex: resumeSnapshot.unitIndex, lessonIndex: resumeSnapshot.lessonIndex })
            }
            style={({ pressed }) => [
              styles.resumeBtn,
              {
                borderRadius: r(9, s),
                backgroundColor: theme.primary,
                borderColor: theme.primaryDark,
                transform: [{ scale: pressed ? 0.97 : 1 }, { translateY: pressed ? 2 : 0 }],
                shadowOffset: { width: 0, height: pressed ? 0 : 2 },
                shadowOpacity: pressed ? 0 : 1,
              },
            ]}
          >
            <Text style={[styles.resumeBtnText, { fontSize: r(14, s) }]}>{resumeCta}</Text>
          </Pressable>
        </View>

        {/* ── Learning path section ── */}
        <View style={[styles.sectionHeader, { marginHorizontal: r(22, s), marginTop: r(22, s), marginBottom: r(10, s) }]}>
          <Text style={[styles.sectionTitle, { fontSize: r(14, s) }]}>Your learning path</Text>
          <Text style={[styles.completeLabel, { fontSize: r(10, s), color: theme.primaryDark }]}>
            {pathMeta.completed}/{pathMeta.total} Complete
          </Text>
        </View>

        <View style={[styles.pathCard, { marginHorizontal: r(22, s), borderRadius: r(15, s), ...cardShadow }]}>
          {visibleUnits.map((u, i) => {
            const LeafIcon = u.leafIntermediate ? HomeLeafIntermediate : HomeLeaf;
            const isLast = i === visibleUnits.length - 1;
            const isOpen = expandedUnit === u.num;

            return (
              <View key={`${activePath}-${u.num}`}>
                <Pressable
                  disabled={u.locked}
                  onPress={() => {
                    if (u.locked) return;
                    setExpandedUnit(isOpen ? null : u.num);
                  }}
                  style={({ pressed }) => ({ opacity: pressed && !u.locked ? 0.75 : 1 })}
                  accessibilityRole="button"
                  accessibilityLabel={`${u.titleEn}, ${u.locked ? 'locked' : isOpen ? 'collapse' : 'expand'}`}
                >
                  <View style={[styles.unitRow, { paddingHorizontal: r(14, s), paddingTop: r(14, s), paddingBottom: r(10, s) }]}>
                    <View style={[styles.connectorCol, { width: r(44, s), marginRight: r(12, s) }]}>
                      <View
                        style={[
                          styles.unitNumBox,
                          { width: r(40, s), height: r(40, s), borderRadius: r(u.iconRadius, s), backgroundColor: u.iconBg },
                        ]}
                      >
                        <Text style={[styles.unitNum, { fontSize: r(20, s), color: u.numColor, ...textPad }]}>{u.num}</Text>
                      </View>
                    </View>

                    <View style={styles.unitContent}>
                      <Text style={[styles.unitTitleEn, { fontSize: r(15, s), lineHeight: r(20, s) }]}>{u.titleEn}</Text>
                      <Text style={[styles.unitTitleAr, { fontSize: r(13, s), lineHeight: r(20, s), color: u.arabicColor }]}>
                        {u.titleAr}
                      </Text>
                      <View style={styles.unitMeta2}>
                        <Text style={[styles.unitLessons, { fontSize: r(12, s) }]}>{u.lessons.length} lessons</Text>
                        <LeafIcon width={r(11, s)} height={r(11, s)} style={{ marginLeft: r(4, s) }} />
                        <Text style={[styles.bullet, { fontSize: r(12, s) }]}> · </Text>
                        <Text style={[styles.unitTag, { fontSize: r(12, s), color: u.tagColor }]}>{u.tag}</Text>
                      </View>
                    </View>

                    <View style={[styles.unitRight, { width: r(28, s) }]}>
                      {u.locked ? (
                        <HomeLock width={r(22, s)} height={r(22, s)} />
                      ) : (
                        <Text
                          style={[styles.chevronPath, { fontSize: r(20, s), color: theme.headerText, transform: [{ rotate: isOpen ? '-90deg' : '90deg' }] }]}
                        >
                          ›
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>

                {isOpen && (
                  <View style={[styles.lessonList, { paddingHorizontal: r(14, s), paddingBottom: r(12, s) }]}>
                    {u.lessons.map((lesson) => (
                      <Pressable
                        key={lesson.num}
                        accessibilityRole="button"
                        accessibilityLabel={
                          lesson.titleAr
                            ? `Lesson ${lesson.num}: ${lesson.title}. ${lesson.titleAr}`
                            : `Lesson ${lesson.num}: ${lesson.title}`
                        }
                        style={({ pressed }) => [
                          styles.lessonRow,
                          { opacity: pressed ? 0.7 : 1, paddingVertical: r(10, s), marginLeft: r(56, s) },
                        ]}
                      >
                        <View style={{ paddingTop: r(4, s) }}>
                          <View
                            style={[
                              styles.lessonDot,
                              { width: r(8, s), height: r(8, s), borderRadius: r(4, s), backgroundColor: theme.primary },
                            ]}
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: r(10, s) }}>
                          <Text style={[styles.lessonNum, { fontSize: r(11, s) }]}>Lesson {lesson.num}</Text>
                          <Text style={[styles.lessonTitle, { fontSize: r(13, s) }]}>{lesson.title}</Text>
                          {lesson.titleAr ? (
                            <Text
                              style={[
                                styles.lessonTitleArRow,
                                {
                                  fontSize: r(12, s),
                                  lineHeight: r(18, s),
                                  marginTop: r(2, s),
                                  color: theme.lessonTitleAr,
                                  ...textPad,
                                },
                              ]}
                            >
                              {lesson.titleAr}
                            </Text>
                          ) : null}
                        </View>
                        <Text
                          style={[
                            styles.chevronPath,
                            { fontSize: r(16, s), color: theme.headerText, alignSelf: 'center' },
                          ]}
                        >
                          ›
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {!isLast && (
                  <View style={[styles.connector, { paddingHorizontal: r(14, s) }]}>
                    <View style={[styles.connectorLeft, { width: r(44, s), marginRight: r(12, s) }]}>
                      <View style={{ width: r(44, s), alignItems: 'center' }}>
                        {u.active ? (
                          <HomeDotActive width={r(9, s)} height={r(9, s)} />
                        ) : (
                          <HomeDotInactive width={r(9, s)} height={r(9, s)} />
                        )}
                      </View>
                    </View>
                    <View style={styles.divider} />
                  </View>
                )}
              </View>
            );
          })}

          {hasMultipleUnits ? (
            <View style={[styles.viewAllRow, { paddingVertical: r(14, s) }]}>
              <View style={[styles.dividerFull, { marginBottom: r(14, s) }]} />
              <Pressable
                onPress={toggleViewAllUnits}
                accessibilityRole="button"
                accessibilityLabel={showFullUnitList ? 'Show fewer units' : 'View all units'}
                accessibilityState={{ expanded: showFullUnitList }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: r(4, s),
                })}
              >
                <Text style={[styles.viewAllText, { fontSize: r(12, s), color: theme.primaryDark }]}>
                  {showFullUnitList ? 'Show less' : 'View all units'}
                </Text>
                <Text
                  style={[
                    styles.chevronPath,
                    {
                      fontSize: r(16, s),
                      color: theme.primaryDark,
                      transform: [{ rotate: showFullUnitList ? '0deg' : '180deg' }],
                    },
                  ]}
                >
                  ⌄
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Takrār — daily reflection"
          style={({ pressed }) => [
            styles.takrarCard,
            { marginHorizontal: r(22, s), marginTop: r(16, s), borderRadius: r(15, s), padding: r(14, s), opacity: pressed ? 0.95 : 1, ...cardShadow },
          ]}
        >
          <View style={[styles.takrarIcon, { width: r(44, s), height: r(44, s) }]}>
            <HomeTakrarrPlant width={r(32, s)} height={r(32, s)} />
          </View>
          <View style={styles.takrarText}>
            <Text style={[styles.takrarTitle, { fontSize: r(14, s) }]}>Takrār</Text>
            <Text style={[styles.takrarSub, { fontSize: r(10, s), marginTop: r(2, s) }]}>Daily Reflection</Text>
            <Text style={[styles.takrarDesc, { fontSize: r(10, s) }]}>Review what you&apos;ve learned</Text>
          </View>
          <Text style={[styles.chevronGray, { fontSize: r(20, s) }]}>›</Text>
        </Pressable>

      </ScrollView>
        ) : activeTab === 'seed' ? (
          <AyahLabScreen
            variant="tab"
            learningPath={activePath}
            verseKey="2:183"
            tabBarBottomInset={scrollBottomPad}
            todaysConnection={{
              lessonTitle: resumeLesson?.title ?? 'Your learning path',
              unitLabel: resumeUnit ? `Unit ${resumeUnit.num}` : undefined,
              ayahRef: 'Surah 2 · 183',
              onOpenLesson: () => {
                setActiveTab('home');
                onBeginLesson?.({
                  unitIndex: resumeSnapshot.unitIndex,
                  lessonIndex: resumeSnapshot.lessonIndex,
                });
              },
            }}
          />
        ) : (
          <View
            style={[
              styles.comingSoonPane,
              {
                paddingBottom: scrollBottomPad,
                paddingHorizontal: r(28, s),
                paddingTop: activeTab === 'user' ? insets.top + r(12, s) : 0,
              },
            ]}
          >
            <Text style={[styles.comingSoonTitle, { fontSize: r(18, s), color: theme.primaryDark }]}>Coming soon</Text>
            <Text style={[styles.comingSoonBody, { fontSize: r(14, s), lineHeight: r(21, s), marginTop: r(10, s), color: '#64748b' }]}>
              {activeTab === 'bolt'
                ? 'Practice drills and spaced review will live here.'
                : activeTab === 'chat'
                  ? 'Ask questions and get guidance in a calm chat space.'
                  : 'Profile, streaks, and goals will gather here.'}
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.tabBar,
          {
            bottom: tabBarBottom,
            right: r(17, s),
            width: r(359, s),
            height: tabBarH,
            borderRadius: r(74, s),
            pointerEvents: 'box-none',
          },
        ]}
      >
        {(
          [
            { key: 'home' as TabKey, label: 'Home', Icon: TabHomeIcon },
            { key: 'bolt' as TabKey, label: 'Practice', Icon: TabBoltIcon },
            { key: 'seed' as TabKey, label: 'Grow', Icon: TabSeedlingIcon },
            { key: 'chat' as TabKey, label: 'Chat', Icon: TabChatIcon },
            { key: 'user' as TabKey, label: 'Profile', Icon: TabUserIcon },
          ] as const satisfies ReadonlyArray<{ key: TabKey; label: string; Icon: ComponentType<TabBarIconProps> }>
        ).map((item) => {
          const isActive = activeTab === item.key;
          const iconSize = r(24, s);
          const TabIcon = item.Icon;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityLabel={item.key === 'seed' ? 'Grow — Ayah Lab' : item.label}
              accessibilityState={{ selected: isActive }}
              onPress={() => setActiveTab(item.key)}
              style={({ pressed }) => [
                styles.tabItem,
                {
                  flex: 1,
                  paddingVertical: r(10, s),
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <TabIcon size={iconSize} active={isActive} color={theme.primary} />
            </Pressable>
          );
        })}
      </View>

      <Modal
        visible={pathModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPathModalOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdropFill} onPress={() => setPathModalOpen(false)} />
          <View style={[styles.modalSheet, { marginHorizontal: r(22, s), borderRadius: r(16, s), padding: r(16, s) }]}>
            <Text style={[styles.modalTitle, { fontSize: r(16, s), marginBottom: r(12, s) }]}>Switch course</Text>
            {PATH_OPTIONS.map((opt) => {
              const selected = opt.id === activePath;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => onPathChanged(opt.id)}
                  style={({ pressed }) => [
                    styles.pathRow,
                    {
                      paddingVertical: r(12, s),
                      paddingHorizontal: r(12, s),
                      borderRadius: r(12, s),
                      backgroundColor: selected ? opt.selectedFill : pressed ? 'rgba(0,0,0,0.04)' : 'transparent',
                      marginBottom: r(6, s),
                    },
                  ]}
                >
                  <View style={[styles.pathRowSwatch, { backgroundColor: opt.swatch, width: r(36, s), height: r(36, s), borderRadius: r(10, s) }]} />
                  <View style={{ flex: 1, marginLeft: r(12, s) }}>
                    <Text style={[styles.pathRowTitle, { fontSize: r(16, s) }]}>{opt.titleEn}</Text>
                    <Text style={[styles.pathRowSub, { fontSize: r(11, s), marginTop: 2 }]}>{opt.subtitle}</Text>
                  </View>
                  {selected ? <Text style={{ fontFamily: 'Nunito_800ExtraBold', color: opt.swatch }}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fef9f5' },
  stickyTopBar: {
    backgroundColor: '#fef9f5',
    zIndex: 10,
    ...Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  scrollMain: { flex: 1 },
  mainPane: { flex: 1 },
  comingSoonPane: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  comingSoonTitle: { fontFamily: 'Fredoka_600SemiBold', textAlign: 'center' },
  comingSoonBody: { fontFamily: 'Nunito_700Bold', textAlign: 'center', maxWidth: 320 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(254,249,245,0.65)',
    zIndex: 20,
  },

  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef9f5' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nunBox: { alignItems: 'center', justifyContent: 'center' },
  pathTitle: { fontFamily: 'Fredoka_600SemiBold' },
  chevronPath: { fontFamily: 'Nunito_700Bold' },
  chevronGray: { fontFamily: 'Nunito_700Bold', color: '#a4a4a4' },
  statPill: { flexDirection: 'row', alignItems: 'center' },
  streakNum: { fontFamily: 'Fredoka_600SemiBold', color: '#cd680b' },
  pointsNum: { fontFamily: 'Fredoka_600SemiBold', color: '#578140' },

  greeting: { fontFamily: 'Fredoka_600SemiBold', color: '#000', letterSpacing: 0.5 },
  greetingSub: { fontFamily: 'Nunito_700Bold', color: '#000', letterSpacing: 0.5 },

  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  continueLabel: { fontFamily: 'Nunito_700Bold' },
  unitMeta: { fontFamily: 'Nunito_700Bold', color: '#737373' },
  lessonTitleEn: { fontFamily: 'Nunito_800ExtraBold', color: '#000', marginBottom: 4 },
  lessonTitleAr: { fontFamily: 'NotoSansArabic_700Bold' },
  progressLabel: { fontFamily: 'Nunito_700Bold', color: '#737373', letterSpacing: 0.8 },
  progressTrack: { overflow: 'hidden', position: 'relative' },
  progressFill: { position: 'absolute', top: 0, left: 0, bottom: 0 },
  progressSheen: { position: 'absolute' },
  resumeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    shadowColor: '#104e53',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  resumeBtnText: { fontFamily: 'Nunito_800ExtraBold', color: '#fff' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: 'Nunito_700Bold', color: '#000' },
  completeLabel: { fontFamily: 'Nunito_700Bold', letterSpacing: 0.5 },

  pathCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', overflow: 'hidden' },
  unitRow: { flexDirection: 'row', alignItems: 'center' },
  connectorCol: { alignItems: 'center' },
  connectorLeft: { alignItems: 'center' },
  unitNumBox: { alignItems: 'center', justifyContent: 'center' },
  unitNum: { fontFamily: 'Nunito_800ExtraBold', textAlign: 'center' },
  unitContent: { flex: 1 },
  unitTitleEn: { fontFamily: 'Fredoka_500Medium', color: '#000', marginBottom: 2 },
  unitTitleAr: { fontFamily: 'NotoSansArabic_500Medium', marginBottom: 4 },
  unitMeta2: { flexDirection: 'row', alignItems: 'center' },
  unitLessons: { fontFamily: 'Fredoka_500Medium', color: '#737373' },
  bullet: { color: '#737373' },
  unitTag: { fontFamily: 'Fredoka_500Medium' },
  unitRight: { alignItems: 'center', justifyContent: 'center' },

  lessonList: { backgroundColor: '#f9fffe' },
  lessonRow: { flexDirection: 'row', alignItems: 'flex-start' },
  lessonDot: {},
  lessonNum: { fontFamily: 'Nunito_700Bold', color: '#737373' },
  lessonTitle: { fontFamily: 'Nunito_700Bold', color: '#000' },
  lessonTitleArRow: { fontFamily: 'NotoSansArabic_500Medium' },

  connector: { flexDirection: 'row', alignItems: 'center', paddingBottom: 4 },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  dividerFull: { height: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginHorizontal: 14 },
  viewAllRow: { alignItems: 'center' },
  viewAllText: { fontFamily: 'Nunito_700Bold' },

  takrarCard: { backgroundColor: '#f5f4ec', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', flexDirection: 'row', alignItems: 'center' },
  takrarIcon: { alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  takrarText: { flex: 1 },
  takrarTitle: { fontFamily: 'Nunito_700Bold', color: '#000' },
  takrarSub: { fontFamily: 'Nunito_700Bold', color: '#737373' },
  takrarDesc: { fontFamily: 'Nunito_700Bold', color: '#737373' },

  tabBar: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center' },

  modalRoot: {
    flex: 1,
    justifyContent: 'center',
  },
  modalBackdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: { backgroundColor: '#fff', maxHeight: '70%', zIndex: 1 },
  modalTitle: { fontFamily: 'Fredoka_600SemiBold', color: '#000' },
  pathRow: { flexDirection: 'row', alignItems: 'center' },
  pathRowSwatch: {},
  pathRowTitle: { fontFamily: 'Fredoka_600SemiBold', color: '#000' },
  pathRowSub: { fontFamily: 'Nunito_700Bold', color: '#737373' },
});
