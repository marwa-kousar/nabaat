import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native';

import SplashBgPattern from '../assets/splash-bg-pattern.svg';
import SplashStar from '../assets/splash-star.svg';

/** Figma "Splash Screen" frame 393×852 — node 1009:2384 */
const FIGMA_W = 393;
const FIGMA_H = 852;

export function SplashLayout({ onAnimationComplete }: { onAnimationComplete?: () => void }) {
  const { width: screenW, height: screenH } = Dimensions.get('window');
  const scale = Math.min(screenW / FIGMA_W, screenH / FIGMA_H);

  const [bgSize, setBgSize] = useState<{ w: number; h: number } | null>(null);
  const [starSize, setStarSize] = useState<{ w: number; h: number } | null>(null);

  const bgOpacity = useRef(new Animated.Value(0)).current;
  const starOpacity = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(0.94)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);
    let holdTimer: ReturnType<typeof setTimeout>;

    const anim = Animated.parallel([
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 720,
        easing,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(90),
        Animated.parallel([
          Animated.timing(starOpacity, {
            toValue: 1,
            duration: 560,
            easing,
            useNativeDriver: true,
          }),
          Animated.spring(starScale, {
            toValue: 1,
            friction: 9,
            tension: 76,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 480,
            easing,
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 8,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    anim.start(({ finished }) => {
      if (finished) {
        holdTimer = setTimeout(() => onAnimationComplete?.(), 800);
      }
    });

    return () => {
      anim.stop();
      clearTimeout(holdTimer);
    };
  }, [onAnimationComplete]);

  const onBgLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBgSize((prev) =>
      prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }
    );
  }, []);

  const onStarLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setStarSize((prev) =>
      prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }
    );
  }, []);

  const logoBox = {
    left: 66 * scale,
    top: 235 * scale,
    width: 260 * scale,
    height: 260 * scale,
  };

  return (
    <View style={styles.root} accessibilityLabel="Nabaat splash screen">
      <View style={styles.bgWrap} onLayout={onBgLayout}>
        <Animated.View style={[styles.layerFill, { opacity: bgOpacity }]}>
          {bgSize && bgSize.w > 0 && bgSize.h > 0 ? (
            <SplashBgPattern width={bgSize.w} height={bgSize.h} />
          ) : null}
        </Animated.View>
      </View>

      <View style={styles.starWrap} onLayout={onStarLayout}>
        <Animated.View
          style={[
            styles.layerFill,
            {
              opacity: starOpacity,
              transform: [{ scale: starScale }],
            },
          ]}
        >
          {starSize && starSize.w > 0 && starSize.h > 0 ? (
            <SplashStar width={starSize.w} height={starSize.h} />
          ) : null}
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.logo,
          logoBox,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../assets/splash-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#e97714',
    overflow: 'visible',
  },
  layerFill: {
    flex: 1,
  },
  bgWrap: {
    position: 'absolute',
    top: '0.03%',
    bottom: 0,
    left: '-17.69%',
    right: '-10.34%',
    zIndex: 0,
  },
  starWrap: {
    position: 'absolute',
    top: '22.65%',
    right: '6.11%',
    bottom: '36.91%',
    left: '6.24%',
    zIndex: 1,
  },
  logo: {
    position: 'absolute',
    zIndex: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
