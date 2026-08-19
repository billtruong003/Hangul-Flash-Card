import { useEffect, useState } from 'react';
import { initSpeech, type SpeechCapability } from '../lib/speech';

const PENDING: SpeechCapability = { supported: false, hasKoreanVoice: false };

/**
 * Whether this device can actually read Korean out loud.
 *
 * This has to be a hook rather than a module constant: browsers populate the
 * voice list asynchronously, so anything evaluated at import time sees an empty
 * list and concludes — wrongly — that no Korean voice exists.
 *
 * Starts pessimistic and flips once the voice list settles, so the UI never
 * offers a speaker button that would do nothing.
 */
export function useSpeech(): SpeechCapability {
  const [capability, setCapability] = useState<SpeechCapability>(PENDING);

  useEffect(() => {
    let active = true;
    void initSpeech().then((next) => {
      if (active) setCapability(next);
    });
    return () => {
      active = false;
    };
  }, []);

  return capability;
}
