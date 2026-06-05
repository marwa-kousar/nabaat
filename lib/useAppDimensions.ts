import { Platform, useWindowDimensions } from 'react-native';

const MAX_W = 393;

export function useAppDimensions() {
  const { width, height } = useWindowDimensions();
  if (Platform.OS === 'web') {
    return { width: Math.min(width, MAX_W), height };
  }
  return { width, height };
}
