import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const TAP_ASSET = require('../assets/ui-tap.wav');

let player: AudioPlayer | null = null;
let audioModePrimed = false;

async function primeAudioMode(): Promise<void> {
  if (audioModePrimed) return;
  audioModePrimed = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
  } catch {
    audioModePrimed = false;
  }
}

function getPlayer(): AudioPlayer {
  if (!player) {
    player = createAudioPlayer(TAP_ASSET, {
      updateInterval: 2000,
      keepAudioSessionActive: true,
    });
    player.volume = 0.42;
  }
  return player;
}

/** Short UI tap — safe to fire-and-forget from `onPress` (not `onPressIn`, avoids scroll noise). */
export function playUiTap(): void {
  void (async () => {
    try {
      await primeAudioMode();
      const p = getPlayer();
      if (p.isLoaded) {
        await p.seekTo(0);
      }
      p.play();
    } catch {
      // ignore — missing asset, web quirks, etc.
    }
  })();
}
