import { Image as ExpoImage, type ImageProps as ExpoImageProps } from 'expo-image';
import type { ImageResizeMode, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

const RESIZE_TO_CONTENT_FIT: Record<ImageResizeMode, ExpoImageProps['contentFit']> = {
  cover: 'cover',
  contain: 'contain',
  stretch: 'fill',
  repeat: 'cover',
  center: 'none',
  none: 'none',
};

export type AppImageProps = Omit<ExpoImageProps, 'contentFit' | 'source'> & {
  source: ImageSourcePropType | ExpoImageProps['source'];
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  accessibilityIgnoresInvertColors?: boolean;
};

export function AppImage({
  resizeMode = 'cover',
  transition = 80,
  cachePolicy = 'memory-disk',
  recyclingKey,
  source,
  ...rest
}: AppImageProps) {
  const contentFit = RESIZE_TO_CONTENT_FIT[resizeMode] ?? 'cover';
  const recyclingKeyResolved =
    recyclingKey ?? (typeof source === 'number' ? String(source) : undefined);

  return (
    <ExpoImage
      source={source}
      contentFit={contentFit}
      transition={transition}
      cachePolicy={cachePolicy}
      recyclingKey={recyclingKeyResolved}
      {...rest}
    />
  );
}
