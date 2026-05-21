import type { AudioPlayer } from 'expo-audio';

/** Avoids crashes when expo-audio native object was already released (e.g. on unmount). */
export function safeAudioPause(player: AudioPlayer | null | undefined): void {
  if (!player) return;
  try {
    player.pause();
  } catch {
    /* NativeSharedObjectNotFoundException */
  }
}

export async function safeAudioPlayUri(player: AudioPlayer, uri: string): Promise<boolean> {
  try {
    safeAudioPause(player);
    player.replace(uri);
    await player.seekTo(0);
    player.play();
    return true;
  } catch {
    return false;
  }
}
