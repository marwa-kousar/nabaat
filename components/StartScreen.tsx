import {
  Fredoka_700Bold,
  useFonts as useFredoka,
} from '@expo-google-fonts/fredoka';
import {
  Nunito_700Bold,
  useFonts as useNunito,
} from '@expo-google-fonts/nunito';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import Svg, { Path } from 'react-native-svg';

import MascotShadowLeft from '../assets/mascot-shadow-left.svg';
import MascotShadowRight from '../assets/mascot-shadow-right.svg';
import StartLogo from '../assets/start-logo.svg';

/** Figma “Start Screen” frame — node 922:9239 (393×852) */
const FIGMA_W = 393;
const FIGMA_H = 852;

type StartScreenProps = {
  onBismillah?: () => void;
};

export function StartScreen({ onBismillah }: StartScreenProps) {
  const { width: W, height: H } = useWindowDimensions();
  const sx = W / FIGMA_W;
  const sy = H / FIGMA_H;

  const [fredokaLoaded] = useFredoka({ Fredoka_700Bold });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold });
  const fontsLoaded = fredokaLoaded && nunitoLoaded;

  const floatL = useRef(new Animated.Value(0)).current;
  const floatR = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    loop(floatL, 0);
    loop(floatR, 400);
  }, [floatL, floatR]);

  const translateL = floatL.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });
  const translateR = floatR.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const btnTranslateY = btnAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4 * sy],
  });

  const onBtnPressIn = () => {
    Animated.timing(btnAnim, { toValue: 1, duration: 60, useNativeDriver: true }).start();
  };
  const onBtnPressOut = () => {
    Animated.spring(btnAnim, { toValue: 0, tension: 300, friction: 20, useNativeDriver: true }).start();
  };

  const box = (l: number, t: number, w: number, h: number) => ({
    position: 'absolute' as const,
    left: l * sx,
    top: t * sy,
    width: w * sx,
    height: h * sy,
  });

  if (!fontsLoaded) {
    return <View style={[styles.root, styles.fontsFallback]} />;
  }

  return (
    <View style={styles.root}>
      <Image
        source={require('../assets/start-bg-bottom.png')}
        style={box(-13, 444, 418, 432)}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />

      <Image
        source={require('../assets/start-mosque.png')}
        style={[box(-16, 413, 425, 177), styles.mosque]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />

      <View style={[box(-38, 0, 468, 325), styles.clip]}>
        <Image
          source={require('../assets/start-bg-top.png')}
          style={styles.bgTopImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </View>

      <Text
        style={[
          styles.title,
          box(11, 181, 371, 68),
          { fontFamily: 'Fredoka_700Bold', fontSize: 32 * sx },
        ]}
      >
        Welcome to Nabaat!
      </Text>

      <Text
        style={[
          styles.subtitle,
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 237 * sy,
            fontFamily: 'Nunito_700Bold',
            fontSize: 20 * sx,
          },
        ]}
      >
        Where Faith Meets Fluency
      </Text>

      <Pressable
        style={box(93, 342, 206, 54)}
        onPress={() => onBismillah?.()}
        onPressIn={onBtnPressIn}
        onPressOut={onBtnPressOut}
      >
        {/* static shadow — stays in place while face drops onto it */}
        <View
          style={{
            position: 'absolute',
            top: 4 * sy,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 25 * sx,
            backgroundColor: '#7C4718',
          }}
        />
        {/* face + label — translates down 4px on press */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 50 * sy,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ translateY: btnTranslateY }],
          }}
        >
          <Svg
            style={StyleSheet.absoluteFillObject}
            viewBox="0 0 206 50"
            preserveAspectRatio="none"
          >
            <Path
              d="M206 25.0359C206 38.8628 194.791 50.0718 180.964 50.0718H25.0359C11.209 50.0718 0 38.8628 0 25.0359C0 11.209 11.209 0 25.0359 0H180.964C194.791 0 206 11.209 206 25.0359Z"
              fill="#FF8C1A"
            />
            <Path
              d="M180.964 49.0718H25.0361C11.7615 49.0718 1 38.3103 1 25.0356C1.00013 11.7611 11.7616 0.999512 25.0361 0.999512H180.964C194.238 0.999512 205 11.7611 205 25.0356C205 38.3103 194.239 49.0718 180.964 49.0718Z"
              fill="none"
              stroke="#7C4718"
              strokeWidth={2}
            />
          </Svg>
          <Text
            style={[
              styles.btnLabel,
              { fontFamily: 'Nunito_700Bold', fontSize: 24 * sx },
            ]}
          >
            Bismillah
          </Text>
        </Animated.View>
      </Pressable>

      <View style={[box(67.21, 744.41, 115.018, 19.89), { pointerEvents: 'none' }]}>
        <MascotShadowLeft width="100%" height="100%" />
      </View>
      <Animated.View
        style={[box(11, 504, 226.577, 339), { transform: [{ translateY: translateL }], pointerEvents: 'none' }]}
      >
        <Image
          source={require('../assets/mascot-nabta.png')}
          style={styles.fill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

      <View style={[box(227.51, 709.09, 119.216, 20.616), { pointerEvents: 'none' }]}>
        <MascotShadowRight width="100%" height="100%" />
      </View>
      <Animated.View
        style={[box(180, 485, 213.333, 320), { transform: [{ translateY: translateR }], pointerEvents: 'none' }]}
      >
        <Image
          source={require('../assets/mascot-mateen.png')}
          style={styles.fill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

      <View style={[box(164, 65, 64.921, 98.163), { pointerEvents: 'none' }]}>
        <StartLogo width="100%" height="100%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#dffaf6',
  },
  fontsFallback: {
    backgroundColor: '#dffaf6',
  },
  clip: {
    overflow: 'hidden',
  },
  bgTopImage: {
    position: 'absolute',
    top: 0,
    left: '-0.07%',
    width: '100.14%',
    height: '228.25%',
  },
  mosque: {
    opacity: 0.21,
  },
  title: {
    color: '#55372d',
    textAlign: 'center',
  },
  subtitle: {
    color: '#71524d',
    textAlign: 'center',
  },
  btnLabel: {
    color: '#ffffff',
    textAlign: 'center',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
});
