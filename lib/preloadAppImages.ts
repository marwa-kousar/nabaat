import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { InteractionManager } from 'react-native';

import { APP_IMAGE_MODULES } from './appImageModules';

const loaded = new Set<number>();
const BATCH_SIZE = 4;

let preloadPromise: Promise<void> | null = null;

async function preloadOne(moduleId: number): Promise<void> {
  if (loaded.has(moduleId)) return;
  const asset = Asset.fromModule(moduleId);
  if (!asset.downloaded) {
    await asset.downloadAsync();
  }
  const uri = asset.localUri ?? asset.uri;
  if (uri) {
    await Image.prefetch(uri);
  }
  loaded.add(moduleId);
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
}

async function preloadModulesInBatches(modules: readonly number[]): Promise<void> {
  for (let i = 0; i < modules.length; i += BATCH_SIZE) {
    const batch = modules.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((moduleId) => preloadOne(moduleId)));
    if (i + BATCH_SIZE < modules.length) {
      await yieldToUi();
    }
  }
}

/** Warms bundled images after splash / during onboarding so screens render without pop-in. */
export function ensureAppImagesPreloaded(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = preloadModulesInBatches(APP_IMAGE_MODULES);
  }
  return preloadPromise;
}
