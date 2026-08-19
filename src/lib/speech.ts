/**
 * Web Speech API wrapper, narrowed to what this app needs: reading Korean out
 * loud, reliably, across browsers that each break it in a different way.
 *
 * Everything passed to `speak` must be real Hangul. A bare jamo such as ㄱ
 * (U+3131) is read as the letter's *name* — "기역" — or skipped entirely, which
 * is why `HangulCharacter` carries a `demoSyllable` for every letter.
 */

export type SpeechCapability = {
  supported: boolean;
  /** False when synthesis exists but the device ships no Korean voice at all. */
  hasKoreanVoice: boolean;
};

export type SpeakOptions = {
  /** 1 is the engine default; the app slows things down so learners can follow. */
  rate?: number;
};

export const NORMAL_RATE = 0.85;
export const SLOW_RATE = 0.55;

const VOICE_POLL_INTERVAL_MS = 250;
const VOICE_LOAD_TIMEOUT_MS = 5000;
/** Chrome and Firefox both drop a speak() issued in the same tick as a cancel(). */
const CANCEL_SETTLE_MS = 120;

const UNSUPPORTED: SpeechCapability = { supported: false, hasKoreanVoice: false };

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Android reports `ko_KR` with an underscore; the spec says `ko-KR`. */
function normalizeLang(lang: string): string {
  return lang.replace('_', '-').toLowerCase();
}

let koreanVoice: SpeechSynthesisVoice | null = null;
let capability: SpeechCapability = UNSUPPORTED;

type Listener = (capability: SpeechCapability) => void;
const listeners = new Set<Listener>();
let watching = false;

function pickKoreanVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const korean = voices.filter((voice) => normalizeLang(voice.lang).startsWith('ko'));
  return korean.find((voice) => normalizeLang(voice.lang) === 'ko-kr') ?? korean[0] ?? null;
}

/** Re-reads the voice list and tells everyone if the answer changed. */
function refresh(): SpeechCapability {
  if (!isSpeechSupported()) return capability;

  try {
    koreanVoice = pickKoreanVoice(window.speechSynthesis.getVoices());
  } catch {
    koreanVoice = null;
  }

  const next: SpeechCapability = { supported: true, hasKoreanVoice: koreanVoice !== null };
  if (
    next.supported !== capability.supported ||
    next.hasKoreanVoice !== capability.hasKoreanVoice
  ) {
    capability = next;
    for (const listener of listeners) listener(capability);
  }
  return capability;
}

/**
 * Watches the voice list for as long as the page lives, rather than sampling it
 * once at startup.
 *
 * The one-shot version deadlocked on phones. iOS Safari commonly reports an
 * empty voice list until speech has been triggered from a real user gesture,
 * and Android populates it late — so a startup check concludes "no Korean
 * voice", and if the UI then disables its own sound control the user can never
 * produce the gesture that would have loaded the voices. `voiceschanged` also
 * fires more than once on some engines, which the promise-based version threw
 * away after the first resolution.
 */
function startWatching(): void {
  if (watching || !isSpeechSupported()) return;
  watching = true;

  const synth = window.speechSynthesis;
  synth.addEventListener('voiceschanged', refresh);

  // voiceschanged can fire with an empty list, fire before this listener was
  // attached, or never fire at all, so polling backs it up for a while.
  let elapsed = 0;
  const poll = window.setInterval(() => {
    elapsed += VOICE_POLL_INTERVAL_MS;
    refresh();
    if (capability.hasKoreanVoice || elapsed >= VOICE_LOAD_TIMEOUT_MS) window.clearInterval(poll);
  }, VOICE_POLL_INTERVAL_MS);

  refresh();
}

/**
 * Reports what this device can do, now and whenever that changes. Returns an
 * unsubscribe.
 */
export function subscribeToSpeech(listener: Listener): () => void {
  if (!isSpeechSupported()) {
    listener(UNSUPPORTED);
    return () => {};
  }

  listeners.add(listener);
  startWatching();
  listener(capability);

  return () => {
    listeners.delete(listener);
  };
}

// Chrome garbage-collects an utterance held only by a local variable, cutting
// playback short mid-word. Keeping the live one referenced here prevents that.
let activeUtterance: SpeechSynthesisUtterance | null = null;
let pendingSpeakId: number | null = null;

/**
 * Speaks Hangul. Does nothing when the device has no Korean voice — an English
 * voice reading Hangul produces noise, which is worse for a learner than silence.
 */
export function speak(text: string, { rate = NORMAL_RATE }: SpeakOptions = {}): void {
  if (!text || !capability.hasKoreanVoice) return;

  try {
    const synth = window.speechSynthesis;

    if (pendingSpeakId !== null) {
      window.clearTimeout(pendingSpeakId);
      pendingSpeakId = null;
    }

    const start = () => {
      pendingSpeakId = null;
      const utterance = new SpeechSynthesisUtterance(text);
      // Chrome on Android needs an explicit lang even when a voice is assigned.
      utterance.lang = 'ko-KR';
      utterance.voice = koreanVoice;
      utterance.rate = rate;
      // Released once playback ends, so a finished utterance is not pinned here
      // forever — the reference exists only to outlive the garbage collector.
      utterance.onend = () => {
        if (activeUtterance === utterance) activeUtterance = null;
      };
      activeUtterance = utterance;
      synth.speak(utterance);
    };

    if (synth.speaking || synth.pending) {
      // Interrupting takes a moment to settle; speaking immediately after
      // cancel() gets the new utterance silently dropped.
      synth.cancel();
      pendingSpeakId = window.setTimeout(start, CANCEL_SETTLE_MS);
      return;
    }

    start();
  } catch {
    // Some browsers throw when synthesis is blocked; audio is optional here.
  }
}

let primed = false;

/**
 * iOS Safari and Chrome 71+ refuse speech that does not originate in a user
 * gesture. Speaking a silent utterance during the first tap unlocks the queue,
 * so later calls — including ones a timer fires — are allowed through.
 * Call this from a real event handler, not an effect.
 */
export function primeSpeechOnGesture(): void {
  if (primed || !isSpeechSupported()) return;
  primed = true;

  try {
    const utterance = new SpeechSynthesisUtterance(' ');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Priming is opportunistic; a failure just means the first tap is silent.
  }

  // On iOS this gesture is often what makes the voice list appear at all, so
  // look again now and shortly after.
  refresh();
  window.setTimeout(refresh, 300);
  window.setTimeout(refresh, 1200);
}

/** Test seam — drops every cached decision so a suite can start from scratch. */
export function resetSpeechForTests(): void {
  listeners.clear();
  watching = false;
  koreanVoice = null;
  capability = UNSUPPORTED;
  activeUtterance = null;
  pendingSpeakId = null;
  primed = false;
}
