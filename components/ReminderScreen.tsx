import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  useFonts as useFredoka,
} from '@expo-google-fonts/fredoka';
import {
  NotoSansArabic_500Medium,
  useFonts as useNotoArabic,
} from '@expo-google-fonts/noto-sans-arabic';
import { Nunito_700Bold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  Animated,

  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppImage } from './AppImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import ReminderPagination from '../assets/reminder-pagination.svg';
import ScallopBell from '../assets/reminder-scallop-bell.svg';
import ScallopClock from '../assets/reminder-scallop-clock.svg';
import IconBell from '../assets/reminder-icon-bell.svg';
import IconClock from '../assets/reminder-icon-clock.svg';

import { UiTapPressable } from './UiTapPressable';

/** Figma “Track Screen” (reminders) — node 1160:3334 (393×852) */
const FIGMA_W = 393;
const FIGMA_H = 852;

const ARABIC_HADITH =
 ' أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ';
const ENGLISH_HADITH =
  'The acts most pleasing to Allah are those which are done most continuously, even if they amount to little.';

function defaultNineAm(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

function formatReminderTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type Props = {
  onEnableNotifications?: () => void;
  onMaybeLater?: () => void;
};

function TrackSwitch({
  value,
  onValueChange,
  sx,
  sy,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  sx: number;
  sy: number;
}) {
  const r = Math.min(sx, sy);
  return (
    <UiTapPressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={10}
      style={[
        styles.switchTrack,
        {
          width: 52 * sx,
          height: 32 * sy,
          borderRadius: 16 * r,
          backgroundColor: value ? '#959e17' : '#c9c9b8',
          paddingHorizontal: 3 * sx,
          paddingVertical: 2 * sy,
        },
      ]}
    >
      <View
        style={[
          styles.switchThumb,
          {
            width: 24 * r,
            height: 24 * r,
            borderRadius: 12 * r,
            alignSelf: value ? 'flex-end' : 'flex-start',
          },
        ]}
      />
    </UiTapPressable>
  );
}

export function ReminderScreen({ onEnableNotifications, onMaybeLater }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sx = W / FIGMA_W;
  const sy = H / FIGMA_H;

  const [dailyReminderOn, setDailyReminderOn] = useState(true);
  const [streakProtectionOn, setStreakProtectionOn] = useState(true);
  const [reminderTime, setReminderTime] = useState(defaultNineAm);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [iosPickerDraft, setIosPickerDraft] = useState(defaultNineAm);

  const [fredokaLoaded] = useFredoka({ Fredoka_600SemiBold, Fredoka_500Medium });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold });
  const [notoArLoaded] = useNotoArabic({ NotoSansArabic_500Medium });
  const fontsLoaded = fredokaLoaded && nunitoLoaded && notoArLoaded;

  const btnAnim = useRef(new Animated.Value(0)).current;
  const btnTranslateY = btnAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3 * sy],
  });
  const onBtnIn = () => {
    Animated.timing(btnAnim, { toValue: 1, duration: 60, useNativeDriver: true }).start();
  };
  const onBtnOut = () => {
    Animated.spring(btnAnim, { toValue: 0, tension: 300, friction: 20, useNativeDriver: true }).start();
  };

  const openTimePicker = useCallback(() => {
    setIosPickerDraft(reminderTime);
    setShowTimePicker(true);
  }, [reminderTime]);

  const onAndroidTimeChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && date) {
      setReminderTime(date);
    }
  }, []);

  const confirmIosTime = useCallback(() => {
    setReminderTime(iosPickerDraft);
    setShowTimePicker(false);
  }, [iosPickerDraft]);

  const cancelIosTime = useCallback(() => {
    setShowTimePicker(false);
  }, []);

  const handleEnable = useCallback(() => {
    onEnableNotifications?.();
  }, [onEnableNotifications]);

  if (!fontsLoaded) {
    return <View style={[styles.root, styles.fontsFallback]} />;
  }

  const iconCluster = (scallop: ReactNode, inner: ReactNode) => (
    <View style={{ width: 65 * sx, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 53 * sx, height: 57 * sy }}>
        {scallop}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {inner}
        </View>
      </View>
    </View>
  );

  const cardW = 320 * sx;
  const cardH = 100 * sy;
  const cardGap = 25 * sy;
  const bottomDecorH = 295 * sy;
  const bottomDecorTop = 555 * sy;

  const footerH = 49 * sy + 3 * sy + 21 * sy + Math.max(insets.bottom, 12);

  return (
    <View style={styles.root}>
      {/* Decorative lanterns (Figma opacity 10%) */}
      <View style={[styles.lanternLeft, { left: 19 * sx, width: 80 * sx, height: 156 * sy, pointerEvents: 'none' }]}>
        <AppImage
          source={require('../assets/reminder-lantern.png')}
          style={styles.lanternLeftImg}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </View>
      <View
        style={[styles.lanternRight, { top: -13 * sy, right: 9 * sx, width: 74 * sx, height: 255 * sy, pointerEvents: 'none' }]}
      >
        <AppImage
          source={require('../assets/reminder-lantern.png')}
          style={styles.lanternRightImg}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </View>

      {/* Bottom landscape */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: bottomDecorTop,
          height: bottomDecorH,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <AppImage
          source={require('../assets/reminder-bg-bottom.png')}
          style={{
            position: 'absolute',
            width: W,
            height: bottomDecorH * 2.1399,
            top: -bottomDecorH * 1.1377,
            left: 0,
          }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </View>

      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 8) + 12 * sy,
          paddingBottom: footerH + 24 * sy,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: 70 * sx, height: 7 * sy, marginTop: 8 * sy }}>
          <ReminderPagination width="100%" height="100%" />
        </View>

        <Text style={[styles.titleBlock, { marginTop: 14 * sy, paddingHorizontal: 20 * sx }]}>
          <Text style={{ fontFamily: 'Fredoka_600SemiBold', color: '#000000', fontSize: 32 * sx }}>
            Stay on{'\n'}
          </Text>
          <Text style={{ fontFamily: 'Fredoka_600SemiBold', color: '#959e17', fontSize: 32 * sx }}>
            Track
          </Text>
        </Text>

        <View
          style={[
            styles.quoteRow,
            {
              marginTop: 3 * sy,
              width: 319 * sx,
              paddingHorizontal: 0,
            },
          ]}
        >
          <AppImage
            source={require('../assets/reminder-ornament.png')}
            style={{ width: 16 * sx, height: 32 * sy }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text
            style={[
              styles.arabicHadith,
              {
                flex: 1,
                marginHorizontal: 6 * sx,
                fontSize: 20 * sx,
              },
            ]}
          >
            {ARABIC_HADITH}
          </Text>
          <View style={{ transform: [{ rotate: '180deg' }, { scaleY: -1 }] }}>
            <AppImage
              source={require('../assets/reminder-ornament.png')}
              style={{ width: 16 * sx, height: 32 * sy }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
        </View>

        <Text
          style={[
            styles.englishHadith,
            {
              marginTop: 6 * sy,
              fontSize: 16 * sx,
              maxWidth: 352 * sx,
              lineHeight: Math.round(19 * sx),
              paddingHorizontal: 8 * sx,
            },
          ]}
        >
          {ENGLISH_HADITH}
        </Text>

        {/* Cards — Figma y 287, 412, 538; gap 25 */}
        <View style={{ marginTop: 19 * sy, width: cardW }}>
          {/* Daily Reminder */}
          <View
            style={[
              styles.card,
              {
                width: cardW,
                height: cardH,
                borderRadius: 27 * sx,
                marginBottom: cardGap,
                flexDirection: 'row',
                alignItems: 'center',
                paddingLeft: 12 * sx,
                paddingRight: 12 * sx,
              },
            ]}
          >
            {iconCluster(
              <ScallopBell width={53 * sx} height={57 * sy} />,
              <IconBell width={33 * sx} height={33 * sy} />,
            )}
            <View style={{ flex: 1, marginLeft: 4 * sx, justifyContent: 'center' }}>
              <Text style={[styles.cardTitle, { fontSize: 16 * sx }]}>Daily Reminder</Text>
              <Text style={[styles.cardSubtitle, { fontSize: 12 * sx, marginTop: 4 * sy }]}>
                Get notified to practice
              </Text>
            </View>
            <TrackSwitch value={dailyReminderOn} onValueChange={setDailyReminderOn} sx={sx} sy={sy} />
          </View>

          {/* Reminder Time */}
          <View
            style={[
              styles.card,
              {
                width: cardW,
                height: cardH,
                borderRadius: 27 * sx,
                marginBottom: cardGap,
                flexDirection: 'row',
                alignItems: 'center',
                paddingLeft: 12 * sx,
                paddingRight: 12 * sx,
              },
            ]}
          >
            {iconCluster(
              <ScallopClock width={53 * sx} height={57 * sy} />,
              <IconClock width={33 * sx} height={33 * sy} />,
            )}
            <View style={{ flex: 1, marginLeft: 4 * sx, justifyContent: 'center' }}>
              <Text style={[styles.cardTitle, { fontSize: 16 * sx }]}>Reminder Time</Text>
              <Text style={[styles.cardSubtitle, { fontSize: 12 * sx, marginTop: 4 * sy }]}>
                {formatReminderTime(reminderTime)}
              </Text>
            </View>
            <UiTapPressable onPress={openTimePicker} hitSlop={8}>
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 16 * sx, color: '#959e17' }}>Change</Text>
            </UiTapPressable>
          </View>

          {/* Streak Protection */}
          <View
            style={[
              styles.card,
              {
                width: cardW,
                height: cardH,
                borderRadius: 27 * sx,
                flexDirection: 'row',
                alignItems: 'center',
                paddingLeft: 12 * sx,
                paddingRight: 12 * sx,
              },
            ]}
          >
            {iconCluster(
              <ScallopClock width={53 * sx} height={57 * sy} />,
              <AppImage
                source={require('../assets/reminder-icon-shield.png')}
                style={{ width: 33 * sx, height: 33 * sy }}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />,
            )}
            <View style={{ flex: 1, marginLeft: 4 * sx, justifyContent: 'center' }}>
              <Text style={[styles.cardTitle, { fontSize: 16 * sx }]}>Streak Protection</Text>
              <Text style={[styles.cardSubtitle, { fontSize: 12 * sx, marginTop: 4 * sy }]}>
                Remind if streak at risk
              </Text>
            </View>
            <TrackSwitch value={streakProtectionOn} onValueChange={setStreakProtectionOn} sx={sx} sy={sy} />
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            paddingHorizontal: ((FIGMA_W - 310) / 2) * sx,
            pointerEvents: 'box-none',
          },
        ]}
      >
        <UiTapPressable
          onPressIn={onBtnIn}
          onPressOut={onBtnOut}
          onPress={handleEnable}
          style={{ width: 310 * sx, height: (49 + 3) * sy, alignSelf: 'center' }}
        >
          <View
            style={{
              position: 'absolute',
              top: 3 * sy,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 10 * sx,
              backgroundColor: '#7c4718',
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 49 * sy,
              borderRadius: 10 * sx,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#959e17',
              borderWidth: 1,
              borderColor: '#7c4718',
              transform: [{ translateY: btnTranslateY }],
            }}
          >
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 16 * sx, color: '#ffffff' }}>
              Enable Notifications
            </Text>
          </Animated.View>
        </UiTapPressable>

        <UiTapPressable onPress={onMaybeLater} style={{ marginTop: 9 * sy, alignSelf: 'center', paddingVertical: 6 * sy }}>
          <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14 * sx, color: '#7c711d' }}>Maybe Later</Text>
        </UiTapPressable>
      </View>

      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={onAndroidTimeChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
        >
          <View style={styles.timeModalRoot}>
            <UiTapPressable
              disableUiTapSound
              style={styles.timeModalBackdrop}
              onPress={cancelIosTime}
              accessibilityLabel="Dismiss"
            />
            <View style={styles.timeModalSheet}>
              <View style={styles.timeModalHeader}>
                <UiTapPressable onPress={cancelIosTime} hitSlop={12}>
                  <Text style={styles.timeModalCancelBtn}>Cancel</Text>
                </UiTapPressable>
                <UiTapPressable onPress={confirmIosTime} hitSlop={12}>
                  <Text style={styles.timeModalDoneBtn}>Done</Text>
                </UiTapPressable>
              </View>
              <DateTimePicker
                value={iosPickerDraft}
                mode="time"
                display="spinner"
                themeVariant="light"
                onChange={(_, d) => {
                  if (d) setIosPickerDraft(d);
                }}
              />
              <View style={{ height: Math.max(insets.bottom, 12) }} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f1f4cb',
  },
  fontsFallback: {
    backgroundColor: '#f1f4cb',
  },
  lanternLeft: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
    opacity: 0.1,
  },
  lanternLeftImg: {
    position: 'absolute',
    width: '380%',
    height: '195%',
    left: '-21%',
    top: '-33%',
  },
  lanternRight: {
    position: 'absolute',
    overflow: 'hidden',
    opacity: 0.1,
  },
  lanternRightImg: {
    position: 'absolute',
    width: '620%',
    height: '180%',
    left: '-466%',
    top: '-26%',
  },
  titleBlock: {
    textAlign: 'center',
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicHadith: {
    fontFamily: 'NotoSansArabic_500Medium',
    color: '#737373',
    textAlign: 'center',
  },
  englishHadith: {
    fontFamily: 'Fredoka_500Medium',
    color: '#737373',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#7c4718',
    shadowColor: '#7c4718',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardTitle: {
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
  },
  cardSubtitle: {
    fontFamily: 'Nunito_700Bold',
    color: '#737373',
  },
  switchTrack: {
    justifyContent: 'center',
  },
  switchThumb: {
    backgroundColor: '#ffffff',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    elevation: 10,
  },
  timeModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    height: '100%',
  },
  timeModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  timeModalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  timeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  timeModalCancelBtn: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#737373',
  },
  timeModalDoneBtn: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#959e17',
  },
});
