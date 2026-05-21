import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  View,
} from 'react-native';

/** Figma "Splash Screen" frame 393×852 — node 1009:2384 */
const FIGMA_W = 393;
const FIGMA_H = 852;

export function SplashLayout({ onAnimationComplete }: { onAnimationComplete?: () => void }) {
  const { width: screenW, height: screenH } = Dimensions.get('window');
  const scale = Math.min(screenW / FIGMA_W, screenH / FIGMA_H);

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

  /** Figma logo — node 1009:2403 (260×260 at 66, 235 in 393×852 frame) */
  const logoBox = {
    left: 66 * scale,
    top: 235 * scale,
    width: 260 * scale,
    height: 260 * scale,
  };

  return (
    <View style={styles.root} accessibilityLabel="Nabaat splash screen">
      <Animated.View style={[styles.bgPattern, { opacity: bgOpacity }]}>
        <Image
          source={require('../assets/splash-pattern.png')}
          style={styles.layerFill}
          resizeMode="cover"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.star,
          {
            opacity: starOpacity,
            transform: [{ scale: starScale }],
          },
        ]}
      >
        <Image
          source={require('../assets/splash-star.png')}
          style={styles.layerFill}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.logo,
          logoBox,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
        accessibilityRole="image"
        accessibilityLabel="Nabaat logo"
      >
        <Image
          source={require('../assets/splash-logo.png')}
          style={styles.logoImage}
          resizeMode="cover"
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
    width: '100%',
    height: '100%',
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  star: {
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
