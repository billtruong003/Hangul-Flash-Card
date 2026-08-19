import { useEffect, useState } from 'react';
import { subscribeToSpeech, type SpeechCapability } from '../lib/speech';

const PENDING: SpeechCapability = { supported: false, hasKoreanVoice: false };

/**
 * What this device can read out loud, kept up to date.
 *
 * Not a one-shot check: phones frequently reveal their voice list only after
 * speech has been triggered from a user gesture, so the answer at startup is
 * routinely wrong and has to be allowed to change afterwards.
 */
export function useSpeech(): SpeechCapability {
  const [capability, setCapability] = useState<SpeechCapability>(PENDING);

  useEffect(() => subscribeToSpeech(setCapability), []);

  return capability;
}
