import { useEffect, useState } from 'react';

import { subscribeLessonListenState } from '../lib/lessonSentenceAudio';

/** Word highlight index for a sentence card while its audio is playing. */
export function useLessonListeningWordIndex(sentenceId: string): number | null {
  const [wordIndex, setWordIndex] = useState<number | null>(null);

  useEffect(() => {
    return subscribeLessonListenState((state) => {
      if (!state || state.sourceId !== sentenceId) {
        setWordIndex(null);
        return;
      }
      setWordIndex(state.wordIndex);
    });
  }, [sentenceId]);

  return wordIndex;
}
